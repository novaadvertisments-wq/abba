import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { ChoiceCard } from "@/components/ChoiceCard";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { GroupDraft, takePendingDraft } from "@/lib/groups";
import { takePendingOffer } from "@/lib/offers";
import { GroupForm } from "@/components/GroupForm";
import { Radar } from "@/components/Radar";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/lib/auth";
import { loadBusinessProfile } from "@/lib/businessProfile";
import { CITIES, PLATFORMS } from "@/lib/novaProfile";
import {
  LocationState,
  checkLocation,
  countMatchingNovas,
  createOffer,
} from "@/lib/offers";
import { LUMEN_OPTIONS, OfferKind, DURATION_OPTIONS, POST_WITHIN_OPTIONS, durationLabel, recommendPrice, viewsFor } from "@/lib/pricing";
import { checkBudget, checkOfferDescription, checkOfferTitle, parseBudget, shortNumber } from "@/lib/validation";
import { colors, gold, radius, spacing, textOnArt, typography } from "@/theme";

type Mode = "list" | "form" | "group" | "searching";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FindNovas() {
  const { profile } = useAuth();
  const userId = profile?.id ?? "";

  const router = useRouter();
  const [mode, setMode] = useState<Mode>("list");
  const [draft, setDraft] = useState<GroupDraft | null>(null);
  const modeRef = useRef<Mode>("list");
  modeRef.current = mode;
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [postWithin, setPostWithin] = useState(7);
  const [duration, setDuration] = useState(1);
  const [profileCity, setProfileCity] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [kind, setKind] = useState<OfferKind | "">("");
  const [lumens, setLumens] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [cityPick, setCityPick] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [errors, setErrors] = useState<{ kind?: string; lumens?: string; title?: string; description?: string; budget?: string; platforms?: string; city?: string }>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Searching screen
  const [searching, setSearching] = useState(true);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [locState, setLocState] = useState<LocationState>("granted");
  const [searchCity, setSearchCity] = useState("");
  const [searchKind, setSearchKind] = useState<OfferKind>("single");

  const refresh = useCallback(async () => {
    if (!userId) return;
    const p = await loadBusinessProfile(userId);
    if (p.ok) {
      setProfileCity(p.city);
      setProfileComplete(!!(p.business_name && p.category && p.city));
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Look again each time the tab is opened, to catch new answers from Novas.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const d = takePendingDraft();
      if (d) {
        setDraft(d);
        setMode("group");
      }
      const old = takePendingOffer();
      if (old) {
        // "Post again": the form opens filled in with the old offer.
        const known = CITIES.slice(0, -1).includes(old.city);
        setTitle(old.title);
        setDescription(old.description);
        setBudget(String(old.budget_ghs));
        setKind(old.kind);
        setPostWithin(old.post_within_days);
        setDuration(old.duration_days);
        setLumens(Math.max(1, Math.round(old.target_views / 1000)));
        setPlatforms(old.platforms);
        setCityPick(old.city ? (known ? old.city : "Other") : "");
        setOtherCity(old.city && !known ? old.city : "");
        setErrors({});
        setFormError("");
        setMode("form");
      }
    }, [refresh]),
  );

  const openForm = () => {
    setTitle("");
    setDescription("");
    setBudget("");
    setKind("");
    setPostWithin(7);
    setDuration(1);
    setLumens(null);
    setPlatforms([]);
    const known = CITIES.slice(0, -1).includes(profileCity);
    setCityPick(profileCity ? (known ? profileCity : "Other") : "");
    setOtherCity(profileCity && !known ? profileCity : "");
    setErrors({});
    setFormError("");
    setMode("form");
  };

  const recommended = lumens && kind ? recommendPrice(lumens, kind, platforms.length, duration) : 0;

  // Whenever the reach, type or platforms change, suggest a new price
  // (the business can still type its own).
  const suggest = (l: number | null, k: OfferKind | "", count: number, d: number = duration) => {
    if (l && k) setBudget(String(recommendPrice(l, k, count, d)));
  };

  const chooseKind = (k: OfferKind) => {
    setKind(k);
    const next = k === "single" ? platforms.slice(0, 1) : platforms;
    setPlatforms(next);
    setErrors((e) => ({ ...e, kind: undefined, platforms: undefined }));
    suggest(lumens, k, next.length);
  };

  const chooseLumens = (l: number) => {
    setLumens(l);
    setErrors((e) => ({ ...e, lumens: undefined, budget: undefined }));
    suggest(l, kind, platforms.length);
  };

  const togglePlatform = (id: string) => {
    const next =
      kind === "single"
        ? [id]
        : platforms.includes(id)
        ? platforms.filter((x) => x !== id)
        : [...platforms, id];
    setPlatforms(next);
    setErrors((e) => ({ ...e, platforms: undefined }));
    suggest(lumens, kind, next.length);
  };

  const chosenCity = cityPick === "Other" ? otherCity.trim() : cityPick;

  const onPost = async () => {
    const next = {
      kind: kind ? "" : "Choose one platform or several",
      lumens: lumens ? "" : "Choose how many views you want",
      title: checkOfferTitle(title),
      description: checkOfferDescription(description),
      budget: checkBudget(budget),
      platforms:
        kind === "multi" && platforms.length < 2
          ? "Choose at least two platforms, or switch to one platform"
          : platforms.length
          ? ""
          : "Choose a platform",
      city: cityPick === "Other" && !chosenCity ? "Type your city or town" : "",
    };
    setErrors(next);
    setFormError("");
    if (next.kind || next.lumens || next.title || next.description || next.budget || next.platforms || next.city) return;

    setSaving(true);
    const result = await createOffer(userId, {
      title: title.trim(),
      description: description.trim(),
      budget_ghs: parseBudget(budget) as number,
      platforms,
      city: chosenCity,
      target_views: viewsFor(lumens as number),
      recommended_ghs: recommended,
      kind: kind as OfferKind,
      post_within_days: postWithin,
      duration_days: duration,
    });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    // Show the radar for a few seconds while we count the matching Novas.
    setSearchCity(chosenCity);
    setSearchKind(kind as OfferKind);
    setSearching(true);
    setMatchCount(null);
    setMode("searching");
    const [count, loc] = await Promise.all([
      countMatchingNovas(chosenCity, platforms, kind as OfferKind),
      checkLocation(),
      wait(3800),
    ]).then(([c, l]) => [c, l] as const);
    setMatchCount(count);
    setLocState(loc);
    setSearching(false);
    refresh();
  };

  return (
    <GraffitiBackground variant="home" strength={1}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === "searching" ? (
              <View style={styles.searching}>
                <Text style={styles.title}>{searching ? "Searching…" : "Offer posted"}</Text>
                <Radar found={searching ? 0 : Math.min(matchCount ?? 0, 6)} />
                {searching ? (
                  <Text style={styles.centerText}>Looking for Novas {searchCity ? `near you in ${searchCity}` : "across Ghana"}</Text>
                ) : (
                  <>
                    <Text style={styles.big}>
                      {matchCount === null
                        ? "Your offer is live"
                        : matchCount === 0
                        ? "No Novas match yet"
                        : `${matchCount} ${matchCount === 1 ? "Nova" : "Novas"} can see your offer`}
                    </Text>
                    <Text style={styles.centerText}>
                      {matchCount === 0
                        ? "Your offer stays open. Novas " + (searchCity ? "in " + searchCity : "in Ghana") + (searchKind === "multi" ? " who accept multi-platform offers" : "") + " will see it as they join."
                        : "They can accept your price or send a counter-offer. You will see their answers here soon."}
                    </Text>
                    {locState === "denied" && (
                      <Text style={styles.hint}>
                        Location is off, so the search used your city instead. You can allow it in your phone's settings.
                      </Text>
                    )}
                    <Button
                      title="See my offers"
                      onPress={() => {
                        setMode("list");
                        router.push("/business/requests");
                      }}
                    />
                  </>
                )}
              </View>
            ) : mode === "group" ? (
              <GroupForm
                key={draft ? JSON.stringify(draft) : "new"}
                initial={draft}
                userId={userId}
                profileCity={profileCity}
                onCancel={() => { setDraft(null); setMode("list"); }}
                onPosted={() => {
                  setDraft(null);
                  setMode("list");
                  router.push("/business/campaigns");
                }}
              />
            ) : mode === "form" ? (
              <>
                <Text style={styles.title}>New offer</Text>
                <Text style={styles.hint}>
                  Say what you want advertised and how many people you want to reach. We suggest a price and you can change it.
                </Text>
                <TextField
                  label="Offer title"
                  value={title}
                  onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: undefined })); }}
                  error={errors.title}
                  placeholder="e.g. Promote our new jollof combo"
                  maxLength={60}
                />
                <TextField
                  label="Details (optional)"
                  value={description}
                  onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: undefined })); }}
                  error={errors.description}
                  placeholder="What should the Nova post? Any dates or links?"
                  multiline
                  maxLength={280}
                  style={styles.multiline}
                />
                <Text style={styles.heading}>How many platforms?</Text>
                <ChoiceCard
                  title="One platform"
                  description="One post or story on a single platform"
                  icon="logo-instagram"
                  selected={kind === "single"}
                  onPress={() => chooseKind("single")}
                />
                <ChoiceCard
                  title="Several platforms"
                  description="The same advert on two or more. Priced higher, because the Nova does more work"
                  icon="layers-outline"
                  selected={kind === "multi"}
                  onPress={() => chooseKind("multi")}
                />
                {!!errors.kind && <Text style={styles.error}>{errors.kind}</Text>}

                {!!kind && (
                  <>
                    <Text style={styles.heading}>
                      {kind === "single" ? "Which platform?" : "Which platforms? (pick two or more)"}
                    </Text>
                    <View style={styles.chips}>
                      {PLATFORMS.map((p) => (
                        <Chip
                          key={p.id}
                          label={p.label}
                          selected={platforms.includes(p.id)}
                          onPress={() => togglePlatform(p.id)}
                        />
                      ))}
                    </View>
                    {!!errors.platforms && <Text style={styles.error}>{errors.platforms}</Text>}
                  </>
                )}

                <Text style={styles.heading}>How much reach do you want?</Text>
                <Text style={styles.hint}>
                  1 lumen means about 1,000 views on each post. More lumens, more people see it.
                </Text>
                <View style={styles.chips}>
                  {LUMEN_OPTIONS.map((l) => (
                    <Chip
                      key={l}
                      label={`${l} ${l === 1 ? "lumen" : "lumens"}`}
                      selected={lumens === l}
                      onPress={() => chooseLumens(l)}
                    />
                  ))}
                </View>
                {!!errors.lumens && <Text style={styles.error}>{errors.lumens}</Text>}

                {!!lumens && !!kind && (
                  <Card style={styles.recommend}>
                    <Text style={styles.meta}>
                      Recommended for about {shortNumber(viewsFor(lumens))} views
                    </Text>
                    <Text style={styles.recoPrice}>GHS {recommended.toLocaleString("en-GH")}</Text>
                    <Text style={styles.hint}>
                      You can offer less or more below. Novas can accept or send back their own price.
                    </Text>
                  </Card>
                )}
                <TextField
                  label="Your price (GHS)"
                  value={budget}
                  onChangeText={(t) => { setBudget(t); setErrors((e) => ({ ...e, budget: undefined })); }}
                  error={errors.budget}
                  keyboardType="number-pad"
                  placeholder="e.g. 200"
                />
                {recommended > 0 && (parseBudget(budget) ?? recommended) < recommended * 0.6 && (
                  <Text style={styles.hint}>
                    That is well below the recommended price, so fewer Novas may accept.
                  </Text>
                )}

                <Text style={styles.heading}>When should it go up?</Text>
                <Text style={styles.hint}>
                  This is a one-time post. Choose how soon it must be posted after you agree on the price.
                </Text>
                <View style={styles.chips}>
                  {POST_WITHIN_OPTIONS.map((d) => (
                    <Chip key={d} label={`Within ${d} days`} selected={postWithin === d} onPress={() => setPostWithin(d)} />
                  ))}
                </View>
                <Text style={styles.heading}>How long should it stay up?</Text>
                <Text style={styles.hint}>
                  Longer adverts cost more. Stories disappear after 24 hours, so for a story the Nova will re-post or pin it.
                </Text>
                <View style={styles.chips}>
                  {DURATION_OPTIONS.map((d) => (
                    <Chip
                      key={d}
                      label={durationLabel(d)}
                      selected={duration === d}
                      onPress={() => {
                        setDuration(d);
                        suggest(lumens, kind, platforms.length, d);
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.hint}>
                  Ambassador deals, for adverts that run from 1 to 12 months, are coming later.
                </Text>

                <Text style={styles.heading}>Which city? (optional)</Text>
                <Text style={styles.hint}>Leave it empty to reach Novas anywhere in Ghana.</Text>
                <View style={styles.chips}>
                  {CITIES.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={cityPick === c}
                      onPress={() => { setCityPick(cityPick === c ? "" : c); setErrors((e) => ({ ...e, city: undefined })); }}
                    />
                  ))}
                </View>
                {cityPick === "Other" && (
                  <TextField
                    label="City or town"
                    value={otherCity}
                    onChangeText={(t) => { setOtherCity(t); setErrors((e) => ({ ...e, city: undefined })); }}
                    placeholder="e.g. Ho"
                  />
                )}
                {!!errors.city && <Text style={styles.error}>{errors.city}</Text>}
                <FormMessage message={formError} />
                <Button title="Post offer" loading={saving} onPress={onPost} />
                <Button title="Cancel" variant="secondary" disabled={saving} onPress={() => setMode("list")} />
              </>
            ) : (
              <>
                <Text style={styles.title}>Post</Text>
                <Text style={styles.hint}>
                  Choose what to post. Novas who match can accept or counter an offer, or join a group campaign.
                </Text>
                {profileComplete === false ? (
                  <Card style={styles.recommend}>
                    <Text style={styles.heading}>Finish your business profile first</Text>
                    <Text style={styles.hint}>
                      Novas need to see who is asking. Add your business name, category and city on your Profile.
                    </Text>
                    <Button title="Go to my profile" onPress={() => router.push("/business/profile")} />
                  </Card>
                ) : (
                  <>
                    <ChoiceCard
                      title="Single offer"
                      description="Name your price. Matching Novas accept it or counter"
                      icon="pricetag-outline"
                      selected={false}
                      onPress={openForm}
                    />
                    <ChoiceCard
                      title="Group campaign"
                      description="One budget shared by many Novas, by their views"
                      icon="people-outline"
                      selected={false}
                      onPress={() => setMode("group")}
                    />
                  </>
                )}

                <Text style={styles.hint}>
                  After you post, find your offers and the Novas who answered on the Offers tab, and your group campaigns on the Campaigns tab.
                </Text>
              </>
            )}
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
  heading: { ...textOnArt, ...typography.heading, color: colors.text },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  body: { ...typography.body, color: colors.textMuted },
  gap: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  searching: { gap: spacing.lg, alignItems: "stretch" },
  centerText: { ...textOnArt, ...typography.body, color: colors.text, textAlign: "center" },
  big: { ...textOnArt, ...typography.heading, color: colors.text, textAlign: "center" },
  recommend: { gap: spacing.xs, backgroundColor: colors.surfaceRaised },
  recoPrice: { ...typography.title, color: gold },
  offer: { gap: spacing.xs },
  offerTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  offerTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: gold },
  meta: { ...typography.caption, color: colors.textMuted },
  offerBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  status: { ...typography.caption, color: colors.textMuted },
  closeLink: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline" },
});
