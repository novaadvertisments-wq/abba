import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, DimensionValue, Easing, StyleProp, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme";

// Skeleton loaders: grey placeholder shapes that pulse softly while real
// content is loading, so a screen never looks empty. Every skeleton on the
// screen shares ONE pulse, so they all breathe together.

const pulse = new Animated.Value(0);
let users = 0;
let loop: Animated.CompositeAnimation | null = null;

function startPulse() {
  users += 1;
  if (users === 1) {
    loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
  }
}

function stopPulse() {
  users -= 1;
  if (users === 0 && loop) {
    loop.stop();
    loop = null;
  }
}

type Props = {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
};

// One grey shape. Give it a width, a height and (optionally) how round it is.
export function Skeleton({ width = "100%", height = 16, rounded = radius.sm, style }: Props) {
  const [still, setStill] = useState(false);

  useEffect(() => {
    // People who turned on "reduce motion" get still shapes instead.
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    startPulse();
    return stopPulse;
  }, []);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: rounded,
          backgroundColor: colors.skeleton,
          opacity: still ? 0.7 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }),
        },
        style,
      ]}
    />
  );
}

// A grey card-shaped block, for a list item or a box of content.
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <Skeleton width="45%" height={16} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "70%" : "100%"} height={12} />
      ))}
    </View>
  );
}

// A whole screen of placeholders, used while we check who is logged in.
export function ScreenSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Skeleton width="55%" height={32} rounded={radius.sm} style={{ marginTop: spacing.md }} />
        <Skeleton width="35%" height={12} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </View>
    </SafeAreaView>
  );
}
