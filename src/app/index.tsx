// The opening animation (the "splash"). The order of events:
//   1. White screen, the black ABBA mark fades in.
//   2. A black panel grows down from the top and fills the screen; the mark turns white.
//   3. The mark moves up a little and the ABBA name appears under it.
//   4. A short pause, then we fade into the Welcome screen.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";

import { homeFor, useAuth } from "@/lib/auth";
import { colors, logo, logoRatio } from "@/theme";

const MARK_WIDTH = 150;
const MARK_HEIGHT = MARK_WIDTH / logoRatio.mark;
const WORD_WIDTH = 210;
const WORD_HEIGHT = WORD_WIDTH / logoRatio.wordmark;
const GAP = 26;

export default function Splash() {
  const router = useRouter();
  const { status, profile } = useAuth();
  const [animationDone, setAnimationDone] = useState(false);

  // These numbers are what the animation changes over time (0 to 1).
  const [markIn] = useState(() => new Animated.Value(0));
  const [panel] = useState(() => new Animated.Value(0));
  const [nameIn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.sequence([
      // 1. Mark fades in
      Animated.timing(markIn, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      // 2. Black panel grows down
      Animated.timing(panel, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      // 3. Name appears, mark moves up
      Animated.timing(nameIn, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 4. Pause
      Animated.delay(900),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setAnimationDone(true);
      }
    });

    return () => animation.stop();
  }, [markIn, panel, nameIn]);

  // When the animation is over AND we know whether someone is already
  // logged in, move on: straight into the app, or to the Welcome screen.
  useEffect(() => {
    if (animationDone && status !== "loading") {
      router.replace(status === "signedIn" ? homeFor(profile) : "/welcome");
    }
  }, [animationDone, status, profile, router]);

  // The mark starts in the middle of the screen, then moves up by this much
  // to make room for the name.
  const startOffset = (GAP + WORD_HEIGHT) / 2;

  return (
    <View style={styles.screen}>
      {/* Black panel that grows down from the top until it fills the screen */}
      <Animated.View
        style={[
          styles.panel,
          {
            transformOrigin: "top",
            transform: [{ scaleY: panel }],
          },
        ]}
      />

      <View style={styles.center}>
        {/* The mark: a black version and a white version stacked, we swap them */}
        <Animated.View
          style={{
            width: MARK_WIDTH,
            height: MARK_HEIGHT,
            opacity: markIn,
            transform: [
              {
                translateY: nameIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [startOffset, 0],
                }),
              },
              {
                scale: markIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          }}
        >
          <Animated.Image
            source={logo.markBlack}
            resizeMode="contain"
            style={[
              styles.fill,
              {
                opacity: panel.interpolate({
                  inputRange: [0.35, 0.7],
                  outputRange: [1, 0],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
          <Animated.Image
            source={logo.markWhite}
            resizeMode="contain"
            style={[
              styles.fill,
              {
                opacity: panel.interpolate({
                  inputRange: [0.35, 0.7],
                  outputRange: [0, 1],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
        </Animated.View>

        {/* The ABBA name */}
        <Animated.View
          style={{
            marginTop: GAP,
            opacity: nameIn,
            transform: [
              {
                translateY: nameIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <Image
            source={logo.wordmarkWhite}
            resizeMode="contain"
            style={{ width: WORD_WIDTH, height: WORD_HEIGHT }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  panel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
});
