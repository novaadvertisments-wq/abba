import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GraffitiBackground } from "@/components/GraffitiBackground";
import { ArtName, colors, radius, spacing, textOnArt, typography } from "@/theme";

type Props = {
  title: string;
  description: string;
  // Which day of the build plan fills this screen in.
  day: string;
  // Which graffiti wall sits behind this screen.
  art?: ArtName;
  children?: ReactNode;
};

// An empty page with a title. Every screen we have not built yet uses this,
// so you can already tap through the whole app.
export function PlaceholderScreen({ title, description, day, art = "home", children }: Props) {
  return (
    <GraffitiBackground variant={art} strength={1}>
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Built on {day}</Text>
        </View>
        {children}
      </View>
    </SafeAreaView>
    </GraffitiBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...textOnArt,
    ...typography.title,
    color: colors.text,
    marginTop: spacing.md,
  },
  description: {
    ...textOnArt,
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
