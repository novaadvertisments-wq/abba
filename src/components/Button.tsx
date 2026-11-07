import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { colors, radius, typography } from "@/theme";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isPrimary = variant === "primary";
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onAccent : colors.text} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: isPrimary ? colors.onAccent : colors.text },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderWidth: 1.5,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.8,
  },
  inactive: {
    opacity: 0.45,
  },
  text: {
    ...typography.label,
    fontSize: 16,
  },
});
