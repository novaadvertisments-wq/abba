import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, typography } from "@/theme";

type Props = {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  selected: boolean;
  onPress: () => void;
};

// A big tappable card used to pick one option out of a few, for example
// "Business" or "Nova". The chosen card turns black.
export function ChoiceCard({ title, description, icon, selected, onPress }: Props) {
  const textColor = selected ? colors.onAccent : colors.text;
  const subColor = selected ? "#2F4A4E" : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.iconRow}>
        <Ionicons name={icon} size={26} color={textColor} />
        <View style={[styles.dot, selected && styles.dotSelected]}>
          {selected && <Ionicons name="checkmark" size={14} color={colors.accent} />}
        </View>
      </View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.description, { color: subColor }]}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 6,
  },
  cardSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  dotSelected: {
    backgroundColor: colors.onAccent,
    borderColor: colors.onAccent,
  },
  title: {
    ...typography.heading,
    fontSize: 18,
  },
  description: {
    ...typography.caption,
    lineHeight: 18,
  },
});
