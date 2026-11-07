import { ReactNode, useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, typography } from "@/theme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  // Something shown inside the right end of the box, for example the
  // "show password" eye.
  rightElement?: ReactNode;
};

export function TextField({
  label,
  error,
  rightElement,
  style,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor={colors.textFaint}
          keyboardAppearance="dark"
          selectionColor={colors.accent}
          style={[
            styles.input,
            !!rightElement && styles.inputWithRight,
            focused && styles.inputFocused,
            !!error && styles.inputError,
            style,
          ]}
        />
        {!!rightElement && <View style={styles.right}>{rightElement}</View>}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 6,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputWithRight: {
    paddingRight: 52,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  right: {
    position: "absolute",
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
