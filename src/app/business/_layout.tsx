import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { ScreenSkeleton } from "@/components/Skeleton";
import { useTabBarOptions } from "@/components/useTabBarOptions";
import { useAttentionCount } from "@/lib/attention";
import { homeFor, useAuth } from "@/lib/auth";
import { colors } from "@/theme";

// The Business area: four tabs along the bottom.
// Each tab "name" matches a file in this folder (find.tsx, requests.tsx ...).
export default function BusinessLayout() {
  const options = useTabBarOptions();
  const { status, profile } = useAuth();
  const count = useAttentionCount("business", status === "signedIn" && profile?.role === "business");

  // Only the right kind of logged-in person may enter this area.
  if (status === "loading") return <ScreenSkeleton />;
  if (status === "signedOut") return <Redirect href="/welcome" />;
  if (profile?.role !== "business") return <Redirect href={homeFor(profile)} />;

  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="find"
        options={{
          title: "Find Novas",
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.onAccent },
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Campaigns",
          tabBarIcon: ({ color }) => (
            <Ionicons name="megaphone-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
