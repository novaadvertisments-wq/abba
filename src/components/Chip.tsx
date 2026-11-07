import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, typography } from "@/theme";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

// A small rounded button for picking one option from a row, for example a
// city or a platform. The chosen one turns black.
export function Chip({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
    >
      <Text style={[styles.text, { color: selected ? colors.onAccent : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    ...typography.label,
  },
});
