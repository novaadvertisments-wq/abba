// ABBA design system: one place that defines how the whole app looks.
// A graffiti wallpaper, charcoal cards, white text, one soft aqua accent.
// Change a value here and every screen updates.

export const colors = {
  background: "#000000", // behind the wallpaper
  surface: "rgba(28, 31, 33, 0.82)", // cards: dark charcoal, slightly see-through
  surfaceRaised: "rgba(54, 58, 61, 0.88)", // text boxes and chips sitting on a card
  skeleton: "rgba(255, 255, 255, 0.10)", // the shapes shown while loading
  border: "rgba(255, 255, 255, 0.10)",
  borderStrong: "rgba(255, 255, 255, 0.24)",
  text: "#FFFFFF", // main text: white, for strong contrast
  textMuted: "#B9C7C9", // softer text
  textFaint: "#93B1B5", // hints inside text boxes
  icon: "#FFFFFF", // simple white icons
  iconMuted: "rgba(255, 255, 255, 0.55)", // icons that are not active
  accent: "#B8E3E9", // buttons and highlights
  onAccent: "#000000", // text and icons placed on top of the accent
  danger: "#FF8A80", // errors only
  dangerBg: "rgba(60, 20, 18, 0.88)",
};

// Day 9e: meaning colours. No green, no confetti, red only for errors.
// Colour is never the only signal: every coloured thing also has words.

// Nova tiers (rings around profile pictures and tier labels).
export const tiers = {
  spark: { label: "Spark", color: "#FFE27A" },
  glow: { label: "Glow", color: "#FFB347" },
  blaze: { label: "Blaze", color: "#FF6FAE" },
  radiant: { label: "Radiant", color: "#B388FF" },
  supernova: { label: "Supernova", color: "#B8E3E9" },
};
export type TierName = keyof typeof tiers;

// What state an offer or a deal is in.
export const statusColors = {
  open: "#B8E3E9", // open, aqua
  waiting: "#FFB347", // waiting for someone, amber
  agreed: "#FFD66B", // deal agreed, gold
  closed: "#8A9496", // closed or declined, grey
};
export type StatusKind = keyof typeof statusColors;

// Money is always gold.
export const gold = "#FFD66B";

// A colour for each kind of business.
export const categoryColors: Record<string, string> = {
  food: "#FFB347",
  fashion: "#FF8FC0",
  beauty: "#C9A7FF",
  events: "#9B7BFF",
  tech: "#7CC4FF",
  retail: "#FFE27A",
  services: "#5FD1C4",
  education: "#9DB8FF",
  other: "#A3ADAF",
};

// A very faint wash of colour over each tab's wallpaper.
export const tabTint = {
  auth: "transparent",
  home: "rgba(184, 227, 233, 0.07)", // aqua
  campaigns: "rgba(255, 179, 71, 0.07)", // amber
  verify: "rgba(179, 136, 255, 0.07)", // violet
  profile: "rgba(255, 111, 174, 0.06)", // pink
};

// Colours for the opening animation.
export const palette = {
  light: "#B8E3E9",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 30, fontWeight: "700" as const, letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  label: { fontSize: 14, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
};

// The ABBA logo files (white versions are for black backgrounds,
// black versions are for white backgrounds).
export const logo = {
  markWhite: require("../../assets/images/abba-mark-white.png"),
  markBlack: require("../../assets/images/abba-mark-black.png"),
  wordmarkWhite: require("../../assets/images/abba-wordmark-white.png"),
  wordmarkBlack: require("../../assets/images/abba-wordmark-black.png"),
};

// Shapes of the logo images (width / height) so we can size them correctly.
export const logoRatio = {
  mark: 399 / 333,
  wordmark: 624 / 141,
};

// Background wallpapers: one for each part of the app. They are already dark
// and quiet, so they only ever act as a background.
export const art = {
  auth: require("../assets/graffiti/graffiti-auth.jpg"),
  home: require("../assets/graffiti/graffiti-home.jpg"),
  campaigns: require("../assets/graffiti/graffiti-campaigns.jpg"),
  verify: require("../assets/graffiti/graffiti-verify.jpg"),
  profile: require("../assets/graffiti/graffiti-profile.jpg"),
};
export type ArtName = keyof typeof art;

// A soft dark halo for text that sits directly on the graffiti.
export const textOnArt = {
  textShadowColor: "#000000",
  textShadowRadius: 8,
  textShadowOffset: { width: 0, height: 1 },
};
