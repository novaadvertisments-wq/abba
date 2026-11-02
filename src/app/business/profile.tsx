import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function BusinessProfile() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Profile"
      description="Your business details will be shown and edited here."
      day="Day 7"
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
