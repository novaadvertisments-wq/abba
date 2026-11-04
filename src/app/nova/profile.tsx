import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { FormMessage } from "@/components/FormMessage";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/lib/auth";
import { logOut } from "@/lib/authActions";
import {
  CITIES,
  NovaAccount,
  PLATFORMS,
  Platform,
  addAccount,
  loadNovaProfile,
  platformLabel,
  removeAccount,
  saveLocation,
  updateAccount,
} from "@/lib/novaProfile";
import {
  checkFollowers,
  checkHandle,
  checkViews,
  cleanHandle,
  parseFollowers,
  shortNumber,
} from "@/lib/validation";
import { colors, spacing, typography } from "@/theme";

export default function NovaProfile() {
  const { profile, email } = useAuth();
  const userId = profile?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accounts, setAccounts] = useState<NovaAccount[]>([]);

  // Location form
  const [cityPick, setCityPick] = useState(""); // one of CITIES, or ""
  const [otherCity, setOtherCity] = useState("");
  const [area, setArea] = useState("");
  const [savedLocation, setSavedLocation] = useState(false);
  const [locError, setLocError] = useState("");
  const [locNotice, setLocNotice] = useState("");
  const [locSaving, setLocSaving] = useState(false);

  // Account form (adding a new one, or editing when editingId is set)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform | "">("");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("");
  const [views, setViews] = useState("");
  const [errors, setErrors] = useState<{ platform?: string; handle?: string; followers?: string; views?: string }>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const result = await loadNovaProfile(userId);
    if (!result.ok) {
      setLoadError(result.message);
      setLoading(false);
      return;
    }
    setLoadError("");
    setAccounts(result.accounts);
    const known = CITIES.slice(0, -1).includes(result.city);
    setCityPick(result.city ? (known ? result.city : "Other") : "");
    setOtherCity(result.city && !known ? result.city : "");
    setArea(result.area);
    setSavedLocation(!!result.city);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const chosenCity = cityPick === "Other" ? otherCity.trim() : cityPick;

  const onSaveLocation = async () => {
    setLocNotice("");
    if (!chosenCity) {
      setLocError(cityPick === "Other" ? "Type your city or town" : "Choose your city");
      return;
    }
    setLocError("");
    setLocSaving(true);
    const result = await saveLocation(userId, chosenCity, area.trim());
    setLocSaving(false);
    if (!result.ok) {
      setLocError(result.message);
      return;
    }
    setSavedLocation(true);
    setLocNotice("Location saved.");
  };

  const openAddForm = () => {
    setEditingId(null);
    setPlatform("");
    setHandle("");
    setFollowers("");
    setViews("");
    setErrors({});
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (a: NovaAccount) => {
    setEditingId(a.id);
    setPlatform(a.platform);
    setHandle(a.handle);
    setFollowers(String(a.followers));
    setViews(String(a.avg_views));
    setErrors({});
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const onSaveAccount = async () => {
    const next = {
      platform: platform ? "" : "Choose a platform",
      handle: platform ? checkHandle(handle, platform) : "",
      followers: checkFollowers(followers),
      views: checkViews(views),
    };
    setErrors(next);
    setFormError("");
    if (next.platform || next.handle || next.followers || next.views || !platform) return;

    const cleaned = platform === "whatsapp" ? handle.replace(/[\s-]/g, "") : cleanHandle(handle);
    const count = parseFollowers(followers) as number;
    const avgViews = parseFollowers(views) as number;

    setSaving(true);
    const result = editingId
      ? await updateAccount(editingId, cleaned, count, avgViews)
      : await addAccount(userId, platform, cleaned, count, avgViews);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    closeForm();
    refresh();
  };

  const onRemove = async () => {
    if (!editingId) return;
    setSaving(true);
    const result = await removeAccount(editingId);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    closeForm();
    refresh();
  };

  const totalViews = accounts.reduce((sum, a) => sum + a.avg_views, 0);
  const hasAccounts = accounts.length > 0;
  const complete = savedLocation && hasAccounts;
  const usedPlatforms = accounts.map((a) => a.platform);
  const platformMeta = PLATFORMS.find((p) => p.id === platform);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Your profile</Text>
          <Text style={styles.signedIn}>
            {profile?.full_name} ({email})
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.black} style={{ marginTop: spacing.xl }} />
          ) : loadError ? (
            <View style={styles.gap}>
              <FormMessage message={loadError} />
              <Button title="Try again" variant="secondary" onPress={() => { setLoading(true); refresh(); }} />
            </View>
          ) : (
            <>
              {/* Progress */}
              <Card style={styles.progress}>
                <Text style={styles.heading}>
                  {complete ? "Your profile is ready" : "Finish your profile"}
                </Text>
                <Check done={savedLocation} text="Add your location" />
                <Check done={hasAccounts} text="Add at least one social account" />
                {hasAccounts && (
                  <Text style={styles.reach}>
                    Typical views: {shortNumber(totalViews)} per post
                  </Text>
                )}
              </Card>

              {/* Location */}
              <Text style={styles.heading}>Where are you based?</Text>
              <View style={styles.chips}>
                {CITIES.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    selected={cityPick === c}
                    onPress={() => {
                      setCityPick(c);
                      setLocError("");
                      setLocNotice("");
                    }}
                  />
                ))}
              </View>
              {cityPick === "Other" && (
                <TextField
                  label="Your city or town"
                  value={otherCity}
                  onChangeText={(t) => { setOtherCity(t); setLocNotice(""); }}
                  placeholder="e.g. Ho"
                />
              )}
              <TextField
                label="Area or neighbourhood (optional)"
                value={area}
                onChangeText={(t) => { setArea(t); setLocNotice(""); }}
                placeholder="e.g. East Legon"
              />
              <FormMessage message={locError} />
              <FormMessage message={locNotice} tone="info" />
              <Button title="Save location" variant="secondary" loading={locSaving} onPress={onSaveLocation} />

              {/* Accounts */}
              <Text style={[styles.heading, { marginTop: spacing.md }]}>Your social accounts</Text>
              <Text style={styles.hint}>
                Add the accounts you advertise on. Your average views matter most, because that is
                what businesses pay for. Until Aba checks them, accounts show as "Not verified yet".
              </Text>

              {accounts.map((a) => (
                <Card key={a.id} onPress={() => openEditForm(a)} style={styles.accountCard}>
                  <View style={styles.flex}>
                    <Text style={styles.accountName}>{platformLabel(a.platform)}</Text>
                    <Text style={styles.accountHandle}>
                      {a.platform === "whatsapp" ? a.handle : `@${a.handle}`} · {shortNumber(a.followers)}{" "}
                      {a.platform === "youtube" ? "subscribers" : "followers"}
                    </Text>
                  </View>
                  <View style={styles.accountRight}>
                    <Text style={styles.accountFollowers}>{shortNumber(a.avg_views)}</Text>
                    <Text style={styles.accountStatus}>
                      avg views · {a.verified ? "Verified" : "Not verified yet"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
                </Card>
              ))}

              {formOpen ? (
                <Card style={styles.form}>
                  <Text style={styles.heading}>
                    {editingId ? `Edit ${platformLabel(platform)}` : "Add an account"}
                  </Text>
                  {!editingId && (
                    <View style={styles.gap}>
                      <Text style={styles.label}>Platform</Text>
                      <View style={styles.chips}>
                        {PLATFORMS.map((p) => (
                          <Chip
                            key={p.id}
                            label={p.label}
                            selected={platform === p.id}
                            disabled={usedPlatforms.includes(p.id)}
                            onPress={() => {
                              setPlatform(p.id);
                              setErrors((e) => ({ ...e, platform: undefined }));
                            }}
                          />
                        ))}
                      </View>
                      {!!errors.platform && <Text style={styles.error}>{errors.platform}</Text>}
                    </View>
                  )}
                  {!!platform && (
                    <>
                      <TextField
                        label={platformMeta?.handleLabel ?? "Handle"}
                        value={handle}
                        onChangeText={(t) => {
                          setHandle(t);
                          setErrors((e) => ({ ...e, handle: undefined }));
                        }}
                        error={errors.handle}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={platform === "whatsapp" ? "024 123 4567" : "@yourhandle"}
                        keyboardType={platform === "whatsapp" ? "phone-pad" : "default"}
                      />
                      <TextField
                        label={platformMeta?.viewsLabel ?? "Average views"}
                        value={views}
                        onChangeText={(t) => {
                          setViews(t);
                          setErrors((e) => ({ ...e, views: undefined }));
                        }}
                        error={errors.views}
                        keyboardType="number-pad"
                        placeholder="e.g. 1200"
                      />
                      <Text style={styles.hint}>
                        This is the most important number. Look at your last 5 to 10 and enter the
                        usual figure. Aba will ask for screenshots to confirm it.
                      </Text>
                      <TextField
                        label={`${platformMeta?.followersLabel ?? "Followers"} (for your profile)`}
                        value={followers}
                        onChangeText={(t) => {
                          setFollowers(t);
                          setErrors((e) => ({ ...e, followers: undefined }));
                        }}
                        error={errors.followers}
                        keyboardType="number-pad"
                        placeholder="e.g. 5400"
                      />
                    </>
                  )}
                  <FormMessage message={formError} />
                  <Button
                    title={editingId ? "Save changes" : "Add account"}
                    loading={saving}
                    onPress={onSaveAccount}
                  />
                  <Button title="Cancel" variant="secondary" disabled={saving} onPress={closeForm} />
                  {!!editingId && (
                    <Pressable onPress={onRemove} disabled={saving} style={styles.remove}>
                      <Text style={styles.removeText}>Remove this account</Text>
                    </Pressable>
                  )}
                </Card>
              ) : (
                <Button
                  title={hasAccounts ? "Add another account" : "Add an account"}
                  variant="secondary"
                  onPress={openAddForm}
                />
              )}
            </>
          )}

          <Button title="Log out" variant="secondary" onPress={logOut} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Check({ done, text }: { done: boolean; text: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={done ? "checkmark-circle" : "ellipse-outline"}
        size={20}
        color={done ? colors.black : colors.gray400}
      />
      <Text style={[styles.checkText, done && { color: colors.black }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.title, color: colors.black, marginTop: spacing.md },
  signedIn: { ...typography.caption, color: colors.gray600 },
  heading: { ...typography.heading, color: colors.black },
  label: { ...typography.label, color: colors.black },
  hint: { ...typography.caption, color: colors.gray600, lineHeight: 18 },
  gap: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  progress: { gap: spacing.sm, backgroundColor: colors.gray50 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkText: { ...typography.body, color: colors.gray600 },
  reach: { ...typography.label, color: colors.black, marginTop: spacing.xs },
  accountCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  accountName: { ...typography.label, color: colors.black },
  accountHandle: { ...typography.caption, color: colors.gray600 },
  accountRight: { alignItems: "flex-end" },
  accountFollowers: { ...typography.heading, color: colors.black },
  accountStatus: { ...typography.caption, color: colors.gray600, fontSize: 12 },
  form: { gap: spacing.md },
  error: { ...typography.caption, color: colors.danger },
  remove: { alignItems: "center", paddingVertical: spacing.sm },
  removeText: { ...typography.label, color: colors.danger },
});
