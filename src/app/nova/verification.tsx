import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { PosterCard, posterDate } from "@/components/PosterCard";
import { SkeletonCard } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/lib/auth";
import { NovaAccount, loadNovaProfile, platformLabel } from "@/lib/novaProfile";
import {
  Poster, SHOT_KINDS, Shot, ShotKind, getPoster, loadPosters, loadShots, parseViews, sendScreenshot,
} from "@/lib/verification";
import { shortNumber } from "@/lib/validation";
import { colors, spacing, textOnArt, typography } from "@/theme";

// The Rank tab. For now it holds the reach check: get your ABBA poster, post it, send screenshots.
// Lumens, tier and trust rating arrive on Day 16, built on the numbers checked here.
export default function NovaVerification() {
  const { profile } = useAuth();
  const userId = profile?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<NovaAccount[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [p, v] = await Promise.all([loadNovaProfile(userId), loadPosters()]);
    if (p.ok) setAccounts(p.accounts);
    else setError("We could not load your accounts. Pull down to refresh.");
    if (v.ok) setPosters(v.posters);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const open = accounts.find((a) => a.id === openId);

  return (
    <GraffitiBackground variant="verify" strength={1}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Rank</Text>
          {open ? (
            <AccountCheck
              userId={userId}
              account={open}
              onBack={() => {
                setOpenId("");
                refresh();
              }}
            />
          ) : (
            <>
              <Text style={styles.hint}>
                Businesses pay for real views, so ABBA checks yours. Post the ABBA poster on each account, then send screenshots of your views.
                Your Lumens, tier and trust rating arrive next.
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
                  const p = posters.find((x) => x.account_id === a.id);
                  const sent = p ? p.live_count + p.views_count + p.story_count : 0;
                  return (
                    <Card key={a.id} style={styles.card} onPress={() => setOpenId(a.id)}>
                      <Text style={styles.cardTitle}>
                        {platformLabel(a.platform)} · @{a.handle.replace(/^@/, "")}
                      </Text>
                      <Text style={styles.meta}>
                        {a.avg_views > 0 ? `You say your usual views are ${shortNumber(a.avg_views)}. Not verified yet.` : "Not verified yet."}
                      </Text>
                      <Text style={styles.link}>
                        {!p ? "Get my ABBA poster" : p.active ? `Open my poster (${sent} screenshot${sent === 1 ? "" : "s"} sent)` : "Poster expired. Get a new one"}
                      </Text>
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

function AccountCheck({ userId, account, onBack }: { userId: string; account: NovaAccount; onBack: () => void }) {
  const [poster, setPoster] = useState<Poster | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [kind, setKind] = useState<ShotKind>("poster_live");
  const [views, setViews] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "info">("info");
  const [loading, setLoading] = useState(true);

  const kindInfo = SHOT_KINDS.find((k) => k.id === kind)!;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getPoster(account.id);
    if (!r.ok) {
      setTone("error");
      setMessage(r.message);
      setLoading(false);
      return;
    }
    setPoster(r.poster);
    const s = await loadShots(r.poster.poster_id);
    if (s.ok) setShots(s.shots);
    setLoading(false);
  }, [account.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const send = async () => {
    if (!poster) return;
    setMessage("");
    let n: number | null = null;
    if (kindInfo.needsViews) {
      n = parseViews(views);
      if (n === null) {
        setTone("error");
        setMessage("Enter the number of views shown in the screenshot, as a whole number like 1200.");
        return;
      }
    }
    setBusy(true);
    const r = await sendScreenshot(userId, poster.poster_id, kind, n);
    setBusy(false);
    if (!r.ok) {
      setTone("error");
      setMessage(r.message);
      return;
    }
    if (r.status === null) return; // closed the gallery
    setTone("info");
    setMessage(
      r.status === "needs_review"
        ? "Received. A person will take a closer look at this one before it counts."
        : "Received. It will be checked soon.",
    );
    setViews("");
    const s = await loadShots(poster.poster_id);
    if (s.ok) setShots(s.shots);
  };

  return (
    <>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.link}>Back</Text>
      </Pressable>
      {loading && !poster ? (
        <SkeletonCard lines={4} />
      ) : (
        poster && (
          <>
            <PosterCard
              handle={account.handle}
              platformName={platformLabel(account.platform)}
              code={poster.code}
              issuedAt={poster.issued_at}
              expiresAt={poster.expires_at}
            />
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>What to do</Text>
              <Text style={styles.body}>1. Take a screenshot of the poster above.</Text>
              <Text style={styles.body}>2. Post it on your {platformLabel(account.platform)} story or page.</Text>
              <Text style={styles.body}>3. Screenshot your live post, with the code showing, and send it below.</Text>
              <Text style={styles.body}>
                4. Before {posterDate(poster.expires_at)}, send a screenshot of the poster's views and one of your own recent posts.
              </Text>
              <Text style={styles.meta}>Only send real screenshots. Edited or reused ones are rejected and lower your trust rating.</Text>
            </Card>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Send a screenshot</Text>
              <View style={styles.chips}>
                {SHOT_KINDS.map((k) => (
                  <Chip key={k.id} label={k.label} selected={kind === k.id} onPress={() => setKind(k.id)} />
                ))}
              </View>
              <Text style={styles.meta}>{kindInfo.help}</Text>
              {kindInfo.needsViews && (
                <TextField
                  label="Views shown in the screenshot"
                  value={views}
                  onChangeText={setViews}
                  placeholder="e.g. 1200"
                  keyboardType="number-pad"
                />
              )}
              <FormMessage message={message} tone={tone} />
              <Button title="Choose screenshot" loading={busy} onPress={send} disabled={!poster.active} />
              {!poster.active && <Text style={styles.meta}>This poster has expired. Go back and get a new one.</Text>}
            </Card>
            {shots.length > 0 && (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Sent so far</Text>
                {shots.map((s) => (
                  <Text key={s.id} style={styles.body}>
                    {SHOT_KINDS.find((k) => k.id === s.kind)?.label}
                    {s.reported_views ? ` · ${shortNumber(s.reported_views)} views` : ""} ·{" "}
                    {s.status === "needs_review" ? "waiting for a closer look" : "received"}
                  </Text>
                ))}
              </Card>
            )}
          </>
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...textOnArt, ...typography.title, color: colors.text, marginTop: spacing.md },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  body: { ...typography.body, color: colors.textMuted },
  card: { gap: spacing.sm },
  cardTitle: { ...typography.label, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
