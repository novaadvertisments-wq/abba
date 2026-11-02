import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { AuthFooter, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { PasswordField } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { checkEmail } from "@/lib/validation";
import { colors, typography } from "@/theme";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const clearError = (field: string) =>
    setErrors((current) => ({ ...current, [field]: "" }));

  const submit = () => {
    const found = {
      email: checkEmail(email),
      password: password ? "" : "Enter your password",
    };
    setErrors(found);

    if (Object.values(found).some((message) => message !== "")) {
      return;
    }

    // DAY 5 will replace this with real login.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Almost there", "Real login is connected on Day 5.");
    }, 900);
  };

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Log in to continue with ABBA."
    >
      <TextField
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError("email");
        }}
        error={errors.email}
      />
      <PasswordField
        label="Password"
        placeholder="Your password"
        autoComplete="current-password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError("password");
        }}
        error={errors.password}
      />

      <Pressable
        onPress={() =>
          Alert.alert("Coming soon", "Password reset is added later.")
        }
        hitSlop={10}
        style={styles.forgot}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <Button title="Log in" onPress={submit} loading={loading} />

      <AuthFooter
        prompt="New to ABBA?"
        action="Create account"
        onPress={() => router.replace("/signup")}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: "flex-end",
  },
  forgotText: {
    ...typography.label,
    color: colors.gray600,
  },
});
