import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { SkeletonCard } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";
import { NovaAccount, loadNovaProfile, platformLabel, platformName, serviceKind } from "@/lib/novaProfile";
import { dayName, posterDate } from "@/lib/posterDates";
import {
  FOUL_TEXT,
  OUTCOME_TEXT,
  SHOT_KINDS,
  WAIT_NOTE,
  Box,
  Check,
  Shot,
  ShotKind,
  getPoster,
  loadBoxes,
  loadChecks,
  loadShots,
  readPendingShots,
  sendScreenshot,
} from "@/lib/verification";
import { exampleImage, guideLines } from "@/lib/examples";
import { shortNumber } from "@/lib/validation";
import { colors, posterTemplate, spacing, textOnArt, typography } from "@/theme";

// The Rank tab. It holds the reach check: two rounds. Round 1 is the full check. Round 2 is one easy screenshot
// of a second poster, on a day ABBA picks and tells the Nova straight away.
// Lumens, tier and trust rating arrive on Day 16, built on the numbers read from these screenshots.
export default function NovaVerification() {
  const { profile } = useAuth();
  const userId = profile?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<NovaAccount[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    readPendingShots(); // quietly asks again for any screenshot that was not read yet
    const [p, v] = await Promise.all([loadNovaProfile(userId), loadChecks()]);
    if (p.ok) setAccounts(p.accounts);
    else setError("We could not load your accounts. Pull down to refresh.");
    if (v.ok) setChecks(v.checks);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Pull down to reload: also asks again for any screenshot that was not read yet.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setReloadKey((k) => k + 1);
    setRefreshing(false);
  }, [refresh]);

  const open = accounts.find((a) => a.id === openId);

  return (
    <GraffitiBackground variant="verify" strength={1}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        >
          <Text style={styles.title}>Rank</Text>
          {open ? (
            <AccountCheck
              userId={userId}
              account={open}
              reloadKey={reloadKey}
              onBack={() => {
                setOpenId("");
                refresh();
              }}
            />
          ) : (
            <>
              <Text style={styles.hint}>
                Businesses pay for real views, so ABBA checks yours in two easy rounds. Post the ABBA poster, send two screenshots, then one more
                on a day we pick. Your Lumens, tier and trust rating come next.
              </Text>
              <FormMessage message={error} />
              {loading ? (
                <SkeletonCard lines={3} />
              ) : accounts.length === 0 ? (
                <Card>
                  <Text style={styles.body}>Add a social account in your Profile first, then come back to check your reach.</Text>
                </Card>
              ) : (
                accounts.map((a) => {
                  const c = checks.find((x) => x.account_id === a.id);
                  return (
                    <Card key={a.id} style={styles.card} onPress={() => setOpenId(a.id)}>
                      <Text style={styles.cardTitle}>
                        {platformLabel(a.platform)} · @{a.handle.replace(/^@/, "")}
                      </Text>
                      <Text style={styles.meta}>
                        {a.avg_views > 0 ? `You say your usual views are ${shortNumber(a.avg_views)}. Not verified yet.` : "Not verified yet."}
                      </Text>
                      <Text style={styles.link}>{listAction(c)}</Text>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GraffitiBackground>
  );
}

// One short line on each account card: what to do next.
function listAction(c: Check | undefined): string {
  if (!c) return "Start: get my ABBA poster";
  switch (c.state) {
    case "round1_start":
      return "Get a new poster";
    case "round1":
      return "Round 1: open my poster";
    case "wait2":
      return c.round2_date ? `Round 2 is on ${dayName(c.round2_date)}` : "Round 2 is coming";
    case "ready2":
      return "Round 2 is today. Get my poster";
    case "round2":
      return "Round 2: open my poster";
    case "review":
      return "All sent. We are checking your numbers";
  }
}

function AccountCheck({ userId, account, reloadKey, onBack }: { userId: string; account: NovaAccount; reloadKey: number; onBack: () => void }) {
  const router = useRouter();
  const platform = platformName(account.platform);
  const asPost = serviceKind(account.platform) === "post";
  const [check, setCheck] = useState<Check | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [now, setNow] = useState(Date.now());
  const [kind, setKind] = useState<ShotKind>("poster_views");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "info">("info");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const r = await loadChecks();
      const c = r.ok ? (r.checks.find((x) => x.account_id === account.id) ?? null) : null;
      setCheck(c);
      if (c) {
        const [s, b] = await Promise.all([loadShots(c.poster_id), loadBoxes(account.id)]);
        if (s.ok) setShots(s.shots);
        if (b.ok) setBoxes(b.boxes);
      }
      setLoading(false);
    },
    [account.id],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Pull-down reload from the screen above.
  useEffect(() => {
    if (reloadKey > 0) load(true);
  }, [reloadKey, load]);

  // While a screenshot is being read, look again every few seconds (for up to a few minutes).
  const checking = shots.some((x) => x.outcome === "checking");
  useEffect(() => {
    if (!checking) return;
    let n = 0;
    const id = setInterval(() => {
      if (++n > 40) {
        clearInterval(id);
        return;
      }
      readPendingShots();
      load(true);
    }, 8000);
    return () => clearInterval(id);
  }, [checking, load]);

  // A one second clock, only while there is a waiting time to count down.
  const waiting = boxes.some((b) => b.state === "wait" && b.retry_at && new Date(b.retry_at).getTime() > now);
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  // Which screenshots can be sent right now.
  // Post services (TikTok, X): the profile screenshot comes first, then the poster views. No own post, no round 2.
  const profileDone = boxes.some((b) => b.kind === "profile" && b.state === "accepted");
  const kinds: ShotKind[] = [];
  if (asPost) {
    if (check?.state === "round1") kinds.push(profileDone ? "poster_views" : "profile");
  } else {
    if (check?.state === "round1") kinds.push("poster_views");
    if (check?.state === "round2") kinds.push("poster_views");
    if (check?.own_open && check.state !== "round1_start") kinds.push("story_views");
  }
  const picked: ShotKind = kinds.includes(kind) ? kind : (kinds[0] ?? "poster_views");
  const kindInfo = SHOT_KINDS.find((k) => k.id === picked)!;

  // The state of the box that is picked: what can be done with it now.
  const boxPoster = check ? (picked === "story_views" ? check.own_poster_id : check.poster_id) : "";
  const box = boxes.find((b) => b.poster_id === boxPoster && b.kind === picked);
  const waitLeft = box?.state === "wait" && box.retry_at ? Math.max(0, Math.ceil((new Date(box.retry_at).getTime() - now) / 1000)) : 0;
  const boxState = box?.state === "wait" && waitLeft === 0 ? "retry" : (box?.state ?? "open");
  const canSend = boxState === "open" || boxState === "retry";
  const boxMessage = (() => {
    switch (boxState) {
      case "accepted":
        return "Accepted. This part is done until your next rank check.";
      case "foul":
        return FOUL_TEXT;
      case "review":
        return "A person will check this one. You will get feedback.";
      case "checking":
        return "Checking your screenshot. This usually takes a few minutes.";
      case "wait": {
        const m = Math.floor(waitLeft / 60);
        const sec = String(waitLeft % 60).padStart(2, "0");
        return `We could not use that one. You can send another in ${m}:${sec}.`;
      }
      case "retry":
        return `We could not use that screenshot. Send another: a clear, full screenshot from ${platform}, showing the views.`;
      default:
        return "";
    }
  })();

  const boxDone = (k: ShotKind) => boxes.some((b) => b.kind === k && b.state === "accepted");
  const pill = progressOf(check, asPost, profileDone, shots.length > 0);
  const [histOpen, setHistOpen] = useState(true);
  const [info, setInfo] = useState("");
  const toggleInfo = (key: string) => setInfo((i) => (i === key ? "" : key));
  const guide = (k: ShotKind) => <GuidePanel service={account.platform} kind={k} appName={platform} />;

  const getNew = async () => {
    setBusy(true);
    setMessage("");
    const r = await getPoster(account.id);
    setBusy(false);
    if (!r.ok) {
      setTone("error");
      setMessage(r.message);
      return;
    }
    setCheck(r.check);
    setShots([]);
    setKind("poster_views");
  };

  const openPoster = () => {
    if (!check) return;
    router.push({
      pathname: "/nova/poster",
      params: { handle: account.handle, platform, code: check.code, issued: check.issued_at },
    });
  };

  const send = async () => {
    if (!check) return;
    setMessage("");
    setBusy(true);
    const posterId = picked === "story_views" ? check.own_poster_id : check.poster_id;
    const r = await sendScreenshot(userId, posterId, picked);
    setBusy(false);
    if (!r.ok) {
      setTone("error");
      setMessage(r.message);
      return;
    }
    if (r.status === null) return; // closed the gallery
    setTone("info");
    setMessage(WAIT_NOTE);
    await load(true);
  };

  const day = check?.round2_date ? dayName(check.round2_date) : "";
  const hasPoster = !!check && (check.state === "round1" || check.state === "round2") && (!asPost || profileDone);
  const needProfile = !!check && check.state === "round1" && asPost && !profileDone;

  return (
    <>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} accessibilityRole="button">
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Pressable onPress={() => load(true)} accessibilityRole="button">
          <Text style={styles.link}>Reload</Text>
        </Pressable>
      </View>
      <Text style={styles.cardTitle}>
        {platform} · @{account.handle.replace(/^@/, "")}
      </Text>
      {check && <ProgressPill label={pill.label} fraction={pill.fraction} />}
      {loading && !check ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {(!check || check.state === "round1_start") && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{check ? "Your poster has expired" : asPost ? "Your check" : "Round 1 of 2"}</Text>
              <Text style={styles.body}>
                {asPost
                  ? "Get your ABBA poster. It has your own code and is good for 24 hours. First you send a screenshot of your profile, then you post the poster and send a screenshot of its views."
                  : "Get your ABBA poster. It has your own code and is good for 24 hours. You post it, then send two screenshots. We will tell you the day for round 2 right away."}
              </Text>
              <FormMessage message={message} tone={tone} />
              <Button title={check ? "Get a new poster" : "Get my ABBA poster"} loading={busy} onPress={getNew} />
            </Card>
          )}

          {check?.state === "ready2" && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Round 2 is today</Text>
              <Text style={styles.body}>
                Get your second poster, post it today, and send one screenshot of its views. That is all.
              </Text>
              <FormMessage message={message} tone={tone} />
              <Button title="Get my second poster" loading={busy} onPress={getNew} />
            </Card>
          )}

          {check?.state === "wait2" && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{day ? `Round 2 is on ${day}` : "Round 2 is coming"}</Text>
              <Text style={styles.body}>
                Round 1 is done. {day ? `Come back on ${day}` : "Come back on your day"}, get your second poster, post it, and send one screenshot of its
                views. You can come back any time after that day too.
              </Text>
            </Card>
          )}

          {check?.state === "review" && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>All sent</Text>
              <Text style={styles.body}>Thank you. We are checking your numbers. Your tier and rating come next.</Text>
            </Card>
          )}

          {needProfile && (
            <Card style={styles.card}>
              <View style={styles.histHead}>
                <Text style={styles.cardTitle}>Step 1: your profile</Text>
                <InfoButton open={info === "profile"} onPress={() => toggleInfo("profile")} />
              </View>
              {info === "profile" && guide("profile")}
              <Text style={styles.body}>
                Open your {platform} profile and take a screenshot. It must show your name, your followers and the views on your recent posts
                ({platform === "X" ? "at least 3 posts" : "at least 6 posts"}). We use it to work out your price. Once it is accepted, your ABBA poster
                appears here.
              </Text>
              <Text style={styles.meta}>Your poster code is already reserved. Send this soon, because the poster lasts 24 hours from now.</Text>
            </Card>
          )}

          {hasPoster && check && (
            <>
              <Card style={styles.card}>
                <View style={styles.posterHead}>
                  <Image source={posterTemplate} style={styles.posterThumb} resizeMode="cover" />
                  <View style={styles.posterInfo}>
                    <Text style={styles.cardTitle}>{asPost ? "Your ABBA poster" : "Your ABBA poster"}</Text>
                    <Text style={styles.meta}>Good until {posterDate(check.expires_at)}, for 24 hours.</Text>
                    <Button title="Open my poster" onPress={openPoster} />
                  </View>
                </View>
              </Card>
              <Card style={styles.card}>
                <StepRow icon="download-outline" onPress={openPoster}>
                  1. Open your poster and take a screenshot. Your code is the small writing at the bottom, so keep it in.
                </StepRow>
                <StepRow icon="megaphone-outline">
                  2. Post it on your {platform} {asPost ? "page as a normal post" : "story"} today. It is good until {posterDate(check.expires_at)}, for 24 hours.
                </StepRow>
                {asPost ? (
                  <>
                    <StepRow icon="eye-outline" done={boxDone("poster_views")} onPress={() => setKind("poster_views")} infoOpen={info === "poster_views"} onInfo={() => toggleInfo("poster_views")}>
                      3. A few hours later, send a screenshot of the views on the poster post. That is all. You can delete the post after 24 hours, or keep it.
                    </StepRow>
                    {info === "poster_views" && guide("poster_views")}
                  </>
                ) : check.round === 1 ? (
                  <>
                    <StepRow icon="eye-outline" done={boxDone("poster_views")} onPress={() => setKind("poster_views")} infoOpen={info === "poster_views"} onInfo={() => toggleInfo("poster_views")}>
                      3. A few hours later, before it disappears, send a screenshot of who viewed it.
                    </StepRow>
                    {info === "poster_views" && guide("poster_views")}
                    <StepRow icon="stats-chart-outline" done={boxDone("story_views")} onPress={() => setKind("story_views")} infoOpen={info === "story_views"} onInfo={() => toggleInfo("story_views")}>
                      4. Send a screenshot of the views on one of your own stories from the same 24 hours. It can be about anything.
                    </StepRow>
                    {info === "story_views" && guide("story_views")}
                    {day ? <Text style={styles.meta}>Round 2 is on {day}. It is just one more screenshot.</Text> : null}
                  </>
                ) : (
                  <>
                    <StepRow icon="eye-outline" done={boxDone("poster_views")} onPress={() => setKind("poster_views")} infoOpen={info === "poster_views"} onInfo={() => toggleInfo("poster_views")}>
                      3. A few hours later, before it disappears, send a screenshot of who viewed it. That is all.
                    </StepRow>
                    {info === "poster_views" && guide("poster_views")}
                  </>
                )}
                <Text style={styles.meta}>Only send real screenshots. Edited or reused ones are rejected and lower your trust rating.</Text>
              </Card>
            </>
          )}

          {kinds.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.histHead}>
                <Text style={styles.cardTitle}>Send a screenshot</Text>
                <InfoButton open={info === `send_${picked}`} onPress={() => toggleInfo(`send_${picked}`)} />
              </View>
              {info === `send_${picked}` && guide(picked)}
              {kinds.length > 1 && (
                <View style={styles.chips}>
                  {kinds.map((k) => (
                    <Chip key={k} label={SHOT_KINDS.find((x) => x.id === k)!.label} selected={picked === k} onPress={() => setKind(k)} />
                  ))}
                </View>
              )}
              <Text style={styles.meta}>{kindInfo.help}</Text>
              {boxMessage ? <Text style={styles.body}>{boxMessage}</Text> : null}
              <FormMessage message={message} tone={tone} />
              {canSend && <Button title="Choose screenshot" loading={busy} onPress={send} />}
            </Card>
          )}

          {shots.filter((x) => SHOT_KINDS.some((k) => k.id === x.kind)).length > 0 && (
            <Card style={styles.card}>
              <Pressable onPress={() => setHistOpen((o) => !o)} accessibilityRole="button" accessibilityLabel="Show or hide what you sent" style={styles.histHead}>
                <Text style={styles.cardTitle}>Sent so far</Text>
                <Ionicons name={histOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.iconMuted} />
              </Pressable>
              {histOpen &&
                shots
                  .filter((x) => SHOT_KINDS.some((k) => k.id === x.kind))
                  .map((x) => (
                    <Text key={x.id} style={styles.body}>
                      {SHOT_KINDS.find((k) => k.id === x.kind)?.label} · {OUTCOME_TEXT[x.outcome] ?? "Checking"}
                    </Text>
                  ))}
              {checking && <Text style={styles.meta}>{WAIT_NOTE}</Text>}
            </Card>
          )}
        </>
      )}
    </>
  );
}

