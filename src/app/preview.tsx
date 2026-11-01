// A temporary screen that shows every reusable piece of the design in one
// place, so you can check how it looks on your phone. We delete it later.

import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { colors, spacing, typography } from "@/theme";

export default function Preview() {
  const router = useRouter();
  const [name, setName] = useState("");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Design preview</Text>

        <Text style={styles.section}>Buttons</Text>
        <Button title="Primary button" />
        <Button title="Secondary button" variant="secondary" />
        <Button title="Loading" loading />
        <Button title="Disabled" disabled />

        <Text style={styles.section}>Text fields</Text>
        <TextField
          label="Business name"
          placeholder="e.g. Legon Bites"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Phone number"
          placeholder="024 000 0000"
          keyboardType="phone-pad"
          error="Enter a valid phone number"
        />

        <Text style={styles.section}>Card</Text>
        <Card>
          <Text style={styles.cardTitle}>Ama K.</Text>
          <Text style={styles.cardText}>Instagram · Legon · 1,000 verified views</Text>
          <View style={styles.cardPrice}>
            <Text style={styles.cardPriceText}>GHS 200</Text>
          </View>
        </Card>

        <Button
          title="Back"
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.black,
  },
  section: {
    ...typography.heading,
    color: colors.black,
    marginTop: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.black,
  },
  cardText: {
    ...typography.body,
    color: colors.gray600,
    marginTop: 4,
  },
  cardPrice: {
    alignSelf: "flex-start",
    backgroundColor: colors.black,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  cardPriceText: {
    ...typography.label,
    color: colors.white,
  },
});
