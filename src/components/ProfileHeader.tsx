import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { FormMessage } from "@/components/FormMessage";
import { chooseAndUpload, loadMyPictures, removePicture } from "@/lib/pictures";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  userId: string;
  name: string;
  // The colour of the ring around the picture and of the banner when there is none.
  ring: string;
  // A line under the name, for example "Spark Nova" or "Food & drink".
  subtitle?: string;
};

// The top of a profile screen: a banner, a round picture, and the buttons to change them.
export function ProfileHeader({ userId, name, ring, subtitle }: Props) {
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) return;
    const r = await loadMyPictures(userId);
    if (r.ok) {
      setAvatar(r.avatar);
      setBanner(r.banner);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const change = async (kind: "avatar" | "banner") => {
    setBusy(true);
    setError("");
    const r = await chooseAndUpload(userId, kind);
    setBusy(false);
    if (!r.ok) setError(r.message);
    else if (r.changed) refresh();
  };

  const remove = async (kind: "avatar" | "banner") => {
    setBusy(true);
    setError("");
    const r = await removePicture(userId, kind);
    setBusy(false);
    if (!r.ok) setError(r.message);
    else refresh();
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: ring + "33" }]}>
        {!!banner && <Image source={{ uri: banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      </View>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Avatar uri={avatar} name={name} size={84} ring={ring} />
        </View>
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1}>{name || "Your name"}</Text>
          {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.links}>
        <Text style={styles.link} onPress={() => !busy && change("avatar")}>{avatar ? "Change picture" : "Add picture"}</Text>
        {!!avatar && <Text style={styles.linkMuted} onPress={() => !busy && remove("avatar")}>Remove picture</Text>}
        <Text style={styles.link} onPress={() => !busy && change("banner")}>{banner ? "Change banner" : "Add banner"}</Text>
        {!!banner && <Text style={styles.linkMuted} onPress={() => !busy && remove("banner")}>Remove banner</Text>}
      </View>
      <FormMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  banner: { height: 110, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1.5, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md, marginTop: -42, paddingHorizontal: spacing.md },
  avatar: { backgroundColor: colors.background, borderRadius: 999 },
  names: { flex: 1, paddingBottom: 6 },
  name: { ...typography.heading, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted },
  links: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  link: { ...typography.label, color: colors.accent, textDecorationLine: "underline" },
  linkMuted: { ...typography.label, color: colors.textMuted, textDecorationLine: "underline" },
});
