import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { checkBudget, parseBudget } from "@/lib/validation";
import { spacing } from "@/theme";

type Props = {
  // Returns an error message, or "" when it worked.
  onSend: (price: number) => Promise<string>;
  onCancel: () => void;
  initial?: string;
};

// A small box for typing your own price and sending it back.
export function CounterBox({ onSend, onCancel, initial = "" }: Props) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const problem = checkBudget(value);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    const message = await onSend(parseBudget(value) as number);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <View style={styles.box}>
      <TextField
        label="Your price (GHS)"
        value={value}
        onChangeText={(t) => { setValue(t); setError(""); }}
        error={error}
        keyboardType="number-pad"
        placeholder="e.g. 220"
      />
      <Button title="Send price" loading={busy} onPress={send} />
      <Button title="Cancel" variant="secondary" disabled={busy} onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({ box: { gap: spacing.sm } });
