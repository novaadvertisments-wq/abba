// How the app suggests a price for an offer.
//
// PLACEHOLDER NUMBERS: the real prices will be set after market research.
// Change them here and the whole app follows.
//
// 1 lumen = 1,000 views (the average views of a story or post).
// The price is per platform, so advertising on 5 platforms costs more than
// advertising on 1, and a Nova is never paid the same for more work.

export const VIEWS_PER_LUMEN = 1000;

export const PRICE_PER_LUMEN_GHS = {
  single: 50, // one platform
  multi: 40, // each platform in a multi-platform offer
};

export const LUMEN_OPTIONS = [1, 2, 3, 5, 10, 20];

export type OfferKind = "single" | "multi";

export function viewsFor(lumens: number): number {
  return lumens * VIEWS_PER_LUMEN;
}

// How long the advert must stay up. 1 = 24 hours.
export const DURATION_OPTIONS = [1, 3, 7, 14, 30];

// PLACEHOLDER: the price grows the longer the advert stays up.
export const DURATION_FACTOR: Record<number, number> = { 1: 1, 3: 1.5, 7: 2, 14: 3, 30: 5 };

export function durationLabel(days: number): string {
  return days === 1 ? "24 hours" : `${days} days`;
}

export function recommendPrice(
  lumens: number,
  kind: OfferKind,
  platformCount: number,
  durationDays: number = 1,
): number {
  const count = kind === "multi" ? Math.max(platformCount, 2) : 1;
  const factor = DURATION_FACTOR[durationDays] ?? 1;
  return Math.round(lumens * PRICE_PER_LUMEN_GHS[kind] * count * factor);
}

// A business can ask for the post to go up within this many days of agreeing (up to 30).
export const POST_WITHIN_OPTIONS = [3, 7, 14, 30];

// Each side may counter at most this many times per offer. (The database enforces it too.)
export const MAX_COUNTERS = 3;

// ---- Group campaigns (Day 10) ----
// Aba keeps this share of what the business pays; the Novas get the rest.
export const COMMISSION_PERCENT = 5;
export const GROUP_JOIN_OPTIONS = [3, 7, 14]; // days Novas have to join
export const GROUP_SIZE_OPTIONS = [3, 5, 10, 20, 30]; // most Novas
export const GROUP_MIN_VIEWS_OPTIONS = [0, 500, 1000, 5000, 10000]; // 0 = any
export const GROUP_LUMEN_OPTIONS = [5, 10, 20, 50, 100]; // quick picks; a business can type any number
export const GROUP_MIN_LUMENS = 5; // the smallest group campaign
export const GROUP_MARKUP_PERCENT = 20; // group campaigns cost 20% more per lumen (placeholder)

// The price of a lumen in a group campaign is FIXED: nobody types their own price.
// PLACEHOLDER (keep in step with lumen_rate() in abba-day10c-setup.sql).
export const groupRate = (durationDays: number) =>
  Math.round((PRICE_PER_LUMEN_GHS.single * (100 + GROUP_MARKUP_PERCENT) / 100) * (DURATION_FACTOR[durationDays] ?? 1));

// The most the business can be charged: every lumen at the fixed rate.
export const groupMaxCost = (lumens: number, durationDays: number) => lumens * groupRate(durationDays);

// What a Nova earns per lumen of their reach, after Aba's cut (rounded down).
export const novaRate = (rate: number) => Math.floor((rate * (100 - COMMISSION_PERCENT)) / 100);
