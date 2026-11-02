import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/theme";

type Props = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  error?: string;
};

export function Checkbox({ checked, onToggle, label, error }: Props) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            !!error && !checked && styles.boxError,
          ]}
        >
          {checked && <Ionicons name="checkmark" size={18} color={colors.white} />}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.gray400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  boxChecked: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  boxError: {
    borderColor: colors.danger,
  },
  label: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray600,
    flex: 1,
    lineHeight: 21,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
