// Everything the Nova profile screen needs to talk to the database.
// Each function returns { ok: true, ... } or { ok: false, message }.

import { supabase } from "./supabase";

export type Platform =
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "snapchat"
  | "youtube"
  | "whatsapp";

export const PLATFORMS: { id: Platform; label: string; followersLabel: string; handleLabel: string; viewsLabel: string }[] = [
  { id: "instagram", label: "Instagram", followersLabel: "Followers", handleLabel: "Instagram handle", viewsLabel: "Average story views" },
  { id: "tiktok", label: "TikTok", followersLabel: "Followers", handleLabel: "TikTok handle", viewsLabel: "Average views per video" },
  { id: "x", label: "X", followersLabel: "Followers", handleLabel: "X handle", viewsLabel: "Average views per post" },
  { id: "facebook", label: "Facebook", followersLabel: "Followers", handleLabel: "Page or profile name", viewsLabel: "Average story views" },
  { id: "snapchat", label: "Snapchat", followersLabel: "Followers", handleLabel: "Snapchat username", viewsLabel: "Average story views" },
  { id: "youtube", label: "YouTube", followersLabel: "Subscribers", handleLabel: "Channel name", viewsLabel: "Average views per video" },
  { id: "whatsapp", label: "WhatsApp Status", followersLabel: "Contacts who see your status", handleLabel: "WhatsApp number", viewsLabel: "Average status views" },
];

export function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export const CITIES = ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Other"];

export type NovaAccount = {
  id: string;
  platform: Platform;
  handle: string;
  followers: number;
  avg_views: number;
  verified: boolean;
};

export type NovaProfileData = {
  city: string;
  area: string;
  multiPlatform: boolean;
  accounts: NovaAccount[];
};

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

export async function loadNovaProfile(
  userId: string,
): Promise<({ ok: true } & NovaProfileData) | Failure> {
  try {
    const [p, a] = await Promise.all([
      supabase.from("nova_profiles").select("city, area, multi_platform").eq("id", userId).maybeSingle(),
      supabase
        .from("nova_accounts")
        .select("id, platform, handle, followers, avg_views, verified")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);
    if (p.error || a.error) return FAIL;
    return {
      ok: true,
      city: p.data?.city ?? "",
      area: p.data?.area ?? "",
      multiPlatform: p.data?.multi_platform ?? false,
      accounts: (a.data ?? []) as NovaAccount[],
    };
  } catch {
    return FAIL;
  }
}

export async function saveLocation(
  userId: string,
  city: string,
  area: string,
): Promise<{ ok: true } | Failure> {
  try {
    // Try to change the existing row first; if there is none yet, create it.
    const upd = await supabase
      .from("nova_profiles")
      .update({ city, area, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id");
    if (upd.error) return FAIL;
    if (upd.data && upd.data.length > 0) return { ok: true };

    const ins = await supabase.from("nova_profiles").insert({ id: userId, city, area });
    return ins.error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}

export async function addAccount(
  userId: string,
  platform: Platform,
  handle: string,
  followers: number,
  avgViews: number,
): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase
      .from("nova_accounts")
      .insert({ user_id: userId, platform, handle, followers, avg_views: avgViews });
    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: `You already added ${platformLabel(platform)}. Tap it in the list to change it.` };
      }
      return FAIL;
    }
    return { ok: true };
  } catch {
    return FAIL;
  }
}

export async function updateAccount(
  id: string,
  handle: string,
  followers: number,
  avgViews: number,
): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase
      .from("nova_accounts")
      .update({ handle, followers, avg_views: avgViews })
      .eq("id", id);
    return error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}

export async function removeAccount(id: string): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.from("nova_accounts").delete().eq("id", id);
    return error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}

// Whether this Nova accepts offers that need several platforms at once.
export async function saveMultiPlatform(
  userId: string,
  value: boolean,
): Promise<{ ok: true } | Failure> {
  try {
    const upd = await supabase
      .from("nova_profiles")
      .update({ multi_platform: value, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id");
    if (upd.error) return FAIL;
    if (upd.data && upd.data.length > 0) return { ok: true };
    const ins = await supabase.from("nova_profiles").insert({ id: userId, multi_platform: value });
    return ins.error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}
