import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { NovaGroupCard } from "@/components/NovaGroupCard";
import { NovaGroup, loadNovaGroups } from "@/lib/groups";
import { StatusPill } from "@/components/StatusPill";
import { WhatToPost } from "@/components/WhatToPost";
import { CounterBox } from "@/components/CounterBox";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { SkeletonCard } from "@/components/Skeleton";
import { FeedOffer, expiryText, loadFeed, postByText, respond } from "@/lib/negotiation";
import { platformLabel } from "@/lib/novaProfile";
import { pingBadges } from "@/lib/attention";
import { durationLabel } from "@/lib/pricing";
import { pictureUrl } from "@/lib/pictures";
import { CATEGORIES } from "@/lib/businessProfile";
import { MAX_COUNTERS } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { categoryColors, colors, gold, spacing, statusColors, textOnArt, typography } from "@/theme";

function OfferCard({ offer, onChanged }: { offer: FeedOffer; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [countering, setCountering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const s = offer.neg_status;
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

  const sendCounter = async (p: number, note: string) => {
    const r = await respond(offer.id, null, "counter", p, note);
    if (!r.ok) return r.message;
    setCountering(false);
    onChanged();
    return "";
  };

  const [tagText, tagColor] =
    offer.offer_status === "expired" && s !== "agreed" ? ["EXPIRED", colors.textMuted]
    : s === "agreed" ? ["DEAL AGREED", statusColors.agreed]
    : s === "pending_nova" && offer.offer_status === "open" ? ["NEEDS YOUR ANSWER", statusColors.waiting]
    : s === "pending_business" ? ["WAITING FOR THE BUSINESS", statusColors.waiting]
    : s === "declined" || s === "closed" ? ["CLOSED", colors.textMuted]
    : ["NEW", statusColors.open];

  const canAnswer = offer.offer_status === "open" && (s === null || s === "pending_nova");

  return (
    <Card style={styles.offer}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${offer.title}, ${offer.business_name}, GHS ${shortNumber(price)}. ${open ? "Hide" : "Show"} details`}
        style={styles.head}
      >
        <Text style={[styles.tag, { color: tagColor }]}>{tagText}</Text>
        <Text style={styles.bigTitle}>{offer.title}</Text>
        {!!offer.business_name && (
          <View style={styles.biz}>
            <Avatar
              uri={pictureUrl(offer.business_avatar)}
              name={offer.business_name}
              size={30}
              ring={categoryColors[offer.business_category] ?? undefined}
            />
            <Text style={styles.bigBiz}>{offer.business_name}</Text>
          </View>
        )}
        <Text style={styles.bigPrice}>GHS {shortNumber(price)}</Text>
        <Text style={styles.tap}>{open ? "Hide details" : "Tap to see the details"}</Text>
      </Pressable>
      {open && (
        <View style={styles.details}>
          {!!CATEGORIES.find((c) => c.id === offer.business_category) && (
            <Text style={styles.meta}>{CATEGORIES.find((c) => c.id === offer.business_category)?.label}</Text>
          )}
      <Text style={styles.meta}>
        {offer.kind === "multi" ? "Several platforms: " : ""}
        {offer.platforms.map(platformLabel).join(", ")} · about {shortNumber(offer.target_views)} views ·{" "}
        {offer.city || "Anywhere in Ghana"}
      </Text>
      <Text style={styles.meta}>One post, within {offer.post_within_days} days of agreeing</Text>
      <Text style={styles.meta}>Stays up: {durationLabel(offer.duration_days)}</Text>
      {offer.offer_status === "open" && !!expiryText(offer.expires_at) && <Text style={styles.meta}>{expiryText(offer.expires_at)}</Text>}
      {!!offer.description && <Text style={styles.body}>{offer.description}</Text>}

      {s === "agreed" && <StatusPill kind="agreed" label="Deal agreed" />}
      {s === "pending_business" && <StatusPill kind="waiting" label="Waiting for the business" />}
      {s === "pending_nova" && offer.offer_status === "open" && <StatusPill kind="waiting" label="Needs your answer" />}
      {s === null && offer.offer_status === "open" && <StatusPill kind="open" label="Open" />}
      {(s === "declined" || s === "closed") && <StatusPill kind="closed" label={s === "declined" ? "You said no" : "Taken"} />}
      {s === "agreed" && (
        <Text style={styles.good}>Deal agreed at GHS {shortNumber(offer.agreed_price ?? price)}. {postByText(offer.agreed_at, offer.post_within_days)}{postByText(offer.agreed_at, offer.post_within_days) ? ". " : ""}Posting and payment steps come next.</Text>
      )}
      {!!offer.last_note && s !== "agreed" && <Text style={styles.noteText}>“{offer.last_note}”</Text>}
      {s === "pending_business" && (
        <Text style={styles.wait}>Waiting for the business. You asked for GHS {shortNumber(price)}.</Text>
      )}
      {s === "declined" && <Text style={styles.wait}>You said no to this one.</Text>}
      {s === "closed" && <Text style={styles.wait}>This offer was taken by someone else.</Text>}
      {offer.offer_status === "expired" && s !== "agreed" && <StatusPill kind="closed" label="Expired" />}
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
        {s === "agreed" && <WhatToPost target={{ offerId: offer.id }} />}
        </View>
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
  const [groups, setGroups] = useState<NovaGroup[]>([]);

  const refresh = useCallback(async () => {
    const [r, gr] = await Promise.all([loadFeed(), loadNovaGroups()]);
    if (gr.ok) setGroups(gr.groups);
    if (!r.ok) setError(r.message);
    else {
      setError("");
      setOffers(r.offers);
    }
    setLoading(false);
    setRefreshing(false);
    pingBadges();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      // Look again every 30 seconds while this screen is showing.
      const timer = setInterval(refresh, 30000);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  return (
    <GraffitiBackground variant="home" strength={1}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor={colors.accent} onRefresh={() => { setRefreshing(true); refresh(); }} />
          }
        >
          <Text style={styles.title}>Offers</Text>
          <Text style={styles.hint}>
            Offers and group campaigns from businesses that match your accounts and city. Accept a price, send your own, or join a group campaign.
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
          ) : offers.length === 0 && groups.length === 0 ? (
            <Card>
              <Text style={styles.body}>
                No offers for you yet. Make sure your city and social accounts are filled in on your Profile, then pull down to refresh.
              </Text>
            </Card>
          ) : (
            <>
              {offers.map((o) => <OfferCard key={o.id} offer={o} onChanged={refresh} />)}
              {groups.length > 0 && <Text style={styles.heading}>Group campaigns</Text>}
              {groups.map((g) => <NovaGroupCard key={g.id} g={g} onChanged={refresh} />)}
            </>
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
  heading: { ...textOnArt, ...typography.heading, color: colors.text, marginTop: spacing.sm },
  gap: { gap: spacing.sm },
  offer: { gap: spacing.xs },
  head: { gap: spacing.xs },
  details: { gap: spacing.xs, marginTop: spacing.sm },
  tag: { ...typography.caption, fontWeight: "700", letterSpacing: 1 },
  bigTitle: { fontSize: 26, lineHeight: 31, fontWeight: "800", color: colors.text },
  bigBiz: { fontSize: 17, fontWeight: "700", color: colors.text, flex: 1 },
  bigPrice: { fontSize: 30, fontWeight: "800", color: gold, marginTop: spacing.xs },
  tap: { ...typography.caption, color: colors.textMuted },
  newTag: { ...typography.caption, color: statusColors.open, fontWeight: "700", letterSpacing: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  offerTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: gold },
  biz: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  meta: { ...typography.caption, color: colors.textMuted },
  body: { ...typography.body, color: colors.textMuted },
  note: { ...typography.label, color: colors.text, marginTop: spacing.xs },
  wait: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  noteText: { ...typography.caption, color: colors.text, fontStyle: "italic" },
  good: { ...typography.label, color: gold, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  link: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline", textAlign: "center" },
});
