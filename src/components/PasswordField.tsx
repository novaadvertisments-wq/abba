import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInputProps } from "react-native";

import { TextField } from "@/components/TextField";
import { colors } from "@/theme";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  error?: string;
};

// A text field for passwords. The dots can be shown or hidden with the eye.
export function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      rightElement={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          style={{ padding: 10 }}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.gray600}
          />
        </Pressable>
      }
    />
  );
}
