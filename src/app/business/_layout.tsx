import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTabBarOptions } from "@/components/useTabBarOptions";

// The Business area: four tabs along the bottom.
// Each tab "name" matches a file in this folder (find.tsx, requests.tsx ...).
export default function BusinessLayout() {
  const options = useTabBarOptions();

  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="find"
        options={{
          title: "Find Novas",
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
