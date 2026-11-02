import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function SignUp() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Create account"
      description="Choose Business or Nova, then enter your details. The form is designed on Day 4."
      day="Day 4"
    >
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
    </PlaceholderScreen>
  );
}
