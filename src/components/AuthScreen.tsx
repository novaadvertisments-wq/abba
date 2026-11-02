import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, logo, logoRatio, spacing, typography } from "@/theme";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

// The frame shared by the login and sign-up screens: a back arrow, the logo,
// a title, and a scrolling area that moves up when the keyboard opens.
export function AuthScreen({ title, subtitle, children }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/welcome");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={goBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={24} color={colors.black} />
            </Pressable>
            <Image
              source={logo.markBlack}
              resizeMode="contain"
              style={{ width: 40, height: 40 / logoRatio.mark }}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FooterProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

// The line at the bottom, such as "Already have an account? Log in".
export function AuthFooter({ prompt, action, onPress }: FooterProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{prompt} </Text>
      <Pressable onPress={onPress} hitSlop={10}>
        <Text style={styles.footerLink}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.title,
    color: colors.black,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray600,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  form: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.body,
    fontSize: 15,
    color: colors.gray600,
  },
  footerLink: {
    ...typography.label,
    fontSize: 15,
    color: colors.black,
    textDecorationLine: "underline",
  },
});
