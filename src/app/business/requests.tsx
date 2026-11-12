import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EditOfferBox } from "@/components/EditOfferBox";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { ResponseRow } from "@/components/ResponseRow";
import { SkeletonCard } from "@/components/Skeleton";
import { StatusPill } from "@/components/StatusPill";
import { pingBadges } from "@/lib/attention";
import { useAuth } from "@/lib/auth";
import { Response, expiryText, loadResponses } from "@/lib/negotiation";
import { platformLabel } from "@/lib/novaProfile";
import { Offer, closeOffer, loadOffers, setPendingOffer } from "@/lib/offers";
import { durationLabel } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { colors, gold, spacing, textOnArt, typography } from "@/theme";

// The Offers tab: every offer you posted, the Novas who answered, and the deals you agreed.
export default function BusinessOffers() {
  const router = useRouter();
  const [editing, setEditing] = useState("");
  const { profile } = useAuth();
  const userId = profile?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [o, rs] = await Promise.all([loadOffers(userId), loadResponses()]);
    if (!o.ok) {
      setLoadError(o.message);
      setLoading(false);
      return;
    }
    setLoadError("");
    setOffers(o.offers);
    if (rs.ok) setResponses(rs.responses);
    setLoading(false);
    pingBadges();
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Look again each time the tab is opened and every 30 seconds, to catch new answers.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(refresh, 30000);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  const onClose = async (id: string) => {
    const result = await closeOffer(id);
    if (!result.ok) {
      setLoadError(result.message);
      return;
    }
    refresh();
  };

  const agreed = offers.filter((o) => o.status === "agreed").length;

  return (
    <GraffitiBackground variant="verify" strength={1}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Offers</Text>
          <Text style={styles.hint}>
            Your offers, the Novas who answered, and the deals you agreed.
            {agreed > 0 ? ` ${agreed} ${agreed === 1 ? "deal" : "deals"} agreed so far.` : ""}
          </Text>
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
              <Text style={styles.body}>No offers yet. Post your first one from the Post tab.</Text>
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
                <Text style={styles.meta}>One-time post, within {o.post_within_days} days, stays up {durationLabel(o.duration_days)}</Text>
                {o.status === "open" && !!expiryText(o.expires_at) && <Text style={styles.meta}>{expiryText(o.expires_at)} if nobody agrees</Text>}
                <View style={styles.offerBottom}>
                  <StatusPill
                    kind={o.status === "open" ? (responses.some((r) => r.offer_id === o.id && r.status === "pending_business") ? "waiting" : "open") : o.status === "agreed" ? "agreed" : "closed"}
                    label={o.status === "open" ? (responses.some((r) => r.offer_id === o.id && r.status === "pending_business") ? "Open, a Nova answered" : "Open") : o.status === "agreed" ? "Deal agreed" : o.status === "expired" ? "Expired" : "Closed"}
                  />
                  {o.status === "open" && (
                    <Text style={styles.closeLink} onPress={() => onClose(o.id)}>
                      Close offer
                    </Text>
                  )}
                </View>
                {o.status === "open" && editing !== o.id && (
                  <Text style={styles.closeLink} onPress={() => setEditing(o.id)}>
                    Edit title and details
                  </Text>
                )}
                {editing === o.id && (
                  <EditOfferBox id={o.id} title={o.title} description={o.description} onDone={() => { setEditing(""); refresh(); }} />
                )}
                {o.status !== "open" && (
                  <Text style={styles.closeLink} onPress={() => { setPendingOffer(o); router.push("/business/find"); }}>
                    Post again
                  </Text>
                )}
                {responses
                  .filter((r) => r.offer_id === o.id && (o.status === "open" || r.status === "agreed"))
                  .map((r) => (
                    <ResponseRow key={r.negotiation_id} r={r} onChanged={refresh} />
                  ))}
              </Card>
            ))
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
  body: { ...typography.body, color: colors.textMuted },
  gap: { gap: spacing.sm },
  offer: { gap: spacing.xs },
  offerTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  offerTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: gold },
  meta: { ...typography.caption, color: colors.textMuted },
  offerBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  closeLink: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline" },
});
