import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  title: string;
  description: string;
  // Which day of the build plan fills this screen in.
  day: string;
  children?: ReactNode;
};

// An empty page with a title. Every screen we have not built yet uses this,
// so you can already tap through the whole app.
export function PlaceholderScreen({ title, description, day, children }: Props) {
  return (
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.black,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.gray600,
    lineHeight: 24,
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    ...typography.caption,
    color: colors.gray600,
    fontWeight: "600",
  },
});
