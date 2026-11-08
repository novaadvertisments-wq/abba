import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthFooter, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FormMessage } from "@/components/FormMessage";
import { PasswordField } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { resetPassword, sendResetCode } from "@/lib/authActions";
import { checkConfirm, checkEmail, checkPassword, checkResetCode } from "@/lib/validation";
import { colors, typography } from "@/theme";

type Step = "email" | "code" | "done";

// Forgot password: 1) enter your email, 2) type the code we send, and a new password.
export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = (field: string) => setErrors((e) => ({ ...e, [field]: "" }));

  const sendCode = async () => {
    setFormError("");
    const problem = checkEmail(email);
    setErrors({ email: problem });
    if (problem) return;
    setLoading(true);
    const result = await sendResetCode(email);
    setLoading(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setStep("code");
  };

  const submit = async () => {
    setFormError("");
    const found = {
      code: checkResetCode(code),
      password: checkPassword(password),
      confirm: checkConfirm(password, confirm),
    };
    setErrors(found);
    if (Object.values(found).some((m) => m !== "")) return;
    setLoading(true);
    const result = await resetPassword(email, code, password);
    setLoading(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setStep("done");
  };

  if (step === "done") {
    return (
      <AuthScreen title="Password changed" subtitle="You are logged in with your new password.">
        <Button title="Continue" onPress={() => router.replace("/")} />
      </AuthScreen>
    );
  }

  if (step === "code") {
    return (
      <AuthScreen title="Check your email" subtitle={`If ${email.trim()} has an account, we sent it a code. Type it below and choose a new password.`}>
        <TextField
          label="Code from your email"
          placeholder="e.g. 123456"
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          value={code}
          onChangeText={(t) => { setCode(t); clearError("code"); }}
          error={errors.code}
          maxLength={8}
        />
        <PasswordField
          label="New password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChangeText={(t) => { setPassword(t); clearError("password"); }}
          error={errors.password}
        />
        <PasswordField
          label="Confirm new password"
          placeholder="Type it again"
          autoComplete="new-password"
          value={confirm}
          onChangeText={(t) => { setConfirm(t); clearError("confirm"); }}
          error={errors.confirm}
        />
        <FormMessage message={formError} />
        <Button title="Change password" onPress={submit} loading={loading} />
        <Text style={styles.link} onPress={() => { setStep("email"); setCode(""); setFormError(""); }}>
          Send a new code
        </Text>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Forgot password?" subtitle="Enter your email and we will send you a code.">
      <TextField
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={email}
        onChangeText={(t) => { setEmail(t); clearError("email"); }}
        error={errors.email}
      />
      <FormMessage message={formError} />
      <Button title="Send code" onPress={sendCode} loading={loading} />
      <AuthFooter prompt="Remembered it?" action="Log in" onPress={() => router.replace("/login")} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: { ...typography.label, color: colors.textMuted, textAlign: "center", textDecorationLine: "underline" },
});
