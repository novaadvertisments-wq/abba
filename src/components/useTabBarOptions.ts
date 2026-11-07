import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme";

// How the bottom tab bar looks. Both the Business and Nova areas use this,
// so they always match. It also leaves room for the phone's own bottom bar
// (the line or buttons at the very bottom of some Android phones).
export function useTabBarOptions() {
  const insets = useSafeAreaInsets();

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.icon,
    tabBarInactiveTintColor: colors.iconMuted,
    tabBarLabelStyle: { fontSize: 12, fontWeight: "600" as const },
    tabBarStyle: {
      backgroundColor: "#0A0B0B",
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 68 + insets.bottom,
      paddingTop: 6,
      paddingBottom: 6 + insets.bottom,
    },
  };
}
