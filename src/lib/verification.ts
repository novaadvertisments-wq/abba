// Day 13: the ABBA poster and the screenshots a Nova sends as proof of reach.
// Photos go to a private bucket. The database runs the free automatic checks.
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

const MAX_SHOT_BYTES = 5 * 1024 * 1024; // 5 MB, the same limit the bucket enforces

export type ShotKind = "poster_live" | "poster_views" | "story_views";

export const SHOT_KINDS: { id: ShotKind; label: string; help: string; needsViews: boolean }[] = [
  { id: "poster_live", label: "My poster is live", help: "A screenshot of the ABBA poster posted on your account, with the code showing.", needsViews: false },
  { id: "poster_views", label: "Poster views", help: "A screenshot of how many people viewed the poster. Send it near the end of the 7 days.", needsViews: true },
  { id: "story_views", label: "My own posts", help: "A screenshot of the view count on one of your recent normal posts or stories.", needsViews: true },
];

export type Poster = {
  account_id: string;
  poster_id: string;
  code: string;
  issued_at: string;
  expires_at: string;
  active: boolean;
  live_count: number;
  views_count: number;
  story_count: number;
  review_count: number;
};

export type Shot = { id: string; kind: ShotKind; reported_views: number | null; status: "received" | "needs_review"; created_at: string };

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

// The database writes its messages for people (for example "This screenshot has already been used").
function fromError(error: { code?: string; message: string }): Failure {
  return error.code === "P0001" ? { ok: false, message: error.message } : FAIL;
}

export async function loadPosters(): Promise<{ ok: true; posters: Poster[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("my_posters");
    if (error) return FAIL;
    return { ok: true, posters: (data ?? []) as Poster[] };
  } catch {
    return FAIL;
  }
}

export async function getPoster(accountId: string): Promise<{ ok: true; poster: Poster } | Failure> {
  try {
    const { data, error } = await supabase.rpc("issue_poster", { p_account: accountId });
    if (error) return fromError(error);
    if (!data?.[0]) return FAIL;
    const loaded = await loadPosters();
    if (!loaded.ok) return loaded;
    const poster = loaded.posters.find((p) => p.poster_id === data[0].poster_id);
    return poster ? { ok: true, poster } : FAIL;
  } catch {
    return FAIL;
  }
}

export async function loadShots(posterId: string): Promise<{ ok: true; shots: Shot[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("my_shots", { p_poster: posterId });
    if (error) return FAIL;
    return { ok: true, shots: (data ?? []) as Shot[] };
  } catch {
    return FAIL;
  }
}

// A short "fingerprint" of the file, so the same screenshot cannot be sent twice.
// (A very small change to the picture makes a new fingerprint. Spotting edited or reused pictures is
// the job of the automatic reading we add on Day 14.)
export function fingerprint(bytes: Uint8Array): string {
  let h1 = 0xdeadbeef ^ bytes.length;
  let h2 = 0x41c6ce57 ^ bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    h1 = Math.imul(h1 ^ b, 2654435761);
    h2 = Math.imul(h2 ^ b, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return hex(h2) + hex(h1);
}

export function parseViews(value: string): number | null {
  const digits = value.replace(/[,\s]/g, "");
  if (!/^\d{1,10}$/.test(digits)) return null;
  const n = Number(digits);
  return n >= 1 && n <= 1000000000 ? n : null;
}

// Opens the gallery, checks the picture, uploads it, then records it (the database runs its checks).
// Returns "received" or "needs_review", or null if the person closed the gallery without choosing.
export async function sendScreenshot(
  userId: string,
  posterId: string,
  kind: ShotKind,
  views: number | null,
): Promise<{ ok: true; status: "received" | "needs_review" | null } | Failure> {
  let uploadedPath = "";
  try {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (picked.canceled || !picked.assets?.[0]) return { ok: true, status: null };
    const asset = picked.assets[0];
    const mime = asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : "image/jpeg";
    const buffer = await (await fetch(asset.uri)).arrayBuffer();
    if (buffer.byteLength < 1024) return { ok: false, message: "That image is too small to read. Choose the full screenshot." };
    if (buffer.byteLength > MAX_SHOT_BYTES) return { ok: false, message: "That screenshot is too big. Choose one under 5 MB." };
    const hash = fingerprint(new Uint8Array(buffer));
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${hash}.${ext}`;
    const up = await supabase.storage.from("verification-shots").upload(path, buffer, { contentType: mime });
    if (up.error) {
      // The same file chosen twice lands on the same path, which the storage reports as "already exists".
      const dup = /exist|duplicate/i.test(up.error.message);
      return dup ? { ok: false, message: "This screenshot has already been used. Send a new screenshot." } : FAIL;
    }
    uploadedPath = path;
    const { data, error } = await supabase.rpc("submit_shot", {
      p_poster: posterId,
      p_kind: kind,
      p_path: path,
      p_hash: hash,
      p_bytes: buffer.byteLength,
      p_views: views,
    });
    if (error) {
      // Not accepted: remove the uploaded file again (allowed because it is not recorded).
      await supabase.storage.from("verification-shots").remove([path]).catch(() => undefined);
      return fromError(error);
    }
    uploadedPath = "";
    return { ok: true, status: data === "needs_review" ? "needs_review" : "received" };
  } catch {
    if (uploadedPath) await supabase.storage.from("verification-shots").remove([uploadedPath]).catch(() => undefined);
    return FAIL;
  }
}
