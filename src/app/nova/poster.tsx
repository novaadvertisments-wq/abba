import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { posterDate } from "@/lib/posterDates";
import { colors, posterTemplate, radius, spacing, typography } from "@/theme";

// The official ABBA poster, full screen. ABBA is the star. The Nova's handle, code and date are drawn very small
// at the bottom (small, but clear enough for the automatic reading to find). Nothing is stored.
// The buttons fade away after a few seconds so the screenshot is clean. Tap the screen to bring them back.
export default function PosterScreen() {
  const router = useRouter();
  const { handle = "", platform = "", code = "", issued = "" } = useLocalSearchParams<{
    handle?: string;
    platform?: string;
    code?: string;
    issued?: string;
  }>();
  const [showButtons, setShowButtons] = useState(true);

  useEffect(() => {
    if (!showButtons) return;
    const timer = setTimeout(() => setShowButtons(false), 5000);
    return () => clearTimeout(timer);
  }, [showButtons]);

  return (
    <Pressable style={styles.fill} onPress={() => setShowButtons(true)} accessibilityLabel={`ABBA poster, code ${code}`}>
      <StatusBar hidden />
      <View style={styles.fill}>
        <Image source={posterTemplate} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} accessibilityElementsHidden />
        <View style={styles.strip}>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.small}>
            @{handle.replace(/^@/, "")} · {platform}
            {issued ? ` · ${posterDate(issued)}` : ""}
          </Text>
          <Text style={styles.credit}>Photo: Kojooooooo / Pixabay</Text>
        </View>
        {showButtons && (
          <SafeAreaView style={styles.controls} edges={["top"]} pointerEvents="box-none">
            <Pressable style={styles.close} onPress={() => router.navigate("/nova/verification")} accessibilityRole="button">
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
            <Text style={styles.tip}>Take a screenshot now. These buttons hide in a few seconds so the screenshot is clean. Tap the screen to show them again.</Text>
          </SafeAreaView>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000000" },
  // A thin dark strip keeps the small writing clear against the busy picture.
  strip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  code: { fontSize: 15, fontWeight: "800", color: colors.accent, letterSpacing: 2 },
  small: { fontSize: 11, color: colors.text },
  credit: { fontSize: 10, color: "rgba(255,255,255,0.75)" },
  controls: { position: "absolute", top: 0, left: 0, right: 0, padding: spacing.md, gap: spacing.sm },
  close: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  closeText: { ...typography.label, color: colors.text },
  tip: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: radius.md,
    padding: spacing.md,
    textAlign: "center",
  },
});
