import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { NovaGroupCard } from "@/components/NovaGroupCard";
import { SkeletonCard } from "@/components/Skeleton";
import { StatusPill } from "@/components/StatusPill";
import { NovaGroup, loadNovaGroups } from "@/lib/groups";
import { FeedOffer, loadFeed } from "@/lib/negotiation";
import { durationLabel } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { colors, gold, spacing, textOnArt, typography } from "@/theme";

// The Campaigns tab: the deals you agreed and the group campaigns you joined.
export default function NovaCampaigns() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<FeedOffer[]>([]);
  const [groups, setGroups] = useState<NovaGroup[]>([]);

  const refresh = useCallback(async () => {
    const [f, g] = await Promise.all([loadFeed(), loadNovaGroups()]);
    if (f.ok) setDeals(f.offers.filter((o) => o.neg_status === "agreed"));
    if (g.ok) setGroups(g.groups.filter((x) => x.joined));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(refresh, 30000);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  return (
    <GraffitiBackground variant="campaigns" strength={1}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Campaigns</Text>
          <Text style={styles.hint}>Deals you agreed and group campaigns you joined.</Text>
          {loading ? (
            <View style={styles.gap} accessibilityLabel="Loading your campaigns">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
          ) : deals.length === 0 && groups.length === 0 ? (
            <Card>
              <Text style={styles.body}>
                Nothing here yet. When you agree a price on an offer or join a group campaign, it shows up here.
              </Text>
            </Card>
          ) : (
            <>
              {deals.map((o) => (
                <Card key={o.id} style={styles.card}>
                  <View style={styles.top}>
                    <Text style={[styles.cardTitle, styles.flex]}>{o.title}</Text>
                    <Text style={styles.price}>GHS {shortNumber(o.agreed_price ?? o.budget_ghs)}</Text>
                  </View>
                  <Text style={styles.meta}>
                    {o.business_name} · one post within {o.post_within_days} days, stays up {durationLabel(o.duration_days)}
                  </Text>
                  <StatusPill kind="agreed" label="Deal agreed" />
                </Card>
              ))}
              {groups.length > 0 && <Text style={styles.heading}>Group campaigns</Text>}
              {groups.map((g) => (
                <NovaGroupCard key={g.id} g={g} onChanged={refresh} />
              ))}
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
  heading: { ...textOnArt, ...typography.heading, color: colors.text, marginTop: spacing.sm },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  body: { ...typography.body, color: colors.textMuted },
  gap: { gap: spacing.sm },
  card: { gap: spacing.xs },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: gold },
  meta: { ...typography.caption, color: colors.textMuted },
});
