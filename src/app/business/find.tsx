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
import { Radar } from "@/components/Radar";
import { ResponseRow } from "@/components/ResponseRow";
import { SkeletonCard } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import { pingBadges } from "@/lib/attention";
import { useAuth } from "@/lib/auth";
import { loadBusinessProfile } from "@/lib/businessProfile";
import { CITIES, PLATFORMS, platformLabel } from "@/lib/novaProfile";
import {
  LocationState,
  Offer,
  checkLocation,
  closeOffer,
  countMatchingNovas,
  createOffer,
  loadOffers,
} from "@/lib/offers";
import { Response, loadResponses } from "@/lib/negotiation";
import { LUMEN_OPTIONS, OfferKind, POST_WITHIN_OPTIONS, recommendPrice, viewsFor } from "@/lib/pricing";
import { checkBudget, checkDescription, checkOfferTitle, parseBudget, shortNumber } from "@/lib/validation";
import { colors, radius, spacing, textOnArt, typography } from "@/theme";

type Mode = "list" | "form" | "searching";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FindNovas() {
  const { profile } = useAuth();
  const userId = profile?.id ?? "";

  const router = useRouter();
  const [mode, setMode] = useState<Mode>("list");
  const modeRef = useRef<Mode>("list");
  modeRef.current = mode;
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [postWithin, setPostWithin] = useState(7);
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
    const [o, p, rs] = await Promise.all([loadOffers(userId), loadBusinessProfile(userId), loadResponses()]);
    if (!o.ok) {
      setLoadError(o.message);
      setLoading(false);
      return;
    }
    setLoadError("");
    setOffers(o.offers);
    if (rs.ok) setResponses(rs.responses);
    if (p.ok) {
      setProfileCity(p.city);
      setProfileComplete(!!(p.business_name && p.category && p.city));
    }
    setLoading(false);
    pingBadges();
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Look again each time the tab is opened, to catch new answers from Novas.
  useFocusEffect(
    useCallback(() => {
      refresh();
      // Look again every 30 seconds, but never while the person is typing a new offer.
      const timer = setInterval(() => {
        if (modeRef.current === "list") refresh();
      }, 30000);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  const openForm = () => {
    setTitle("");
    setDescription("");
    setBudget("");
    setKind("");
    setPostWithin(7);
    setLumens(null);
    setPlatforms([]);
    const known = CITIES.slice(0, -1).includes(profileCity);
    setCityPick(profileCity ? (known ? profileCity : "Other") : "");
    setOtherCity(profileCity && !known ? profileCity : "");
    setErrors({});
    setFormError("");
    setMode("form");
  };

  const recommended = lumens && kind ? recommendPrice(lumens, kind, platforms.length) : 0;

  // Whenever the reach, type or platforms change, suggest a new price
  // (the business can still type its own).
  const suggest = (l: number | null, k: OfferKind | "", count: number) => {
    if (l && k) setBudget(String(recommendPrice(l, k, count)));
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
      description: checkDescription(description),
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

  const onClose = async (id: string) => {
    const result = await closeOffer(id);
    if (!result.ok) {
      setLoadError(result.message);
      return;
    }
    refresh();
  };

  return (
    <GraffitiBackground variant="home" strength={0.85}>
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
                    <Button title="Done" onPress={() => setMode("list")} />
                  </>
                )}
              </View>
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
                <Text style={styles.title}>Find Novas</Text>
                <Text style={styles.hint}>
                  Post an open offer with your price. Novas who match can accept it or counter.
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
                  <Button title="Post an offer" onPress={openForm} disabled={profileComplete === null} />
                )}

                <Text style={[styles.heading, { marginTop: spacing.md }]}>Your offers</Text>
                {loading ? (
                  <View style={styles.gap} accessibilityLabel="Loading your offers">
                    <SkeletonCard lines={2} />
                    <SkeletonCard lines={2} />
                  </View>
                ) : loadError ? (
                  <View style={styles.gap}>
                    <FormMessage message={loadError} />
                    <Button title="Try again" variant="secondary" onPress={() => { setLoading(true); refresh(); }} />
                  </View>
                ) : offers.length === 0 ? (
                  <Card>
                    <Text style={styles.body}>No offers yet. Post your first one above.</Text>
                  </Card>
                ) : (
                  offers.map((o) => (
                    <Card key={o.id} style={styles.offer}>
                      <View style={styles.offerTop}>
                        <Text style={[styles.offerTitle, styles.flex]}>{o.title}</Text>
                        <Text style={styles.price}>GHS {shortNumber(o.budget_ghs)}</Text>
                      </View>
                      <Text style={styles.meta}>
                        {o.kind === "multi" ? "Several platforms: " : ""}{o.platforms.map(platformLabel).join(", ")} · {shortNumber(o.target_views)} views · {o.city || "Anywhere in Ghana"}
                      </Text>
                      <Text style={styles.meta}>One-time post, within {o.post_within_days} days</Text>
                      <View style={styles.offerBottom}>
                        <Text style={[styles.status, o.status !== "closed" && { color: colors.accent }]}>
                          {o.status === "open" ? "Open" : o.status === "agreed" ? "Deal agreed" : "Closed"}
                        </Text>
                        {o.status === "open" && (
                          <Text style={styles.closeLink} onPress={() => onClose(o.id)}>
                            Close offer
                          </Text>
                        )}
                      </View>
                      {responses
                        .filter((r) => r.offer_id === o.id && (o.status === "open" || r.status === "agreed"))
                        .map((r) => (
                          <ResponseRow key={r.negotiation_id} r={r} onChanged={refresh} />
                        ))}
                    </Card>
                  ))
                )}
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
  recoPrice: { ...typography.title, color: colors.accent },
  offer: { gap: spacing.xs },
  offerTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  offerTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: colors.accent },
  meta: { ...typography.caption, color: colors.textMuted },
  offerBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  status: { ...typography.caption, color: colors.textMuted },
  closeLink: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline" },
});
