import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { MyScore, lumensText, ratingText } from "@/lib/score";
import { colors, radius, spacing, tiers, typography } from "@/theme";

// The Nova's own score at the top of the Rank tab: tier, Lumens, how far to the next tier, place and rating.
export function LumensCard({ score }: { score: MyScore }) {
  const t = tiers[score.tier];
  const verified = score.place !== null;
  const next = score.next_tier ? tiers[score.next_tier] : null;
  const from = score.tier === "spark" ? 0 : { glow: 1, blaze: 3, radiant: 8, supernova: 20 }[score.tier];
  const span = score.next_at !== null ? score.next_at - from : 0;
  const fraction = score.next_at === null ? 1 : span > 0 ? Math.min(1, Math.max(0, (score.lumens - from) / span)) : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.badge, { borderColor: t.color }]}>
          <Text style={[styles.badgeText, { color: t.color }]}>{t.label}</Text>
        </View>
        <Text style={styles.big} accessibilityLabel={`${lumensText(score.lumens)} Lumens`}>
          {lumensText(score.lumens)}
          <Text style={styles.unit}> Lumens</Text>
        </Text>
      </View>
      {verified ? (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: t.color }]} />
          </View>
          <Text style={styles.meta}>
            {next && score.next_at !== null
              ? `${lumensText(Math.max(0, score.next_at - score.lumens))} more Lumens to reach ${next.label}`
              : "You are at the top tier."}
          </Text>
          <Text style={styles.meta}>
            Place #{score.place} of {score.total_novas} verified Novas · Rating: {ratingText(score.rating_avg, score.rating_count)}
          </Text>
        </>
      ) : (
        <Text style={styles.meta}>Not verified yet. Finish your check below to get your Lumens and your place.</Text>
      )}
      <Text style={styles.note}>1 Lumen is about 1,000 views. Tier thresholds will change once we have real data.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderWidth: 2, borderRadius: radius.pill ?? 999, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { ...typography.label },
  big: { ...typography.title, color: colors.text },
  unit: { ...typography.label, color: colors.textMuted },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.skeleton, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  meta: { ...typography.caption, color: colors.textMuted },
  note: { ...typography.caption, color: colors.textMuted, opacity: 0.7 },
});
