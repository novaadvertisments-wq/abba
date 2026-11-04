import { StyleSheet, Text, View } from "react-native";

import { colors, radius, typography } from "@/theme";

type Props = {
  message: string;
  // "error" is red, "info" is black and white
  tone?: "error" | "info";
};

// A box for a message about the whole form, for example "Wrong email or password".
export function FormMessage({ message, tone = "error" }: Props) {
  if (!message) return null;

  const isError = tone === "error";
  return (
    <View style={[styles.box, isError ? styles.errorBox : styles.infoBox]}>
      <Text style={[styles.text, { color: isError ? colors.danger : colors.black }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBox: {
    borderColor: colors.danger,
    backgroundColor: "#FEF3F2",
  },
  infoBox: {
    borderColor: colors.black,
    backgroundColor: colors.gray50,
  },
  text: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 21,
  },
});
