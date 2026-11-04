import { StyleSheet, Text } from "react-native";

import { Button } from "@/components/Button";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useAuth } from "@/lib/auth";
import { logOut } from "@/lib/authActions";
import { colors, typography } from "@/theme";

export default function BusinessProfile() {
  const { profile, email } = useAuth();

  return (
    <PlaceholderScreen
      title="Profile"
      description="Your business details will be shown and edited here."
      day="Day 7"
    >
      <Text style={styles.signedIn}>
        Signed in as {profile?.full_name} ({email})
      </Text>
      <Button title="Log out" variant="secondary" onPress={logOut} />
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  signedIn: {
    ...typography.body,
    color: colors.black,
  },
});
