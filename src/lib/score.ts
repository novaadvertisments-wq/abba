// Day 16: Lumens, tier and trust rating. All numbers come from the database (built on verified screenshots).
import { supabase } from "./supabase";
import { TierName, tiers } from "@/theme";

export type ScoreAccount = { account_id: string; service: string; handle: string; lumens: number; verified: boolean };

export type MyScore = {
  lumens: number;
  tier: TierName;
  next_tier: TierName | null;
  next_at: number | null;
  place: number | null; // the Nova's place among all verified Novas
  total_novas: number;
  rating_avg: number | null; // only once there are 3 ratings
  rating_count: number;
  accounts: ScoreAccount[];
};

export type NovaCard = { nova_id: string; lumens: number; tier: TierName; verified: boolean; rating_avg: number | null; rating_count: number };

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const tierName = (v: unknown): TierName => (typeof v === "string" && v in tiers ? (v as TierName) : "spark");

export async function loadMyScore(): Promise<MyScore | null> {
  try {
    const { data, error } = await supabase.rpc("my_score");
    if (error || !data) return null;
    const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
    if (!r) return null;
    return {
      lumens: num(r.lumens),
      tier: tierName(r.tier),
      next_tier: r.next_tier ? tierName(r.next_tier) : null,
      next_at: r.next_at === null || r.next_at === undefined ? null : num(r.next_at),
      place: r.place === null || r.place === undefined ? null : num(r.place),
      total_novas: num(r.total_novas),
      rating_avg: r.rating_avg === null || r.rating_avg === undefined ? null : num(r.rating_avg),
      rating_count: num(r.rating_count),
      accounts: ((r.accounts as Record<string, unknown>[]) ?? []).map((a) => ({
        account_id: String(a.account_id),
        service: String(a.service),
        handle: String(a.handle),
        lumens: num(a.lumens),
        verified: a.verified === true,
      })),
    };
  } catch {
    return null;
  }
}

// What a business may see about some Novas: tier, Lumens and rating. Never contact details.
export async function loadNovaCards(ids: string[]): Promise<Record<string, NovaCard>> {
  const unique = Array.from(new Set(ids)).slice(0, 100);
  if (unique.length === 0) return {};
  try {
    const { data, error } = await supabase.rpc("nova_cards", { p_ids: unique });
    if (error || !data) return {};
    const out: Record<string, NovaCard> = {};
    for (const r of data as Record<string, unknown>[]) {
      out[String(r.nova_id)] = {
        nova_id: String(r.nova_id),
        lumens: num(r.lumens),
        tier: tierName(r.tier),
        verified: r.verified === true,
        rating_avg: r.rating_avg === null || r.rating_avg === undefined ? null : num(r.rating_avg),
        rating_count: num(r.rating_count),
      };
    }
    return out;
  } catch {
    return {};
  }
}

// "4" or "4.5" or "0.8": Lumens with at most one decimal.
export function lumensText(l: number): string {
  return Number.isInteger(l) ? String(l) : l.toFixed(1).replace(/\.0$/, "");
}

// "New" until there are three ratings.
export function ratingText(avg: number | null, count: number): string {
  return avg === null ? "New" : `${avg.toFixed(1)} ★ (${count})`;
}
