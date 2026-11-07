import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

import { colors } from "@/theme";

type Props = {
  size?: number;
  // How many glowing dots (Novas found) to show. Their places are for show only.
  found?: number;
};

const SPOTS = [
  [0.22, 0.30], [0.74, 0.26], [0.30, 0.72], [0.70, 0.70], [0.50, 0.14], [0.86, 0.52],
];

// A pulsing radar: rings spread out from the centre, like searching for a ride.
export function Radar({ size = 260, found = 0 }: Props) {
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = rings.map((v, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 800),
          Animated.timing(v, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
      );
      loop.start();
      return loop;
    });
    return () => loops.forEach((l) => l.stop());
  }, [rings]);

  const spots = SPOTS.slice(0, Math.min(found, SPOTS.length));

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityLabel="Searching for Novas near you"
    >
      <View style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]} />
      {rings.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.12, 1] }) }],
            },
          ]}
        />
      ))}
      {spots.map(([x, y], i) => (
        <View key={i} style={[styles.blip, { left: x * size - 6, top: y * size - 6 }]} />
      ))}
      <View style={styles.centre} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
  base: { position: "absolute", backgroundColor: "rgba(28, 31, 33, 0.6)", borderWidth: 1, borderColor: colors.border },
  ring: { position: "absolute", borderWidth: 2, borderColor: colors.accent },
  centre: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, borderWidth: 3, borderColor: "#FFFFFF" },
  blip: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
});
