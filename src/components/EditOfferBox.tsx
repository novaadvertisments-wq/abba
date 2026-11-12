import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { FormMessage } from "@/components/FormMessage";
import { TextField } from "@/components/TextField";
import { editOffer } from "@/lib/offers";
import { checkOfferDescription, checkOfferTitle } from "@/lib/validation";
import { colors, spacing, typography } from "@/theme";

// Change an open offer's title and details. The price stays, so nobody is surprised.
export function EditOfferBox({
  id,
  title: startTitle,
  description: startDescription,
  onDone,
}: {
  id: string;
  title: string;
  description: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(startTitle);
  const [description, setDescription] = useState(startDescription);
  const [errors, setErrors] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const next = { title: checkOfferTitle(title), description: checkOfferDescription(description) };
    setErrors(next);
    setError("");
    if (next.title || next.description) return;
    setBusy(true);
    const r = await editOffer(id, title.trim(), description.trim());
    setBusy(false);
    if (!r.ok) return setError(r.message);
    onDone();
  };

  return (
    <View style={styles.box}>
      <Text style={styles.hint}>You can change the title and details. The price, platforms and timing stay the same.</Text>
      <TextField label="Offer title" value={title} onChangeText={setTitle} error={errors.title} maxLength={60} />
      <TextField label="Details" value={description} onChangeText={setDescription} error={errors.description} multiline maxLength={280} />
      <FormMessage message={error} />
      <Button title="Save changes" loading={busy} onPress={save} />
      <Text style={styles.link} onPress={onDone}>Cancel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, marginTop: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline", paddingVertical: spacing.xs },
});
