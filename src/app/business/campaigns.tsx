import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DealFilesEditor } from "@/components/DealFilesEditor";
import { FormMessage } from "@/components/FormMessage";
import { GraffitiBackground } from "@/components/GraffitiBackground";
import { SkeletonCard } from "@/components/Skeleton";
import { StatusPill } from "@/components/StatusPill";
import {
  BusinessGroup,
  GroupMember,
  closeGroup,
  loadBusinessGroups,
  loadGroupMembers,
  setPendingDraft,
  timeLeft,
} from "@/lib/groups";
import { platformLabel } from "@/lib/novaProfile";
import { pictureUrl } from "@/lib/pictures";
import { COMMISSION_PERCENT, durationLabel, novaRate } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { colors, gold, radius, spacing, textOnArt, tiers, typography } from "@/theme";

// The Campaigns tab: your group campaigns, who joined, and what each Nova will earn.
export default function BusinessCampaigns() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<BusinessGroup[]>([]);

  const refresh = useCallback(async () => {
    const r = await loadBusinessGroups();
    if (!r.ok) setError(r.message);
    else {
      setError("");
      setGroups(r.groups);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
          <Text style={styles.hint}>
            Your group campaigns: one budget shared by many Novas. Post one from the Post tab.
          </Text>
          {loading ? (
            <View style={styles.gap} accessibilityLabel="Loading your campaigns">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          ) : error ? (
            <View style={styles.gap}>
              <FormMessage message={error} />
              <Button title="Try again" variant="secondary" onPress={() => { setLoading(true); refresh(); }} />
            </View>
          ) : groups.length === 0 ? (
            <Card>
              <Text style={styles.body}>No group campaigns yet. Post your first one from the Post tab.</Text>
            </Card>
          ) : (
            groups.map((g) => <GroupCard key={g.id} g={g} onChanged={refresh} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </GraffitiBackground>
  );
}

function GroupCard({ g, onChanged }: { g: BusinessGroup; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const runAgain = () => {
    setPendingDraft({
      title: g.title, description: g.description, target_lumens: g.target_lumens, max_novas: g.max_novas,
      platform: g.platform, city: g.city, min_views: g.min_views, duration_days: g.duration_days, if_fewer: g.if_fewer,
    });
    router.push("/business/find");
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const r = await loadGroupMembers(g.id);
      if (r.ok) setMembers(r.members);
      else setError(r.message);
    }
  };

  // Reload the list of Novas when the numbers change.
  useEffect(() => {
    if (open) loadGroupMembers(g.id).then((r) => r.ok && setMembers(r.members));
  }, [g.joined_count, g.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = async () => {
    setBusy(true);
    setError("");
    const r = await closeGroup(g.id);
    setBusy(false);
    setConfirming(false);
    if (!r.ok) setError(r.message);
    else onChanged();
  };

  const pillKind = g.status === "open" ? "open" : g.status === "closed" ? "agreed" : "closed";
  const pillLabel =
    g.status === "open" ? "Open for Novas" : g.status === "closed" ? "Joining closed" : "Cancelled";

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={[styles.cardTitle, styles.flex]}>{g.title}</Text>
        <Text style={styles.price}>GHS {g.cost_ghs.toLocaleString("en-GH")}</Text>
      </View>
      <Text style={styles.meta}>
        {platformLabel(g.platform)} · {g.city || "Anywhere in Ghana"} · stays up {durationLabel(g.duration_days)}
      </Text>
      <Text style={styles.meta}>
        {g.joined_count} of {g.max_novas} Novas joined · {shortNumber(g.total_views)} of {shortNumber(g.target_lumens * 1000)} views per post
      </Text>
      <Text style={styles.meta}>
        Fixed rate GHS {g.rate_ghs} per lumen (Novas get GHS {novaRate(g.rate_ghs)}, Aba keeps {COMMISSION_PERCENT}%). You pay only for the reach delivered, at most GHS {g.total_budget_ghs.toLocaleString("en-GH")}.
      </Text>
      <View style={styles.row}>
        <StatusPill kind={pillKind} label={pillLabel} />
        {g.status === "open" && <Text style={styles.meta}>{timeLeft(g.join_deadline)}</Text>}
      </View>
      {g.status === "closed" && (
        <View style={styles.gap}>
          <Text style={styles.label}>Results</Text>
          <Text style={styles.meta}>
            Reach credited: {shortNumber(g.total_views)} of {shortNumber(g.target_lumens * 1000)} views per post ({Math.round((g.total_views / (g.target_lumens * 1000)) * 100)}%) from {g.joined_count} Novas.
          </Text>
          <Text style={styles.meta}>
            Cost: GHS {g.cost_ghs.toLocaleString("en-GH")}
            {g.total_views > 0 ? ` · about GHS ${Math.round((g.cost_ghs / g.total_views) * 1000)} per 1,000 views` : ""}. Views are as declared by the Novas and are not verified yet.
          </Text>
          {g.total_views < g.target_lumens * 1000 && (
            <Text style={styles.meta}>Delivery guarantee: once payments go live, a shortfall in verified reach is refunded or credited to you.</Text>
          )}
        </View>
      )}
      {g.status === "closed" && (
        <Text style={styles.note}>Final amounts are set: you owe GHS {g.cost_ghs.toLocaleString("en-GH")}. Payment comes in a later step.</Text>
      )}
      {g.status === "cancelled" && (
        <Text style={styles.note}>
          {g.joined_count === 0 ? "Nobody joined in time." : "The reach was not fully met and you chose to cancel in that case, so nothing is owed."}
        </Text>
      )}

      {g.status !== "open" && <Button title="Run again" variant="secondary" onPress={runAgain} />}
      {g.joined_count > 0 && (
        <Text style={styles.link} onPress={toggle}>
          {open ? "Hide the Novas" : `Show the Novas (${g.joined_count})`}
        </Text>
      )}
      {open &&
        (members ?? []).map((m) => (
          <View key={m.nova_id} style={styles.member}>
            <Avatar uri={pictureUrl(m.nova_avatar)} name={m.nova_name} size={36} ring={tiers.spark.color} />
            <View style={styles.flex}>
              <Text style={styles.name}>
                {m.nova_name}
                {m.nova_city ? ` · ${m.nova_city}` : ""}
              </Text>
              <Text style={styles.meta}>{shortNumber(m.views)} views counted (not verified yet)</Text>
            </View>
            <View style={styles.shareBox}>
              <Text style={styles.share}>GHS {m.share_ghs.toLocaleString("en-GH")}</Text>
              <Text style={styles.meta}>{m.is_final ? "final" : "so far"}</Text>
            </View>
          </View>
        ))}

      {g.status === "open" &&
        (confirming ? (
          <View style={styles.gap}>
            <Text style={styles.note}>
              {g.joined_count < g.max_novas && g.if_fewer === "cancel"
                ? `Only ${g.joined_count} of ${g.max_novas} places are filled and you chose to cancel in that case, so closing now cancels the campaign.`
                : "Closing now stops new Novas joining and fixes each share."}
            </Text>
            <Button title="Yes, close joining" loading={busy} onPress={close} />
            <Button title="Keep it open" variant="secondary" disabled={busy} onPress={() => setConfirming(false)} />
          </View>
        ) : (
          <Text style={styles.link} onPress={() => setConfirming(true)}>
            Close joining now
          </Text>
        ))}
      {g.status !== "cancelled" && <DealFilesEditor target={{ groupId: g.id }} />}
      <FormMessage message={error} />
    </Card>
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
  label: { ...typography.label, color: colors.text },
  card: { gap: spacing.xs },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardTitle: { ...typography.label, color: colors.text },
  price: { ...typography.heading, color: gold },
  meta: { ...typography.caption, color: colors.textMuted },
  note: { ...typography.caption, color: colors.text, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline", marginTop: spacing.xs },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  name: { ...typography.label, color: colors.text },
  shareBox: { alignItems: "flex-end" },
  share: { ...typography.label, color: gold },
});
