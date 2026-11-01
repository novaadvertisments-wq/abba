// ABBA design system: one place that defines how the whole app looks.
// Change a value here and every screen updates.

export const colors = {
  black: "#0A0A0A",
  white: "#FFFFFF",
  gray50: "#FAFAFA",
  gray100: "#F4F4F5",
  gray200: "#E4E4E7",
  gray400: "#A1A1AA",
  gray600: "#52525B",
  danger: "#B42318",
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
