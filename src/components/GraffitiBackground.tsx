import { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";

import { ArtName, art, colors } from "@/theme";

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
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={art[variant]}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%", opacity: strength }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
