import { Image, StyleSheet, Text, View } from "react-native";

import { colors, logo, logoRatio, radius, spacing, typography } from "@/theme";

type Props = { handle: string; platformName: string; code: string; issuedAt: string; expiresAt: string };

export function posterDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// The official ABBA poster. It is drawn here (so it costs nothing to store) and carries a code and date that
// are different for every Nova, so an old screenshot cannot be reused. The Nova takes a screenshot of this card.
export function PosterCard({ handle, platformName, code, issuedAt, expiresAt }: Props) {
  return (
    <View style={styles.poster} accessibilityLabel={`ABBA poster, code ${code}`}>
      <Image source={logo.wordmarkWhite} style={styles.logo} resizeMode="contain" />
      <Text style={styles.kicker}>VERIFIED REACH CHECK</Text>
      <Text style={styles.handle}>@{handle.replace(/^@/, "")}</Text>
      <Text style={styles.platform}>{platformName}</Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>MY ABBA CODE</Text>
        <Text style={styles.code} numberOfLines={1} adjustsFontSizeToFit>{code}</Text>
      </View>
      <Text style={styles.dates}>
        {posterDate(issuedAt)} to {posterDate(expiresAt)}
      </Text>
      <Text style={styles.foot}>I am getting my reach checked on ABBA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    backgroundColor: "#000000",
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: { width: 150, height: 150 / logoRatio.wordmark, marginBottom: spacing.sm },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 3 },
  handle: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center" },
  platform: { ...typography.body, color: colors.textMuted },
  codeBox: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 4,
    marginVertical: spacing.sm,
  },
  codeLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 2 },
  code: { fontSize: 30, fontWeight: "800", color: colors.accent, letterSpacing: 2, textAlign: "center" },
  dates: { ...typography.label, color: colors.text },
  foot: { ...typography.caption, color: colors.textMuted },
});
