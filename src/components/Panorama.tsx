import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";

type Props = { source: ImageSourcePropType };

// A full-screen picture: it fills the whole screen (the wide picture is
// trimmed at the sides to fit a tall phone).
export function Panorama({ source }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />
    </View>
  );
}
