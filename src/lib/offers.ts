// Everything the "Find Novas" screen needs: posting offers, listing your own,
// and asking how many Novas match. Each function returns { ok: true, ... } or
// { ok: false, message }.
import * as Location from "expo-location";

import { supabase } from "./supabase";

export type Offer = {
  id: string;
  title: string;
  description: string;
  budget_ghs: number;
  platforms: string[];
  city: string;
  target_views: number;
  kind: "single" | "multi";
  post_within_days: number;
  duration_days: number;
  status: "open" | "closed" | "agreed";
  created_at: string;
};

export type NewOffer = {
  title: string;
  description: string;
  budget_ghs: number;
  platforms: string[];
  city: string; // empty = anywhere in Ghana
  target_views: number;
  recommended_ghs: number;
  kind: "single" | "multi";
  post_within_days: number;
  duration_days: number;
};

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

export async function loadOffers(userId: string): Promise<{ ok: true; offers: Offer[] } | Failure> {
  try {
    const { data, error } = await supabase
      .from("offers")
      .select("id, title, description, budget_ghs, platforms, city, target_views, kind, post_within_days, duration_days, status, created_at")
      .eq("business_id", userId)
      .order("created_at", { ascending: false });
    if (error) return FAIL;
    return { ok: true, offers: (data ?? []) as Offer[] };
  } catch {
    return FAIL;
  }
}

export async function createOffer(userId: string, o: NewOffer): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.from("offers").insert({ business_id: userId, ...o });
    return error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}

export async function closeOffer(id: string): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.from("offers").update({ status: "closed" }).eq("id", id);
    return error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}

// Only a number comes back, never any names.
export async function countMatchingNovas(
  city: string,
  platforms: string[],
  kind: "single" | "multi",
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc("count_matching_novas", {
      p_city: city,
      p_platforms: platforms,
      p_kind: kind,
    });
    if (error || typeof data !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

// Asks the phone for permission to use the location. The position itself is
// NOT read or saved on Day 8; the live map on Day 9 is what will use it.
export type LocationState = "granted" | "denied" | "unavailable";

export async function checkLocation(): Promise<LocationState> {
  // Never let a slow or unanswered permission prompt hold the screen up.
  const giveUp = new Promise<LocationState>((resolve) => setTimeout(() => resolve("unavailable"), 8000));
  const ask = (async (): Promise<LocationState> => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      return perm.status === "granted" ? "granted" : "denied";
    } catch {
      return "unavailable";
    }
  })();
  return Promise.race([ask, giveUp]);
}
