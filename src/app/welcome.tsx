import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { colors, logo, logoRatio, spacing, typography } from "@/theme";

export default function Welcome() {
  const router = useRouter();

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
        <Button title="Create account" onPress={() => router.push("/signup")} />
        <Button
          title="Log in"
          variant="secondary"
          onPress={() => router.push("/login")}
        />
      </View>

      {/* TEMPORARY shortcuts for testing. We remove this box on Day 5,
          when real login decides where each person goes. */}
      <View style={styles.dev}>
        <Text style={styles.devTitle}>Developer shortcuts (temporary)</Text>
        <View style={styles.devRow}>
          <Pressable onPress={() => router.push("/business/find")} hitSlop={10}>
            <Text style={styles.devLink}>Business area</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/nova/requests")} hitSlop={10}>
            <Text style={styles.devLink}>Nova area</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/preview")} hitSlop={10}>
            <Text style={styles.devLink}>Design preview</Text>
          </Pressable>
        </View>
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
    alignItems: "stretch",
  },
  dev: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  devTitle: {
    ...typography.caption,
    color: colors.gray400,
  },
  devRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  devLink: {
    ...typography.label,
    color: colors.gray600,
    textDecorationLine: "underline",
  },
});
