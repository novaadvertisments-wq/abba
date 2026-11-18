// Day 13: the ABBA poster and the screenshots a Nova sends as proof of reach.
// Two rounds: round 1 is the full check, round 2 (on a day ABBA picks) is one screenshot of a second poster.
// Views are never typed in; they are read from the screenshots (Day 14).
// Photos go to a private bucket. The database runs the free automatic checks.
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

const MAX_SHOT_BYTES = 5 * 1024 * 1024; // 5 MB, the same limit the bucket enforces

export type ShotKind = "poster_views" | "story_views" | "profile";

export const SHOT_KINDS: { id: ShotKind; label: string; help: string }[] = [
  { id: "poster_views", label: "Poster views", help: "A screenshot of who viewed the poster, taken a few hours after posting and before it disappears." },
  { id: "profile", label: "My profile", help: "A screenshot of your profile page, showing your name, your followers and the views on your recent posts. Send it before you post the ABBA poster." },
  { id: "story_views", label: "My own post", help: "A screenshot of the views on one of your own recent posts or stories." },
];

// Where a Nova is in the reach check for one account.
export type CheckState = "round1_start" | "round1" | "wait2" | "ready2" | "round2" | "review";

export type Check = {
  account_id: string;
  state: CheckState;
  round2_date: string | null; // the day ABBA picked for round 2, as YYYY-MM-DD
  poster_id: string;
  code: string;
  issued_at: string;
  expires_at: string;
  active: boolean;
  round: 1 | 2;
  views_count: number;
  own_count: number;
  own_open: boolean; // a screenshot of the Nova's own post can still be sent
  own_poster_id: string;
};

// What the Nova may see about a screenshot: only an outcome, never the reasons.
export type Outcome = "checking" | "accepted" | "retry" | "review" | "foul";
export type Shot = { id: string; kind: ShotKind; created_at: string; outcome: Outcome };

// Where one box (poster views, or my own post) stands: what can be sent now.
export type BoxState = "open" | "checking" | "wait" | "retry" | "accepted" | "review" | "foul";
export type Box = { poster_id: string; kind: ShotKind; state: BoxState; tries: number; retry_at: string | null };

export const OUTCOME_TEXT: Record<Outcome, string> = {
  checking: "Checking",
  accepted: "Accepted",
  retry: "Send another",
  review: "A person will check it",
  foul: "Flagged for suspected foul play",
};

export const FOUL_TEXT =
  "This screenshot was flagged for suspected foul play. Please don't worry, it could be an honest mistake. A person will review it and you will get feedback.";

export const WAIT_NOTE = "Received. Expect a result within about an hour. If a person needs to look at it, it can take up to 24 hours.";

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

// The database writes its messages for people (for example "This screenshot has already been used").
function fromError(error: { code?: string; message: string }): Failure {
  return error.code === "P0001" ? { ok: false, message: error.message } : FAIL;
}

export async function loadChecks(): Promise<{ ok: true; checks: Check[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("my_checks");
    if (error) return FAIL;
    return { ok: true, checks: (data ?? []) as Check[] };
  } catch {
    return FAIL;
  }
}

// Asks for a poster: round 1 the first time, round 2 on the day ABBA picked. Returns the fresh state.
export async function getPoster(accountId: string): Promise<{ ok: true; check: Check } | Failure> {
  try {
    const { data, error } = await supabase.rpc("issue_poster", { p_account: accountId });
    if (error) return fromError(error);
    if (!data?.[0]) return FAIL;
    const loaded = await loadChecks();
    if (!loaded.ok) return loaded;
    const check = loaded.checks.find((c) => c.account_id === accountId);
    return check ? { ok: true, check } : FAIL;
  } catch {
    return FAIL;
  }
}

export async function loadBoxes(accountId: string): Promise<{ ok: true; boxes: Box[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("my_boxes", { p_account: accountId });
    if (error) return FAIL;
    return { ok: true, boxes: (data ?? []) as Box[] };
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

// Reads the chosen picture. Some phones hand over gallery pictures in a way the first method reads as empty,
// so a second method is tried and the bigger result is used.
async function readPickedBytes(uri: string): Promise<ArrayBuffer> {
  let best: ArrayBuffer = new ArrayBuffer(0);
  try {
    const first = await (await fetch(uri)).arrayBuffer();
    if (first.byteLength >= 1024) return first;
    best = first;
  } catch {
    // try the next way
  }
  try {
    const { File } = await import("expo-file-system");
    const second = await new File(uri).arrayBuffer();
    if (second.byteLength > best.byteLength) best = second;
  } catch {
    // keep what we have
  }
  return best;
}

// Opens the gallery, checks the picture, uploads it, then records it (the database runs its checks).
// Returns "received" (never a flag), or null if the person closed the gallery without choosing.
export async function sendScreenshot(
  userId: string,
  posterId: string,
  kind: ShotKind,
): Promise<{ ok: true; status: "received" | null } | Failure> {
  let uploadedPath = "";
  try {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (picked.canceled || !picked.assets?.[0]) return { ok: true, status: null };
    const asset = picked.assets[0];
    const mime = asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : "image/jpeg";
    const buffer = await readPickedBytes(asset.uri);
    if (buffer.byteLength < 1024) {
      const kb = Math.round(buffer.byteLength / 1024);
      return { ok: false, message: `The phone gave us an empty picture (${kb} KB). Please try choosing the screenshot again.` };
    }
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
    });
    if (error) {
      // Not accepted: remove the uploaded file again (allowed because it is not recorded).
      await supabase.storage.from("verification-shots").remove([path]).catch(() => undefined);
      return fromError(error);
    }
    uploadedPath = "";
    void data; // the database may flag a screenshot for a person to look at; the Nova is not told
    askToRead(path); // do not wait for it: the reading happens in the background
    return { ok: true, status: "received" };
  } catch {
    if (uploadedPath) await supabase.storage.from("verification-shots").remove([uploadedPath]).catch(() => undefined);
    return FAIL;
  }
}

// Asks the server to read one screenshot with the AI (Day 14). It never waits and never shows anything: if the
// network drops, the reading is simply asked for again the next time the Rank screen opens.
export function askToRead(path: string): void {
  supabase.functions.invoke("read-shot", { body: { file_path: path } }).catch(() => undefined);
}

// Asks again for any of my screenshots that were not read yet (for example after a bad network).
export async function readPendingShots(): Promise<void> {
  try {
    const { data, error } = await supabase.rpc("my_unread_shots");
    if (error || !Array.isArray(data)) return;
    for (const row of data as { file_path: string }[]) askToRead(row.file_path);
  } catch {
    // ignore
  }
}
