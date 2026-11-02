import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function NovaProfile() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Profile"
      description="Your platform, handle, location and verified reach will be shown here."
      day="Day 6"
    >
      {/* Temporary: lets you get back to the Welcome screen while testing */}
      <Button
        title="Leave preview"
        variant="secondary"
        onPress={() => router.dismissTo("/welcome")}
      />
    </PlaceholderScreen>
  );
}
