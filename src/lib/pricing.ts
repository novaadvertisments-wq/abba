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
