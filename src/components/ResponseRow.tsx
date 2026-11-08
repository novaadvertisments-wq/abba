import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { CounterBox } from "@/components/CounterBox";
import { FormMessage } from "@/components/FormMessage";
import { Response, respond } from "@/lib/negotiation";
import { MAX_COUNTERS } from "@/lib/pricing";
import { shortNumber } from "@/lib/validation";
import { colors, radius, spacing, typography } from "@/theme";

// One Nova's answer to one of your offers, with the buttons to reply.
export function ResponseRow({ r, onChanged }: { r: Response; onChanged: () => void }) {
  const [countering, setCountering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (r.status === "declined" || r.status === "closed") return null;

  const act = async (action: "accept" | "decline") => {
    setBusy(true);
    setError("");
    const result = await respond(r.offer_id, r.nova_id, action);
    setBusy(false);
    if (!result.ok) setError(result.message);
    else onChanged();
  };

  const sendCounter = async (price: number) => {
    const result = await respond(r.offer_id, r.nova_id, "counter", price);
    if (!result.ok) return result.message;
    setCountering(false);
    onChanged();
    return "";
  };

  const left = MAX_COUNTERS - r.counters;
  const who = r.nova_name || "A Nova";

  return (
    <View style={styles.row}>
      <Text style={styles.name}>
        {who}
        {r.nova_city ? ` · ${r.nova_city}` : ""}
      </Text>
      {!!r.accounts && <Text style={styles.meta}>{r.accounts}</Text>}
      <Text style={styles.meta}>
        {r.nova_views
          ? `Typical views: ${shortNumber(r.nova_views)} per post${r.views_verified ? "" : " (not verified yet)"}`
          : "Typical views: not given yet"}
      </Text>
      {!!r.nova_views && r.nova_views < r.offer_target_views * 0.5 && r.status !== "agreed" && (
        <Text style={styles.warn}>
          You asked for about {shortNumber(r.offer_target_views)} views. This Nova usually gets fewer.
        </Text>
      )}

      {r.status === "pending_business" && (
        <>
          <Text style={styles.ask}>
            {r.counters > 0 && r.last_by === "nova" ? `${who} asks for GHS ${shortNumber(r.last_price)}` : `${who} wants GHS ${shortNumber(r.last_price)}`}
          </Text>
          {!countering && (
            <View style={styles.actions}>
              <Button title={`Accept GHS ${shortNumber(r.last_price)}`} loading={busy} onPress={() => act("accept")} />
              {left > 0 ? (
                <Button title="Counter with my price" variant="secondary" disabled={busy} onPress={() => setCountering(true)} />
              ) : (
                <Text style={styles.meta}>No counters left. Accept or decline.</Text>
              )}
              <Text style={styles.link} onPress={() => !busy && act("decline")}>
                Decline
              </Text>
            </View>
          )}
          {countering && <CounterBox onSend={sendCounter} onCancel={() => setCountering(false)} initial={String(r.last_price)} />}
        </>
      )}
      {r.status === "pending_nova" && (
        <Text style={styles.wait}>You offered GHS {shortNumber(r.last_price)}. Waiting for {who}.</Text>
      )}
      {r.status === "agreed" && (
        <Text style={styles.good}>Deal agreed with {who} at GHS {shortNumber(r.agreed_price ?? r.last_price)}.</Text>
      )}
      <FormMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.06)", marginTop: spacing.sm },
  name: { ...typography.label, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  warn: { ...typography.caption, color: "#FFB347" },
  ask: { ...typography.label, color: colors.accent, marginTop: spacing.xs },
  wait: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  good: { ...typography.label, color: colors.accent, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  link: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline", textAlign: "center" },
});
