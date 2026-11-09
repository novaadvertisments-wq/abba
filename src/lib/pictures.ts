// Profile pictures and banners: choosing, uploading, showing and removing.
// The files live in the "avatars" storage bucket, one folder per person.
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

export type PictureKind = "avatar" | "banner";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, the same limit the database enforces

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

// The web address of a stored picture, or "" when there is none.
export function pictureUrl(path: string | null | undefined): string {
  if (!path) return "";
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function loadMyPictures(
  userId: string,
): Promise<{ ok: true; avatar: string; banner: string } | Failure> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_path, banner_path")
      .eq("id", userId)
      .maybeSingle();
    if (error) return FAIL;
    return { ok: true, avatar: pictureUrl(data?.avatar_path), banner: pictureUrl(data?.banner_path) };
  } catch {
    return FAIL;
  }
}

// Opens the phone's photo picker, then uploads the chosen photo.
// Returns ok with changed:false when the person simply closed the picker.
export async function chooseAndUpload(
  userId: string,
  kind: PictureKind,
): Promise<{ ok: true; changed: boolean } | Failure> {
  try {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: kind === "avatar" ? [1, 1] : [3, 1],
      quality: 0.6,
    });
    if (picked.canceled || !picked.assets?.[0]) return { ok: true, changed: false };
    const asset = picked.assets[0];

    const buffer = await (await fetch(asset.uri)).arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return { ok: false, message: "That photo is too big. Choose one under 5 MB." };
    }
    const type = asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : "image/jpeg";
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    // A new file name each time, so the new picture shows straight away.
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;

    const up = await supabase.storage.from("avatars").upload(path, buffer, { contentType: type });
    if (up.error) return FAIL;
    const save = await supabase.rpc("set_my_picture", { p_kind: kind, p_path: path });
    if (save.error) return FAIL;
    await removeOldFiles(userId, kind, path);
    return { ok: true, changed: true };
  } catch {
    return FAIL;
  }
}

export async function removePicture(userId: string, kind: PictureKind): Promise<{ ok: true } | Failure> {
  try {
    const save = await supabase.rpc("set_my_picture", { p_kind: kind, p_path: "" });
    if (save.error) return FAIL;
    await removeOldFiles(userId, kind, "");
    return { ok: true };
  } catch {
    return FAIL;
  }
}

// Tidy up: delete earlier files of this kind. Failing here is harmless.
async function removeOldFiles(userId: string, kind: PictureKind, keep: string) {
  try {
    const list = await supabase.storage.from("avatars").list(userId, { limit: 100 });
    const old = (list.data ?? [])
      .map((f) => `${userId}/${f.name}`)
      .filter((p) => p.startsWith(`${userId}/${kind}-`) && p !== keep);
    if (old.length) await supabase.storage.from("avatars").remove(old);
  } catch {
    // ignore
  }
}
