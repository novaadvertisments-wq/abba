import { Image, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/theme";

// Soft colours for people without a picture, picked from their name so the
// same person always gets the same colour.
const DEFAULTS = ["#4B6F73", "#6B5B8C", "#8C5B6E", "#8C7A4B", "#4B7A8C", "#5B8C6B"];

function pick(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DEFAULTS[h % DEFAULTS.length];
}

type Props = {
  uri?: string;
  name: string;
  size?: number;
  // The colour of the ring: a Nova's tier colour or a business's category colour.
  ring?: string;
};

// A round picture, or a coloured circle with the first letter when there is none.
export function Avatar({ uri, name, size = 44, ring }: Props) {
  const ringWidth = ring ? 3 : 0;
  const inner = size - ringWidth * 2;
  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2, borderWidth: ringWidth, borderColor: ring ?? "transparent" },
      ]}
      accessibilityLabel={`${name || "Profile"} picture`}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      ) : (
        <View style={[styles.fallback, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: pick(name || "?") }]}>
          <Text style={[styles.letter, { fontSize: Math.max(12, inner * 0.42) }]}>{(name || "?").trim().charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  fallback: { alignItems: "center", justifyContent: "center" },
  letter: { ...typography.heading, color: colors.text },
});
