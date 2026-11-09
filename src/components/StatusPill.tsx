import { StyleSheet, Text, View } from "react-native";

import { StatusKind, radius, statusColors, typography } from "@/theme";

type Props = { kind: StatusKind; label: string };

// A small coloured label such as "Open" or "Deal agreed". The words always
// say the same thing as the colour.
export function StatusPill({ kind, label }: Props) {
  const color = statusColors[kind];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { ...typography.caption, fontWeight: "600" },
});
