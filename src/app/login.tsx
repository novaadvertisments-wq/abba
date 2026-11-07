import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { AuthFooter, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FormMessage } from "@/components/FormMessage";
import { PasswordField } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { homeFor, useAuth } from "@/lib/auth";
import { logIn } from "@/lib/authActions";
import { checkEmail } from "@/lib/validation";
import { colors, typography } from "@/theme";

export default function Login() {
  const router = useRouter();
  const { status, profile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const clearError = (field: string) =>
    setErrors((current) => ({ ...current, [field]: "" }));

  const submit = async () => {
    setFormError("");
    const found = {
      email: checkEmail(email),
      password: password ? "" : "Enter your password",
    };
    setErrors(found);

    if (Object.values(found).some((message) => message !== "")) {
      return;
    }

    setLoading(true);
    const result = await logIn(email, password);
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
    }
    // On success the redirect below takes the person into the app.
  };

  // Already logged in? Go straight to the right part of the app.
  if (status === "signedIn") {
    return <Redirect href={homeFor(profile)} />;
  }

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

      <FormMessage message={formError} />

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
    color: colors.textMuted,
  },
});
