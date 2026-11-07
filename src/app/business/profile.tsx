import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/lib/auth";
import { logOut } from "@/lib/authActions";
import { CATEGORIES, loadBusinessProfile, saveBusinessProfile } from "@/lib/businessProfile";
import { CITIES } from "@/lib/novaProfile";
import { checkBusinessName, checkDescription } from "@/lib/validation";
import { colors, radius, spacing, textOnArt, typography } from "@/theme";

export default function BusinessProfile() {
  const { profile, email } = useAuth();
  const userId = profile?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [cityPick, setCityPick] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState<{ name?: string; category?: string; city?: string; description?: string }>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const r = await loadBusinessProfile(userId);
    if (!r.ok) {
      setLoadError(r.message);
      setLoading(false);
      return;
    }
    setLoadError("");
    setName(r.business_name || profile?.full_name || "");
    setCategory(r.category);
    const known = CITIES.slice(0, -1).includes(r.city);
    setCityPick(r.city ? (known ? r.city : "Other") : "");
    setOtherCity(r.city && !known ? r.city : "");
    setArea(r.area);
    setDescription(r.description);
    setSaved(r.exists && !!r.business_name && !!r.category && !!r.city);
    setLoading(false);
  }, [userId, profile?.full_name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const chosenCity = cityPick === "Other" ? otherCity.trim() : cityPick;

  const onSave = async () => {
    setNotice("");
    setFormError("");
    const next = {
      name: checkBusinessName(name),
      category: category ? "" : "Choose a category",
      city: chosenCity ? "" : cityPick === "Other" ? "Type your city or town" : "Choose your city",
      description: checkDescription(description),
    };
    setErrors(next);
    if (next.name || next.category || next.city || next.description) return;

    setSaving(true);
    const r = await saveBusinessProfile(userId, {
      business_name: name.trim(),
      category,
      city: chosenCity,
      area: area.trim(),
      description: description.trim(),
    });
    setSaving(false);
    if (!r.ok) {
      setFormError(r.message);
      return;
    }
    setSaved(true);
    setNotice("Profile saved.");
  };

  const clear = (k: keyof typeof errors) => {
    setErrors((e) => ({ ...e, [k]: undefined }));
    setNotice("");
  };

  return (
    <GraffitiBackground variant="profile" strength={0.85}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Your business</Text>
            <Text style={styles.signedIn}>
              {profile?.full_name} ({email})
            </Text>

            {loading ? (
              <View style={styles.gap} accessibilityLabel="Loading your profile">
                <SkeletonCard lines={2} />
                <Skeleton height={54} rounded={radius.md} />
                <View style={styles.chips}>
                  {[84, 76, 72, 70, 60, 74].map((w, i) => (
                    <Skeleton key={i} width={w} height={42} rounded={radius.pill} />
                  ))}
                </View>
                <Skeleton height={54} rounded={radius.md} />
                <Skeleton height={96} rounded={radius.md} />
                <Skeleton height={54} rounded={radius.pill} />
              </View>
            ) : loadError ? (
              <View style={styles.gap}>
                <FormMessage message={loadError} />
                <Button title="Try again" variant="secondary" onPress={() => { setLoading(true); refresh(); }} />
              </View>
            ) : (
              <>
                <Card style={styles.progress}>
                  <Text style={styles.heading}>
                    {saved ? "Your profile is ready" : "Finish your profile"}
                  </Text>
                  <View style={styles.checkRow}>
                    <Ionicons
                      name={saved ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={saved ? colors.accent : colors.textFaint}
                    />
                    <Text style={[styles.checkText, saved && { color: colors.text }]}>
                      Business name, category and city
                    </Text>
                  </View>
                  <Text style={styles.hint}>Novas see this when you send them an offer.</Text>
                </Card>

                <TextField
                  label="Business name"
                  value={name}
                  onChangeText={(t) => { setName(t); clear("name"); }}
                  error={errors.name}
                  placeholder="e.g. Ama's Kitchen"
                  maxLength={60}
                />

                <Text style={styles.heading}>What do you sell?</Text>
                <View style={styles.chips}>
                  {CATEGORIES.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.label}
                      selected={category === c.id}
                      onPress={() => { setCategory(c.id); clear("category"); }}
                    />
                  ))}
                </View>
                {!!errors.category && <Text style={styles.error}>{errors.category}</Text>}

                <Text style={styles.heading}>Where are you based?</Text>
                <View style={styles.chips}>
                  {CITIES.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={cityPick === c}
                      onPress={() => { setCityPick(c); clear("city"); }}
                    />
                  ))}
                </View>
                {cityPick === "Other" && (
                  <TextField
                    label="Your city or town"
                    value={otherCity}
                    onChangeText={(t) => { setOtherCity(t); clear("city"); }}
                    placeholder="e.g. Ho"
                  />
                )}
                {!!errors.city && <Text style={styles.error}>{errors.city}</Text>}
                <TextField
                  label="Area or neighbourhood (optional)"
                  value={area}
                  onChangeText={(t) => { setArea(t); setNotice(""); }}
                  placeholder="e.g. East Legon"
                />

                <TextField
                  label="About your business (optional)"
                  value={description}
                  onChangeText={(t) => { setDescription(t); clear("description"); }}
                  error={errors.description}
                  placeholder="One or two lines about what you do"
                  multiline
                  maxLength={280}
                  style={styles.multiline}
                />
                <Text style={styles.hint}>{description.length}/280</Text>

                <FormMessage message={formError} />
                <FormMessage message={notice} tone="info" />
                <Button title="Save profile" loading={saving} onPress={onSave} />
              </>
            )}

            <Button title="Log out" variant="secondary" onPress={logOut} style={{ marginTop: spacing.lg }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GraffitiBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...textOnArt, ...typography.title, color: colors.text, marginTop: spacing.md },
  signedIn: { ...textOnArt, ...typography.caption, color: colors.textMuted },
  heading: { ...textOnArt, ...typography.heading, color: colors.text },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted },
  gap: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  progress: { gap: spacing.sm, backgroundColor: colors.surfaceRaised },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkText: { ...typography.body, color: colors.textMuted },
  error: { ...typography.caption, color: colors.danger },
  multiline: { minHeight: 96, textAlignVertical: "top" },
});