// Where the Nova is, as a pill with a progress bar under it.
function progressOf(c: Check | null, asPost: boolean, profileDone: boolean, anySent: boolean): { label: string; fraction: number } {
  if (!c) return { label: asPost ? "Step 1 of 2" : "Round 1 of 2", fraction: 0.04 };
  if (asPost) {
    if (c.state === "review") return { label: "Step 2 of 2", fraction: 1 };
    return profileDone ? { label: "Step 2 of 2", fraction: 0.6 } : { label: "Step 1 of 2", fraction: anySent ? 0.3 : 0.15 };
  }
  switch (c.state) {
    case "round1_start":
      return { label: "Round 1 of 2", fraction: 0.04 };
    case "round1":
      return { label: "Round 1 of 2", fraction: 0.1 + (c.views_count > 0 ? 0.2 : 0) + (c.own_count > 0 ? 0.2 : 0) };
    case "wait2":
    case "ready2":
      return { label: "Round 2 of 2", fraction: 0.55 };
    case "round2":
      return { label: "Round 2 of 2", fraction: 0.75 };
    default:
      return { label: "Round 2 of 2", fraction: 1 };
  }
}

function ProgressPill({ label, fraction }: { label: string; fraction: number }) {
  return (
    <View style={styles.pillWrap}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{label}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` }]} />
      </View>
    </View>
  );
}

// The small i. Tap it to open or close the guide under its heading.
function InfoButton({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="How to take this screenshot" hitSlop={10}>
      <Ionicons name={open ? "information-circle" : "information-circle-outline"} size={24} color={colors.accent} />
    </Pressable>
  );
}

// The guide: a few short lines and an example picture of the app screen.
function GuidePanel({ service, kind, appName }: { service: string; kind: ShotKind; appName: string }) {
  const img = exampleImage(service, kind);
  return (
    <View style={styles.guide}>
      <Text style={styles.guideTitle}>How to take it</Text>
      {guideLines(service, kind, appName).map((l, i) => (
        <Text key={i} style={styles.body}>
          {i + 1}. {l}
        </Text>
      ))}
      {img ? (
        <>
          <Image source={img} style={styles.guideImg} resizeMode="contain" accessibilityLabel="Example screenshot" />
          <Text style={styles.meta}>Example. Your post will look different. Only the screen matters.</Text>
        </>
      ) : (
        <Text style={styles.meta}>An example picture for this app is coming soon.</Text>
      )}
    </View>
  );
}

// One step: an icon on the left, the words, and an arrow on the right when it can be tapped.
function StepRow({ icon, children, onPress, done, onInfo, infoOpen }: { icon: keyof typeof Ionicons.glyphMap; children: string | (string | number)[] | React.ReactNode; onPress?: () => void; done?: boolean; onInfo?: () => void; infoOpen?: boolean }) {
  const inner = (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>
        <Ionicons name={done ? "checkmark-circle" : icon} size={20} color={colors.accent} />
      </View>
      <Text style={styles.stepText}>{children}</Text>
      {onInfo ? <InfoButton open={!!infoOpen} onPress={onInfo} /> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {inner}
    </Pressable>
  ) : (
    inner
  );
}

const styles = StyleSheet.create({
  posterHead: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  posterThumb: { width: 64, height: 86, borderRadius: 10, backgroundColor: colors.surfaceRaised },
  posterInfo: { flex: 1, gap: spacing.xs },
  stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  stepIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised },
  stepText: { flex: 1, ...typography.body, color: colors.textMuted },
  pillWrap: { gap: spacing.sm },
  pill: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong },
  pillText: { ...typography.label, color: colors.text },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.skeleton, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  guide: { gap: spacing.sm, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceRaised },
  guideTitle: { ...typography.label, color: colors.accent },
  guideImg: { width: "100%", height: 380, borderRadius: 10, backgroundColor: "#000" },
  histHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: {
    ...textOnArt,
    ...typography.title,
    color: colors.text,
    marginTop: spacing.md,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, 'Times New Roman', serif" }),
    fontSize: 36,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  body: { ...typography.body, color: colors.textMuted },
  card: { gap: spacing.sm },
  cardTitle: { ...typography.label, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
});
