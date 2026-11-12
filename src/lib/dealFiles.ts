// Deal files: what the business wants the Nova to post (a flyer or video, a caption, tags, a link).
// Files live in the private "deal-files" bucket, one folder per business.
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB, the same limit the bucket enforces
const MAX_VIDEO_SECONDS = 30;

export type DealBrief = {
  caption: string;
  tags: string;
  link: string;
  file_path: string;
  file_kind: "" | "image" | "video";
  file_name: string;
  i_saved?: boolean; // the Nova already saved the file to the phone
};

export type Target = { offerId?: string; groupId?: string };
type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

export async function loadBrief(t: Target): Promise<{ ok: true; brief: DealBrief | null } | Failure> {
  try {
    const { data, error } = await supabase.rpc("get_deal_brief", {
      p_offer: t.offerId ?? null,
      p_group: t.groupId ?? null,
    });
    if (error) return FAIL;
    const row = Array.isArray(data) ? data[0] : data;
    return { ok: true, brief: row ?? null };
  } catch {
    return FAIL;
  }
}

export async function saveBrief(t: Target, b: DealBrief): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.rpc("save_deal_brief", {
      p_offer: t.offerId ?? null,
      p_group: t.groupId ?? null,
      p_caption: b.caption,
      p_tags: b.tags,
      p_link: b.link,
      p_file_path: b.file_path,
      p_file_kind: b.file_kind,
      p_file_name: b.file_name,
    });
    if (error) {
      // The database's own messages (for example about phone numbers) are written for people.
      return error.code === "P0001" ? { ok: false, message: error.message } : FAIL;
    }
    return { ok: true };
  } catch {
    return FAIL;
  }
}

// Opens the phone's gallery for a photo or a short video, checks the size, then uploads it.
export async function chooseAndUploadFile(
  userId: string,
): Promise<{ ok: true; file: { path: string; kind: "image" | "video"; name: string } | null } | Failure> {
  try {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.6,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (picked.canceled || !picked.assets?.[0]) return { ok: true, file: null };
    const asset = picked.assets[0];
    const isVideo = asset.type === "video";
    if (isVideo && asset.duration && asset.duration > MAX_VIDEO_SECONDS * 1000 + 500) {
      return { ok: false, message: `Videos can be up to ${MAX_VIDEO_SECONDS} seconds. Choose a shorter one.` };
    }
    const buffer = await (await fetch(asset.uri)).arrayBuffer();
    if (buffer.byteLength > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
      return { ok: false, message: isVideo ? "That video is too big. Choose one under 25 MB." : "That photo is too big. Choose one under 5 MB." };
    }
    const type = isVideo
      ? asset.mimeType === "video/quicktime" ? "video/quicktime" : "video/mp4"
      : asset.mimeType === "image/png" || asset.mimeType === "image/webp" ? asset.mimeType : "image/jpeg";
    const ext = type === "video/quicktime" ? "mov" : type === "video/mp4" ? "mp4" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const up = await supabase.storage.from("deal-files").upload(path, buffer, { contentType: type });
    if (up.error) return FAIL;
    return { ok: true, file: { path, kind: isVideo ? "video" : "image", name: asset.fileName || `${isVideo ? "video" : "flyer"}.${ext}` } };
  } catch {
    return FAIL;
  }
}

// Deleting an old file when it is replaced. Failing here is harmless.
export async function removeFile(path: string) {
  try {
    if (path) await supabase.storage.from("deal-files").remove([path]);
  } catch {
    // ignore
  }
}

// A link that works for 10 minutes, so the file is never public.
export async function fileLink(path: string): Promise<string> {
  try {
    const { data } = await supabase.storage.from("deal-files").createSignedUrl(path, 600);
    return data?.signedUrl ?? "";
  } catch {
    return "";
  }
}

// Downloads the file and puts it on the phone. First choice: the gallery. If this phone (or Expo Go) cannot
// do that, the Nova picks a folder instead (for example Downloads). Returns a message for people.
export async function saveFileToPhone(target: Target, brief: DealBrief): Promise<{ ok: true } | Failure> {
  type Temp = { uri: string; delete: () => void; copy: (to: unknown) => void };
  let temp: Temp | null = null;
  try {
    const { Directory, File, Paths } = await import("expo-file-system");
    // 1. Download through a short-lived private link.
    const url = await fileLink(brief.file_path);
    if (!url) return { ok: false, message: "We could not get the file. Check your internet and try again." };
    const ext = brief.file_path.split(".").pop() || (brief.file_kind === "video" ? "mp4" : "jpg");
    const dir = new Directory(Paths.cache, "abba-save");
    if (!dir.exists) dir.create();
    const dest = new File(dir, `abba-${Date.now()}.${ext}`);
    temp = (await File.downloadFileAsync(url, dest, { idempotent: true })) as unknown as Temp;

    // 2. Gallery first. The check below stops the app from loading a module this phone does not have.
    let saved = false;
    let denied = false;
    try {
      const { requireOptionalNativeModule } = await import("expo-modules-core");
      if (requireOptionalNativeModule("ExpoMediaLibrary")) {
        const MediaLibrary = await import("expo-media-library/legacy");
        // Ask to ADD to the gallery only; we never read the person's photos.
        const perm = await MediaLibrary.requestPermissionsAsync(true);
        if (perm.granted) {
          await MediaLibrary.saveToLibraryAsync(temp.uri);
          saved = true;
        } else {
          denied = true;
        }
      }
    } catch {
      // fall through to the folder choice
    }

    // 3. Otherwise the Nova chooses a folder (works in Expo Go too).
    if (!saved) {
      try {
        const folder = await Directory.pickDirectoryAsync();
        temp.copy(folder);
        saved = true;
      } catch {
        return {
          ok: false,
          message: denied
            ? "ABBA needs permission to save, or pick a folder when asked. You can also use Having trouble? Open in browser."
            : "We could not save it to your phone. Try again, or use Having trouble? Open in browser.",
        };
      }
    }
  } catch {
    return { ok: false, message: "We could not save it to your phone. Try again, or use Having trouble? Open in browser." };
  } finally {
    try {
      temp?.delete();
    } catch {
      // ignore
    }
  }
  // Recording the save is best effort: the file is already on the phone.
  try {
    await supabase.rpc("mark_deal_file_saved", { p_offer: target.offerId ?? null, p_group: target.groupId ?? null });
  } catch {
    // ignore
  }
  return { ok: true };
}
