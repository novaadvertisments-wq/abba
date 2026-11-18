// Day 15: the human review queue. Only reviewers (set in the database) see anything here.
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormMessage } from "@/components/FormMessage";
import { SkeletonCard } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import { platformLabel } from "@/lib/novaProfile";
import { FLAG_TEXT, ReviewItem, SHOT_KINDS, decideShot, isReviewer, loadQueue, shotUrl } from "@/lib/verification";
import { shortNumber } from "@/lib/validation";
import { colors, spacing, typography } from "@/theme";

export default function ReviewScreen() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const ok = await isReviewer();
    setAllowed(ok);
    if (!ok) {
      setLoading(false);
      return;
    }
    const r = await loadQueue();
    if (r.ok) {
      setItems(r.items);
      setError("");
    } else {
      setError(r.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <Text style={styles.title}>Review</Text>
        <Text style={styles.link} onPress={() => router.back()} accessibilityRole="button">
          Back
        </Text>
        {loading ? (
          <SkeletonCard lines={4} />
        ) : allowed === false ? (
          <Card style={styles.card}>
            <Text style={styles.body}>This area is only for ABBA reviewers.</Text>
          </Card>
        ) : (
          <>
            <FormMessage message={error} />
            {!error && items.length === 0 ? (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>Nothing waiting</Text>
                <Text style={styles.body}>Every screenshot has been decided. Pull down to check again.</Text>
              </Card>
            ) : null}
            {items.map((it) => (
              <ReviewCard key={it.shot_id} item={it} onDone={() => setItems((l) => l.filter((x) => x.shot_id !== it.shot_id))} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewCard({ item, onDone }: { item: ReviewItem; onDone: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    shotUrl(item.file_path).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [item.file_path]);

  const ai = item.ai_result ?? {};
  const read = (k: string) => (ai[k] === undefined || ai[k] === null || ai[k] === "" ? "not read" : String(ai[k]));
  const kind = SHOT_KINDS.find((k) => k.id === item.kind)?.label ?? item.kind;

  const decide = async (decision: "approve" | "reject", cheating = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    const r = await decideShot(item.shot_id, decision, note.trim(), cheating);
    setBusy(false);
    if (r.ok) onDone();
    else setError(r.message);
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>
        {kind} · {platformLabel(item.service)} · @{item.handle.replace(/^@/, "")}
      </Text>
      <Text style={styles.meta}>
        {item.nova_name ?? "A Nova"} · says {shortNumber(item.followers)} followers, usual views {shortNumber(item.avg_views)} · poster code {item.poster_code}
      </Text>
      {item.outcome === "foul" ? <Text style={styles.warn}>The checks suspect foul play on this one.</Text> : null}
      {url ? (
        <Image source={{ uri: url }} style={styles.shot} resizeMode="contain" accessibilityLabel="The screenshot to review" />
      ) : (
        <View style={[styles.shot, styles.shotEmpty]}>
          <Text style={styles.meta}>Loading the picture…</Text>
        </View>
      )}
      <Text style={styles.sub}>What the AI read</Text>
      <Text style={styles.body}>
        Code: {read("code_text")} · Views: {read("views")} · Followers: {read("followers")} · Handle: {read("handle")}
        {item.kind === "profile" ? ` · Posts read: ${read("posts_read")} · Median views: ${read("median_views")}` : ""}
      </Text>
      {item.flags.length > 0 ? (
        <>
          <Text style={styles.sub}>Why it is here</Text>
          {item.flags.map((f) => (
            <Text key={f} style={styles.body}>
              • {FLAG_TEXT[f] ?? f}
            </Text>
          ))}
        </>
      ) : (
        <Text style={styles.meta}>The AI could not decide, and raised no flags.</Text>
      )}
      <TextField label="Note for the Nova (needed to send it back)" value={note} onChangeText={setNote} maxLength={300} multiline />
      <FormMessage message={error} />
      <Button title="Approve" loading={busy} onPress={() => decide("approve")} />
      <Button title="Send back" variant="secondary" disabled={busy} onPress={() => decide("reject")} />
      <Button title="Send back as fake (locks it)" variant="secondary" disabled={busy} onPress={() => decide("reject", true)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.title, color: colors.text },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline" },
  card: { gap: spacing.sm },
  cardTitle: { ...typography.heading, color: colors.text },
  sub: { ...typography.label, color: colors.accent, marginTop: spacing.sm },
  body: { ...typography.body, color: colors.textMuted },
  meta: { ...typography.caption, color: colors.textMuted },
  warn: { ...typography.label, color: colors.danger },
  shot: { width: "100%", height: 420, borderRadius: 12, backgroundColor: "#000" },
  shotEmpty: { alignItems: "center", justifyContent: "center" },
});
