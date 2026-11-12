import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { FormMessage } from "@/components/FormMessage";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/lib/auth";
import { DealBrief, Target, chooseAndUploadFile, loadBrief, removeFile, saveBrief } from "@/lib/dealFiles";
import { CONTACT_MESSAGE, looksLikeContact } from "@/lib/validation";
import { colors, spacing, typography } from "@/theme";

const EMPTY: DealBrief = { caption: "", tags: "", link: "", file_path: "", file_kind: "", file_name: "" };

// The business adds what the Nova should post: a flyer or video, a caption, tags and a link.
export function DealFilesEditor({ target }: { target: Target }) {
  const { profile } = useAuth();
  const userId = profile?.id ?? "";
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<DealBrief>(EMPTY);
  const [saved, setSaved] = useState<DealBrief>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || loaded) return;
    loadBrief(target).then((r) => {
      if (r.ok && r.brief) {
        setBrief(r.brief);
        setSaved(r.brief);
      }
      setLoaded(true);
    });
  }, [open, loaded, target.offerId, target.groupId]);

  const set = (k: keyof DealBrief) => (v: string) => {
    setBrief((b) => ({ ...b, [k]: v }));
    setMessage("");
    setError("");
  };

  const pick = async () => {
    setBusy(true);
    setError("");
    const r = await chooseAndUploadFile(userId);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    if (!r.file) return;
    // The file that was added but never saved is removed again if it is replaced.
    if (brief.file_path && brief.file_path !== saved.file_path) await removeFile(brief.file_path);
    setBrief((b) => ({ ...b, file_path: r.file!.path, file_kind: r.file!.kind, file_name: r.file!.name }));
    setMessage("");
  };

  const save = async () => {
    const withoutMentions = (t: string) => t.replace(/(^|\s)@[a-z0-9_.]+/gi, " ");
    if (looksLikeContact(withoutMentions(`${brief.caption} ${brief.tags}`))) return setError(CONTACT_MESSAGE);
    if (brief.link && !/^https?:\/\//i.test(brief.link)) {
      return setError("A link must start with http:// or https://");
    }
    setBusy(true);
    setError("");
    const r = await saveBrief(target, brief);
    if (r.ok && saved.file_path && saved.file_path !== brief.file_path) await removeFile(saved.file_path);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setSaved(brief);
    setMessage("Saved. The Novas on this deal can see it now.");
  };

  if (!open) {
    return (
      <Text style={styles.link} onPress={() => setOpen(true)} accessibilityRole="button">
        What to post (flyer, video, caption)
      </Text>
    );
  }
  return (
    <View style={styles.box}>
      <Text style={styles.title}>What to post</Text>
      <Text style={styles.hint}>Optional. Give the Nova a flyer or a short video (up to 30 seconds), and what to write.</Text>
      {!!brief.file_path && (
        <Text style={styles.file}>
          {brief.file_kind === "video" ? "Video" : "Flyer"}: {brief.file_name}
        </Text>
      )}
      <Button title={brief.file_path ? "Choose a different file" : "Add a flyer or video"} variant="secondary" loading={busy} onPress={pick} />
      {!!brief.file_path && (
        <Text style={styles.link} onPress={() => setBrief((b) => ({ ...b, file_path: "", file_kind: "", file_name: "" }))}>
          Remove the file
        </Text>
      )}
      <TextField label="Caption to copy" value={brief.caption} onChangeText={set("caption")} multiline maxLength={500} placeholder="What the Nova should write" />
      <TextField label="Tags and mentions" value={brief.tags} onChangeText={set("tags")} maxLength={140} placeholder="e.g. #abba @yourbusiness" autoCapitalize="none" />
      <TextField label="Link (optional)" value={brief.link} onChangeText={set("link")} maxLength={300} placeholder="https://" autoCapitalize="none" keyboardType="url" />
      <FormMessage message={error} />
      {!!message && <FormMessage message={message} tone="info" />}
      <Button title="Save" loading={busy} onPress={save} />
      <Text style={styles.link} onPress={() => setOpen(false)}>
        Close
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, marginTop: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  file: { ...typography.label, color: colors.text },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline", paddingVertical: spacing.xs },
});
