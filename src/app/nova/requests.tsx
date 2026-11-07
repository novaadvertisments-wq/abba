import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CounterBox } from "@/components/CounterBox";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { SkeletonCard } from "@/components/Skeleton";
import { FeedOffer, loadFeed, respond } from "@/lib/negotiation";
import { platformLabel } from "@/lib/novaProfile";
import { MAX_COUNTERS } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { colors, spacing, textOnArt, typography } from "@/theme";

function OfferCard({ offer, onChanged }: { offer: FeedOffer; onChanged: () => void }) {
  const [countering, setCountering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const price = offer.last_price ?? offer.budget_ghs;
  const used = offer.counters ?? 0;
  const left = MAX_COUNTERS - used;

  const act = async (action: "accept" | "decline") => {
    setBusy(true);
    setError("");
    const r = await respond(offer.id, null, action);
    setBusy(false);
    if (!r.ok) setError(r.message);
    else onChanged();
  };

  const sendCounter = async (p: number) => {
    const r = await respond(offer.id, null, "counter", p);
    if (!r.ok) return r.message;
    setCountering(false);
    onChanged();
    return "";
  };

  const s = offer.neg_status;
  const canAnswer = offer.offer_status === "open" && (s === null || s === "pending_nova");

  return (
    <Card style={styles.offer}>
      <View style={styles.top}>
        <Text style={[styles.offerTitle, styles.flex]}>{offer.title}</Text>
        <Text style={styles.price}>GHS {shortNumber(price)}</Text>
      </View>
      {!!offer.business_name && <Text style={styles.meta}>{offer.business_name}</Text>}
      <Text style={styles.meta}>
        {offer.kind === "multi" ? "Several platforms: " : ""}
        {offer.platforms.map(platformLabel).join(", ")} · about {shortNumber(offer.target_views)} views ·{" "}
        {offer.city || "Anywhere in Ghana"}
      </Text>
      <Text style={styles.meta}>One post, within {offer.post_within_days} days of agreeing</Text>
      {!!offer.description && <Text style={styles.body}>{offer.description}</Text>}

      {s === "agreed" && (
        <Text style={styles.good}>Deal agreed at GHS {shortNumber(offer.agreed_price ?? price)}. Posting and payment steps come next.</Text>
      )}
      {s === "pending_business" && (
        <Text style={styles.wait}>Waiting for the business. You asked for GHS {shortNumber(price)}.</Text>
      )}
      {s === "declined" && <Text style={styles.wait}>You said no to this one.</Text>}
      {s === "closed" && <Text style={styles.wait}>This offer was taken by someone else.</Text>}
      {offer.offer_status !== "open" && s === "pending_nova" && <Text style={styles.wait}>This offer is no longer open.</Text>}
      {s === "pending_nova" && offer.offer_status === "open" && (
        <Text style={styles.note}>The business counter-offered GHS {shortNumber(price)}.</Text>
      )}

      {canAnswer && !countering && (
        <View style={styles.actions}>
          <Button title={`Accept GHS ${shortNumber(price)}`} loading={busy} onPress={() => act("accept")} />
          {left > 0 ? (
            <Button title="Counter with my price" variant="secondary" disabled={busy} onPress={() => setCountering(true)} />
          ) : (
            <Text style={styles.meta}>No counters left. Accept or say no.</Text>
          )}
          <Text style={styles.link} onPress={() => !busy && act("decline")}>
            Not interested
          </Text>
          {left > 0 && left < MAX_COUNTERS && <Text style={styles.meta}>{left} counter{left === 1 ? "" : "s"} left</Text>}
        </View>
      )}
      {canAnswer && countering && (
        <CounterBox onSend={sendCounter} onCancel={() => setCountering(false)} initial={String(price)} />
      )}
      <FormMessage message={error} />
    </Card>
  );
}

export default function NovaRequests() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [offers, setOffers] = useState<FeedOffer[]>([]);

  const refresh = useCallback(async () => {
    const r = await loadFeed();
    if (!r.ok) setError(r.message);
    else {
      setError("");
      setOffers(r.offers);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <GraffitiBackground variant="home" strength={0.85}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor={colors.accent} onRefresh={() => { setRefreshing(true); refresh(); }} />
          }
        >
          <Text style={styles.title}>Requests</Text>
          <Text style={styles.hint}>
            Offers from businesses that match your accounts and city. Accept the price, or send your own.
          </Text>
          {loading ? (
            <View style={styles.gap} accessibilityLabel="Loading offers">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          ) : error ? (
            <View style={styles.gap}>
              <FormMessage message={error} />
              <Button title="Try again" variant="secondary" onPress={() => { setLoading(true); refresh(); }} />
            </View>
          ) : offers.length === 0 ? (
            <Card>
              <Text style={styles.body}>
                No offers for you yet. Make sure your city and social accounts are filled in on your Profile, then pull down to refresh.
              </Text>
            </Card>
          ) : (
            offers.map((o) => <OfferCard key={o.id} offer={o} onChanged={refresh} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </GraffitiBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...textOnArt, ...typography.title, color: colors.text, marginTop: spacing.md },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  gap: { gap: spacing.sm },
  offer: { gap: spacing.xs },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  offerTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: colors.accent },
  meta: { ...typography.caption, color: colors.textMuted },
  body: { ...typography.body, color: colors.textMuted },
  note: { ...typography.label, color: colors.text, marginTop: spacing.xs },
  wait: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  good: { ...typography.label, color: colors.accent, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  link: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline", textAlign: "center" },
});
