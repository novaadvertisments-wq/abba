import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function Login() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Log in"
      description="Email and password login. The screen is designed on Day 4 and works on Day 5."
      day="Day 4"
    >
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
    </PlaceholderScreen>
  );
}
