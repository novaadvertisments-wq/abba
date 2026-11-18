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
  | "whatsapp"
  | "instagram_post"
  | "tiktok_demo"
  | "instagram_demo";

// A "service" is what a Nova does on a platform. The id of an existing platform keeps its old meaning so nothing
// saved earlier breaks: instagram = Instagram Stories, tiktok = TikTok Posts, x = X Posts, and so on.
// kind: story = measured in lumens (average views), post = measured by followers and recent views (Day 14g),
// demo = a demonstrative ad. comingSoon services are listed but cannot be chosen yet.
export type ServiceKind = "story" | "post" | "demo";

export const PLATFORMS: {
  id: Platform;
  label: string;
  kind: ServiceKind;
  base: string; // the platform itself, for the poster and the screenshot check
  groupOk: boolean; // may be used in group campaigns (stories and status only, for now)
  comingSoon?: boolean;
  followersLabel: string;
  handleLabel: string;
  viewsLabel: string;
}[] = [
  { id: "snapchat", label: "Snapchat Stories", kind: "story", base: "snapchat", groupOk: true, followersLabel: "Followers", handleLabel: "Snapchat username", viewsLabel: "Average story views" },
  { id: "instagram", label: "Instagram Stories", kind: "story", base: "instagram", groupOk: true, followersLabel: "Followers", handleLabel: "Instagram handle", viewsLabel: "Average story views" },
  { id: "instagram_post", label: "Instagram Posts", kind: "post", base: "instagram", groupOk: false, comingSoon: true, followersLabel: "Followers", handleLabel: "Instagram handle", viewsLabel: "Average views on recent posts" },
  { id: "whatsapp", label: "WhatsApp Status", kind: "story", base: "whatsapp", groupOk: true, followersLabel: "Contacts who see your status", handleLabel: "WhatsApp number", viewsLabel: "Average status views" },
  { id: "tiktok", label: "TikTok Posts", kind: "post", base: "tiktok", groupOk: false, followersLabel: "Followers", handleLabel: "TikTok handle", viewsLabel: "Average views on recent posts" },
  { id: "x", label: "X Posts", kind: "post", base: "x", groupOk: false, followersLabel: "Followers", handleLabel: "X handle", viewsLabel: "Average views on recent posts" },
  { id: "facebook", label: "Facebook Stories", kind: "story", base: "facebook", groupOk: true, followersLabel: "Followers", handleLabel: "Page or profile name", viewsLabel: "Average story views" },
  { id: "instagram_demo", label: "Instagram Demonstrative Ads", kind: "demo", base: "instagram", groupOk: false, comingSoon: true, followersLabel: "Followers", handleLabel: "Instagram handle", viewsLabel: "Average views" },
  { id: "tiktok_demo", label: "TikTok Demonstrative Ads", kind: "demo", base: "tiktok", groupOk: false, comingSoon: true, followersLabel: "Followers", handleLabel: "TikTok handle", viewsLabel: "Average views" },
];

const BASE_NAMES: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
  snapchat: "Snapchat",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

// The service as a person reads it, for example "TikTok Posts".
// YouTube is no longer offered, but accounts saved earlier still show their name.
export function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? BASE_NAMES[id] ?? id;
}

// Just the platform, for example "TikTok" (used on the poster and in messages about screenshots).
export function platformName(id: string): string {
  const base = PLATFORMS.find((p) => p.id === id)?.base ?? id.split("_")[0];
  return BASE_NAMES[base] ?? base;
}

export function serviceKind(id: string): ServiceKind {
  return PLATFORMS.find((p) => p.id === id)?.kind ?? "story";
}

export const CITIES = ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Other"];

export type NovaAccount = {
  id: string;
  platform: Platform;
  handle: string;
  followers: number;
  avg_views: number;
  verified: boolean;
  multi_ok: boolean; // ticked for multi-platform offers
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
        .select("id, platform, handle, followers, avg_views, verified, multi_ok")
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

// Tick or untick one account for multi-platform offers.
export async function setAccountMulti(id: string, value: boolean): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.from("nova_accounts").update({ multi_ok: value }).eq("id", id);
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
