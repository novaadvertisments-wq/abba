// Novas answering offers, and businesses answering the Novas. Every price change
// goes through the database functions, which check all the rules on the server.
import { supabase } from "./supabase";

export type NegStatus = "pending_business" | "pending_nova" | "agreed" | "declined" | "closed";

export type FeedOffer = {
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
  created_at: string;
  business_name: string;
  offer_status: "open" | "closed" | "agreed" | "expired";
  expires_at?: string;
  last_note?: string;
  agreed_at?: string | null;
  neg_status: NegStatus | null;
  last_price: number | null;
  last_by: "nova" | "business" | null;
  counters: number | null;
  agreed_price: number | null;
  business_category: string;
  business_avatar: string; // a stored path; turn it into an address with pictureUrl()
};

export type Response = {
  negotiation_id: string;
  offer_id: string;
  nova_id: string;
  nova_name: string;
  nova_city: string;
  accounts: string;
  status: NegStatus;
  last_price: number;
  last_by: "nova" | "business";
  counters: number;
  agreed_price: number | null;
  updated_at: string;
  offer_status: "open" | "closed" | "agreed" | "expired";
  last_note?: string;
  agreed_at?: string | null;
  post_within_days?: number;
  offer_target_views: number;
  nova_views: number | null; // typical views per post, as the Nova declared them
  views_verified: boolean;
  nova_avatar: string;
};

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

export async function loadFeed(): Promise<{ ok: true; offers: FeedOffer[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("nova_open_offers");
    if (error) return FAIL;
    return { ok: true, offers: (data ?? []) as FeedOffer[] };
  } catch {
    return FAIL;
  }
}

export async function loadResponses(): Promise<{ ok: true; responses: Response[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("business_responses");
    if (error) return FAIL;
    return { ok: true, responses: (data ?? []) as Response[] };
  } catch {
    return FAIL;
  }
}

// novaId is only needed when the BUSINESS is answering; Novas pass null.
export async function respond(
  offerId: string,
  novaId: string | null,
  action: "accept" | "counter" | "decline",
  price?: number,
  note?: string,
): Promise<{ ok: true; status: string } | Failure> {
  try {
    const { data, error } = await supabase.rpc("respond_to_offer", {
      p_offer: offerId,
      p_nova: novaId,
      p_action: action,
      p_price: price ?? null,
      p_note: note?.trim() ? note.trim() : null,
    });
    if (error) {
      // "P0001" is a message we wrote ourselves for the person to read.
      return error.code === "P0001" ? { ok: false, message: error.message } : FAIL;
    }
    return { ok: true, status: String(data) };
  } catch {
    return FAIL;
  }
}

// "Expires in 3 days", "Expires today" and so on, for an open offer.
export function expiryText(expiresAt?: string): string {
  if (!expiresAt) return "";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "Expires within the hour";
  if (hours < 24) return `Expires in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}

// The last day to post once a deal is agreed, for example "Post by 18 Nov".
export function postByText(agreedAt: string | null | undefined, days: number | undefined): string {
  if (!agreedAt || !days) return "";
  const d = new Date(new Date(agreedAt).getTime() + days * 86400000);
  return `Post by ${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}`;
}
