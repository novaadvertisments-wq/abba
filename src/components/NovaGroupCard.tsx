import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormMessage } from "@/components/FormMessage";
import { StatusPill } from "@/components/StatusPill";
import { WhatToPost } from "@/components/WhatToPost";
import { CATEGORIES } from "@/lib/businessProfile";
import { NovaGroup, joinGroup, leaveGroup, timeLeft } from "@/lib/groups";
import { platformLabel } from "@/lib/novaProfile";
import { pictureUrl } from "@/lib/pictures";
import { COMMISSION_PERCENT, durationLabel, novaRate } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { categoryColors, colors, gold, spacing, statusColors, typography } from "@/theme";

type Props = { g: NovaGroup; onChanged: () => void };

// A group campaign as a Nova sees it: the pool, their estimated share, and Join or Leave.
export function NovaGroupCard({ g, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<{ ok: true } | { ok: false; message: string }>) => {
    setBusy(true);
    setError("");
    const r = await fn();
    setBusy(false);
    if (!r.ok) setError(r.message);
    else onChanged();
  };

  const [tagText, tagColor] =
    g.status === "cancelled" ? ["CANCELLED", colors.textMuted]
    : g.status === "closed" ? [g.joined ? "YOU JOINED, CLOSED" : "CLOSED", colors.textMuted]
    : g.joined ? ["YOU JOINED", statusColors.agreed]
    : ["GROUP CAMPAIGN", statusColors.open];

  const category = CATEGORIES.find((c) => c.id === g.business_category);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${g.title}, ${g.business_name}, GHS ${novaRate(g.rate_ghs)} per lumen. ${open ? "Hide" : "Show"} details`}
        style={styles.head}
      >
        <Text style={[styles.tag, { color: tagColor }]}>{tagText}</Text>
        <Text style={styles.bigTitle}>{g.title}</Text>
        {!!g.business_name && (
          <View style={styles.biz}>
            <Avatar uri={pictureUrl(g.business_avatar)} name={g.business_name} size={30} ring={categoryColors[g.business_category]} />
            <Text style={styles.bigBiz}>{g.business_name}</Text>
          </View>
        )}
        <Text style={styles.bigPrice}>GHS {novaRate(g.rate_ghs)} / lumen</Text>
        <Text style={styles.tap}>{open ? "Hide details" : "Tap to see the details"}</Text>
      </Pressable>
      {open && (
        <View style={styles.details}>
          {!!category && <Text style={styles.meta}>{category.label}</Text>}
          <Text style={styles.meta}>Group campaign: a fixed price for every lumen (1,000 views) of your reach</Text>
          {!!g.description && <Text style={styles.body}>{g.description}</Text>}
      <Text style={styles.meta}>
        {platformLabel(g.platform)} · {g.city || "Anywhere in Ghana"} · stays up {durationLabel(g.duration_days)}
      </Text>
      <Text style={styles.meta}>
        {g.joined_count} of {g.max_novas} places taken · {shortNumber(g.total_views)} of {shortNumber(g.target_lumens * 1000)} views filled{g.min_views > 0 ? ` · needs ${shortNumber(g.min_views)}+ views` : ""}
      </Text>

      {g.status === "open" && (
        <View style={styles.row}>
          <StatusPill kind={g.joined ? "agreed" : "open"} label={g.joined ? "You joined" : "Open to join"} />
          <Text style={styles.meta}>{timeLeft(g.join_deadline)}</Text>
        </View>
      )}
      {g.status === "closed" && <StatusPill kind="agreed" label="Joining closed" />}
      {g.status === "cancelled" && <StatusPill kind="closed" label="Cancelled" />}

      {g.status === "closed" && g.joined && g.final_share !== null && (
        <Text style={styles.share}>Your share: GHS {g.final_share.toLocaleString("en-GH")}</Text>
      )}
      {g.status === "cancelled" && g.joined && <Text style={styles.meta}>This campaign was cancelled, so nothing is owed.</Text>}

      {g.status === "open" && g.est_share !== null && (
        <>
          <Text style={styles.share}>
            {g.joined ? "You will earn about" : "You would earn about"}: GHS {g.est_share.toLocaleString("en-GH")}
          </Text>
          <Text style={styles.meta}>
            Based on your {shortNumber(g.my_views ?? 0)} views per post at GHS {g.rate_ghs} per lumen, after Aba keeps {COMMISSION_PERCENT}%. The price is fixed, so it does not change as others join. If the campaign is nearly full, only the reach still needed is counted.
          </Text>
        </>
      )}

      {g.status === "open" && !g.joined && g.kept_for_micro && (
        <Text style={styles.meta}>The last places are kept for smaller Novas for now. Check again closer to the deadline.</Text>
      )}
      {g.status === "open" && !g.joined && !g.kept_for_micro && (
        <Text style={styles.meta}>One Nova can bring at most {shortNumber(g.cap_views)} views to this campaign, so reach is shared fairly.</Text>
      )}

      {g.status === "open" &&
        (g.joined ? (
          <Text style={styles.link} onPress={() => !busy && run(() => leaveGroup(g.id))}>
            Leave this campaign
          </Text>
        ) : (
          <Button title="Join campaign" loading={busy} disabled={g.kept_for_micro} onPress={() => run(() => joinGroup(g.id))} />
        ))}
      {g.joined && g.status !== "cancelled" && <WhatToPost target={{ groupId: g.id }} />}
        </View>
      )}
      <FormMessage message={error} />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs },
  details: { gap: spacing.xs, marginTop: spacing.sm },
  tag: { ...typography.caption, fontWeight: "700", letterSpacing: 1 },
  bigTitle: { fontSize: 26, lineHeight: 31, fontWeight: "800", color: colors.text },
  bigBiz: { fontSize: 17, fontWeight: "700", color: colors.text, flex: 1 },
  bigPrice: { fontSize: 30, fontWeight: "800", color: gold, marginTop: spacing.xs },
  tap: { ...typography.caption, color: colors.textMuted },
  flex: { flex: 1 },
  card: { gap: spacing.xs },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { ...typography.label, color: colors.text },
  gold: { ...typography.heading, color: gold },
  meta: { ...typography.caption, color: colors.textMuted },
  body: { ...typography.body, color: colors.text },
  biz: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  share: { ...typography.label, color: gold, marginTop: spacing.xs },
  link: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline", marginTop: spacing.xs },
});
