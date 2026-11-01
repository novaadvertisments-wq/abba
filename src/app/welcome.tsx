import { useRouter } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors, logo, logoRatio, spacing, typography } from "@/theme";

export default function Welcome() {
  const router = useRouter();

  const comingSoon = () =>
    Alert.alert("Coming soon", "Sign-up and login screens are built on Day 4.");

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Image
          source={logo.markBlack}
          resizeMode="contain"
          style={{ width: 110, height: 110 / logoRatio.mark }}
        />
        <Image
          source={logo.wordmarkBlack}
          resizeMode="contain"
          style={{ width: 130, height: 130 / logoRatio.wordmark }}
        />
      </View>

      <View style={styles.middle}>
        <Text style={styles.title}>Advertise with people who are verified.</Text>
        <Text style={styles.subtitle}>
          Find social-media advertisers near you, agree a price and pay safely.
          Payment is released only after the campaign is verified.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Button title="I'm a Business" onPress={comingSoon} />
        <Button title="I'm a Nova" variant="secondary" onPress={comingSoon} />
        <Pressable onPress={() => router.push("/preview")} hitSlop={12}>
          <Text style={styles.link}>See design preview</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  top: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  middle: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.black,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray600,
    lineHeight: 24,
  },
  bottom: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: "stretch",
  },
  link: {
    ...typography.label,
    color: colors.gray600,
    textAlign: "center",
    textDecorationLine: "underline",
    paddingTop: spacing.sm,
  },
});
