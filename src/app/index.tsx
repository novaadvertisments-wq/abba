// The opening animation (the "splash"). The order of events:
//   1. The first graffiti picture (Kwame Nkrumah Memorial) fades in from black, slowly
//      zooming, and the white ABBA mark fades in on top.
//   2. The picture melts into the second one (the lighthouse, which is also the
//      login background) while the mark moves up and the ABBA name appears.
//   3. A short pause, then we go on to the Welcome screen.

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
import { art, logo, logoRatio, splashFirst } from "@/theme";

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
  const [firstIn] = useState(() => new Animated.Value(0)); // first picture + mark
  const [zoom] = useState(() => new Animated.Value(0)); // slow zoom, runs the whole time
  const [melt] = useState(() => new Animated.Value(0)); // first picture -> second picture
  const [nameIn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const zooming = Animated.timing(zoom, {
      toValue: 1,
      duration: 4600,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const animation = Animated.sequence([
      Animated.timing(firstIn, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(melt, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(nameIn, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(900),
    ]);

    zooming.start();
    animation.start(({ finished }) => {
      if (finished) setAnimationDone(true);
    });

    return () => {
      zooming.stop();
      animation.stop();
    };
  }, [firstIn, zoom, melt, nameIn]);

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
  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <View style={styles.screen}>
      {/* Second picture sits underneath; the first one melts away on top of it */}
      <Animated.Image
        source={art.auth}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { width: "100%", height: "100%", transform: [{ scale }] }]}
      />
      <Animated.Image
        source={splashFirst}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          {
            width: "100%",
            height: "100%",
            opacity: Animated.multiply(firstIn, melt.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
            transform: [{ scale }],
          },
        ]}
      />
      {/* A dark veil keeps the white logo easy to see on the bright pictures */}
      <View pointerEvents="none" style={styles.veil} />

      <View style={styles.center}>
        <Animated.View
          style={{
            width: MARK_WIDTH,
            height: MARK_HEIGHT,
            opacity: firstIn,
            transform: [
              { translateY: nameIn.interpolate({ inputRange: [0, 1], outputRange: [startOffset, 0] }) },
              { scale: firstIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            ],
          }}
        >
          <Image source={logo.markWhite} resizeMode="contain" style={styles.fill} />
        </Animated.View>

        {/* The ABBA name */}
        <Animated.View
          style={{
            marginTop: GAP,
            opacity: nameIn,
            transform: [{ translateY: nameIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          }}
        >
          <Image source={logo.wordmarkWhite} resizeMode="contain" style={{ width: WORD_WIDTH, height: WORD_HEIGHT }} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.58)",
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
