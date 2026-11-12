import { ReactNode } from "react";

import { Panorama } from "@/components/Panorama";
import { Image, StyleSheet, View } from "react-native";

import { ArtName, art, artVeil, colors, tabTint } from "@/theme";

type Props = {
  children: ReactNode;
  // Which graffiti wall to show. Each tab has its own.
  variant?: ArtName;
  // How strong the graffiti is: 1 is full, 0.4 is quieter behind forms.
  strength?: number;
};

// The ABBA graffiti background. Put a whole screen inside it.
export function GraffitiBackground({ children, variant = "auth", strength = 1 }: Props) {
  return (
    <View style={styles.root}>
      {variant === "auth" ? (
        <Panorama source={art.auth} />
      ) : (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={art[variant]}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%", opacity: strength }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tabTint[variant] }]} />
      {/* The pictures are bright and colourful, so a dark veil keeps the words easy to read. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${artVeil[variant]})` }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
