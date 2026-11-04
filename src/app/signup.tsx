import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthFooter, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { ChoiceCard } from "@/components/ChoiceCard";
import { FormMessage } from "@/components/FormMessage";
import { PasswordField } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { homeFor, useAuth } from "@/lib/auth";
import { signUp } from "@/lib/authActions";
import {
  checkConfirm,
  checkEmail,
  checkName,
  checkPassword,
  checkPhone,
} from "@/lib/validation";
import { colors, typography } from "@/theme";

import type { Role } from "@/lib/auth";

export default function SignUp() {
  const router = useRouter();
  const { status, profile } = useAuth();

  // What the person has typed or chosen so far
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Messages shown under fields, and whether we are "sending"
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const nameLabel = role === "business" ? "Business name" : "Full name";

  // Clears one field's error as soon as the person edits it
  const clearError = (field: string) =>
    setErrors((current) => ({ ...current, [field]: "" }));

  const submit = async () => {
    setFormError("");
    setNotice("");
    const found = {
      role: role ? "" : "Choose how you will use ABBA",
      name: checkName(name, nameLabel),
      email: checkEmail(email),
      phone: checkPhone(phone),
      password: checkPassword(password),
      confirm: checkConfirm(password, confirm),
      agreed: agreed ? "" : "You need to agree to continue",
    };
    setErrors(found);

    if (Object.values(found).some((message) => message !== "")) {
      return;
    }

    setLoading(true);
    const result = await signUp({
      email,
      password,
      fullName: name,
      phone,
      role: role as Role,
    });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    if (result.needsConfirmation) {
      setNotice(
        "Account created. We sent a link to your email. Open it to confirm, then log in.",
      );
    }
    // Otherwise the person is now logged in, and the redirect below
    // takes them into the app.
  };

  // Already logged in? Go straight to the right part of the app.
  if (status === "signedIn") {
    return <Redirect href={homeFor(profile)} />;
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Tell us how you will use ABBA, then add your details."
    >
      <View style={styles.group}>
        <Text style={styles.groupLabel}>I am a...</Text>
        <View style={styles.cardRow}>
          <ChoiceCard
            title="Business"
            description="I want to advertise and hire Novas."
            icon="storefront-outline"
            selected={role === "business"}
            onPress={() => {
              setRole("business");
              clearError("role");
            }}
          />
          <ChoiceCard
            title="Nova"
            description="I want to earn by advertising on my social media."
            icon="sparkles-outline"
            selected={role === "nova"}
            onPress={() => {
              setRole("nova");
              clearError("role");
            }}
          />
        </View>
        {!!errors.role && <Text style={styles.error}>{errors.role}</Text>}
      </View>

      <TextField
        label={nameLabel}
        placeholder={role === "business" ? "e.g. Legon Bites" : "e.g. Ama Mensah"}
        autoCapitalize="words"
        autoComplete="name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          clearError("name");
        }}
        error={errors.name}
      />
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
      <TextField
        label="Phone number"
        placeholder="024 123 4567"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          clearError("phone");
        }}
        error={errors.phone}
      />
      <PasswordField
        label="Password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError("password");
        }}
        error={errors.password}
      />
      <PasswordField
        label="Confirm password"
        placeholder="Type it again"
        autoComplete="new-password"
        value={confirm}
        onChangeText={(text) => {
          setConfirm(text);
          clearError("confirm");
        }}
        error={errors.confirm}
      />

      <Checkbox
        checked={agreed}
        onToggle={() => {
          setAgreed((value) => !value);
          clearError("agreed");
        }}
        label="I agree to the Terms of Use and Privacy Policy"
        error={errors.agreed}
      />

      <FormMessage message={formError} />
      <FormMessage message={notice} tone="info" />

      <Button title="Create account" onPress={submit} loading={loading} />

      <AuthFooter
        prompt="Already have an account?"
        action="Log in"
        onPress={() => router.replace("/login")}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  groupLabel: {
    ...typography.label,
    color: colors.black,
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
