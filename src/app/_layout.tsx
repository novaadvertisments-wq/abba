import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/lib/auth";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    // AuthProvider lets every screen know who is logged in
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </AuthProvider>
  );
}
