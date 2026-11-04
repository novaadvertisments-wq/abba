import { Redirect, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { homeFor, useAuth } from "@/lib/auth";
import { colors, logo, logoRatio, spacing, typography } from "@/theme";

export default function Welcome() {
  const router = useRouter();
  const { status, profile } = useAuth();

  // Already logged in? Go straight to the right part of the app.
  if (status === "signedIn") {
    return <Redirect href={homeFor(profile)} />;
  }

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
          Post your price, get offers from verified Novas, and pay safely.
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
    paddingBottom: spacing.lg,
  },
});
