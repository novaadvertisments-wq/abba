import { useEffect, useState } from "react";
import { Linking, Share, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { DealBrief, Target, fileLink, loadBrief, saveFileToPhone } from "@/lib/dealFiles";
import { colors, spacing, typography } from "@/theme";

// The Nova's view of what the business wants posted, shown on an agreed deal or a joined campaign.
export function WhatToPost({ target }: { target: Target }) {
  const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
  const [brief, setBrief] = useState<DealBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadBrief(target).then((r) => {
      if (!r.ok) return setState("error");
      setBrief(r.brief);
      setState(r.brief ? "ready" : "none");
    });
  }, [target.offerId, target.groupId]);

  if (state === "loading") return null;
  if (state === "error") return <Text style={styles.hint}>We could not load what to post. Pull down to refresh.</Text>;
  if (state === "none" || !brief) return <Text style={styles.hint}>What to post: the business has not added files yet.</Text>;

  const fileGone = !brief.file_path && !!brief.file_name;
  const alreadySaved = saved || !!brief.i_saved;

  const saveToPhone = async () => {
    setSaving(true);
    setError("");
    const r = await saveFileToPhone(target, brief);
    setSaving(false);
    if (r.ok) setSaved(true);
    else setError(r.message);
  };

  const open = async () => {
    setBusy(true);
    setError("");
    const url = await fileLink(brief.file_path);
    setBusy(false);
    if (!url) return setError("We could not open the file. Try again.");
    Linking.openURL(url).catch(() => setError("We could not open the file. Try again."));
  };

  const copyText = [brief.caption, brief.tags].filter(Boolean).join("\n\n");

  return (
    <View style={styles.box}>
      <Text style={styles.title}>What to post</Text>
      {!!brief.file_path && (
        <Button
          title={alreadySaved ? "Saved. Save again" : brief.file_kind === "video" ? "Save the video to my phone" : "Save the flyer to my phone"}
          loading={saving}
          onPress={saveToPhone}
        />
      )}
      {saved && <Text style={styles.hint}>Saved to your phone. Post it from there.</Text>}
      {!!brief.file_path && (
        <Text style={styles.hint}>
          Save it to your phone, then post it from your gallery. To keep our storage small, the file is removed from ABBA a few days after you save it.
        </Text>
      )}
      {!!brief.file_path && <Text style={styles.link} onPress={open}>{busy ? "Opening..." : "Having trouble? Open in browser"}</Text>}
      {fileGone && <Text style={styles.hint}>The file was removed from ABBA to save space. Use the copy you saved on your phone.</Text>}
      {!!brief.caption && <Text style={styles.body}>{brief.caption}</Text>}
      {!!brief.tags && <Text style={styles.body}>{brief.tags}</Text>}
      {!!brief.link && <Text style={styles.link} onPress={() => Linking.openURL(brief.link)}>{brief.link}</Text>}
      {!!copyText && <Button title="Copy or share the caption" variant="secondary" onPress={() => Share.share({ message: copyText })} />}
      {!!error && <Text style={styles.hint}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, marginTop: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  body: { ...typography.body, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline" },
});
