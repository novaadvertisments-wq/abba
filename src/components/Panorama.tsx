import { useState } from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";

type Props = { source: ImageSourcePropType };

// Shows a wide (landscape) picture in full on a tall phone screen: the whole
// picture sits across the middle, and a soft blurred copy of it fills the
// space above and below, so nothing is cut off.
export function Panorama({ source }: Props) {
  const [width, setWidth] = useState(0);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Image source={source} resizeMode="cover" blurRadius={28} style={StyleSheet.absoluteFill} />
      <View style={styles.band}>
        <Image source={source} resizeMode="cover" style={{ width, height: width / 1.8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center" },
});
