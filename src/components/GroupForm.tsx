import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { ChoiceCard } from "@/components/ChoiceCard";
import { FormMessage } from "@/components/FormMessage";
import { TextField } from "@/components/TextField";
import { GroupDraft, createGroup } from "@/lib/groups";
import { GROUP_TEMPLATES } from "@/lib/templates";
import { CITIES, PLATFORMS } from "@/lib/novaProfile";
import {
  COMMISSION_PERCENT,
  DURATION_OPTIONS,
  GROUP_JOIN_OPTIONS,
  GROUP_LUMEN_OPTIONS,
  GROUP_MARKUP_PERCENT,
  GROUP_MIN_LUMENS,
  GROUP_MIN_VIEWS_OPTIONS,
  GROUP_SIZE_OPTIONS,
  VIEWS_PER_LUMEN,
  durationLabel,
  groupMaxCost,
  groupRate,
  novaRate,
} from "@/lib/pricing";
import { checkOfferDescription, checkOfferTitle, shortNumber } from "@/lib/validation";
import { colors, gold, spacing, textOnArt, typography } from "@/theme";

type Props = {
  userId: string;
  profileCity: string;
  initial?: GroupDraft | null;
  onPosted: () => void;
  onCancel: () => void;
};

// The form for a group campaign: one budget, many Novas.
export function GroupForm({ userId, profileCity, initial, onPosted, onCancel }: Props) {
  const i = initial ?? {};
  const startCity = i.city ?? profileCity;
  const known = CITIES.slice(0, -1).includes(startCity);
  const [title, setTitle] = useState(i.title ?? "");
  const [description, setDescription] = useState(i.description ?? "");
  const [platform, setPlatform] = useState(i.platform ?? "");
  const [lumens, setLumens] = useState(i.target_lumens ?? 10);
  const [lumenText, setLumenText] = useState(String(i.target_lumens ?? 10));
  const [maxNovas, setMaxNovas] = useState(i.max_novas ?? 10);
  const [minViews, setMinViews] = useState(i.min_views ?? 0);
  const [joinDays, setJoinDays] = useState(i.join_days ?? 7);
  const [duration, setDuration] = useState(i.duration_days ?? 1);
  const [ifFewer, setIfFewer] = useState<"run" | "cancel">(i.if_fewer ?? "run");
  const [cityPick, setCityPick] = useState(startCity ? (known ? startCity : "Other") : "");
  const [otherCity, setOtherCity] = useState(startCity && !known ? startCity : "");
  const [errors, setErrors] = useState<{ title?: string; description?: string; platform?: string; city?: string; lumens?: string }>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const pickLumens = (n: number) => {
    setLumens(n);
    setLumenText(String(n));
    setErrors((e) => ({ ...e, lumens: undefined }));
  };
  const typeLumens = (t: string) => {
    const clean = t.replace(/[^0-9]/g, "").slice(0, 7);
    setLumenText(clean);
    setLumens(Number(clean) || 0);
    setErrors((e) => ({ ...e, lumens: undefined }));
  };
  const useTemplate = (d: GroupDraft) => {
    if (d.title !== undefined) setTitle(d.title);
    if (d.description !== undefined) setDescription(d.description);
    if (d.target_lumens !== undefined) pickLumens(d.target_lumens);
    if (d.join_days !== undefined) setJoinDays(d.join_days);
    if (d.duration_days !== undefined) setDuration(d.duration_days);
    setErrors({});
  };

  const rate = groupRate(duration);
  const maxCost = groupMaxCost(lumens, duration);
  const chosenCity = cityPick === "Other" ? otherCity.trim() : cityPick;

  const onPost = async () => {
    const next = {
      title: checkOfferTitle(title),
      description: checkOfferDescription(description),
      platform: platform ? "" : "Choose a platform",
      city: cityPick === "Other" && !chosenCity ? "Type your city or town" : "",
      lumens: lumens < GROUP_MIN_LUMENS ? `The smallest group campaign is ${GROUP_MIN_LUMENS} lumens` : "",
    };
    setErrors(next);
    setFormError("");
    if (next.title || next.description || next.platform || next.city || next.lumens) return;

    setSaving(true);
    const r = await createGroup(userId, {
      title: title.trim(),
      description: description.trim(),
      target_lumens: lumens,
      max_novas: maxNovas,
      platform,
      city: chosenCity,
      min_views: minViews,
      join_days: joinDays,
      duration_days: duration,
      if_fewer: ifFewer,
    });
    setSaving(false);
    if (!r.ok) {
      setFormError(r.message);
      return;
    }
    onPosted();
  };

  return (
    <>
      <Text style={styles.title}>New group campaign</Text>
      <Text style={styles.heading}>Start from a template</Text>
      <View style={styles.chips}>
        {GROUP_TEMPLATES.map((t) => (
          <Chip key={t.id} label={t.label} selected={false} onPress={() => useTemplate(t.draft)} />
        ))}
      </View>
      <Text style={styles.hint}>
        Choose how much reach you want. The price is fixed by Aba\u2019s group lumen rate (the standard rate plus a {GROUP_MARKUP_PERCENT}% group markup), so nobody sets their own price. Each Nova earns the same rate for every lumen of their own reach.
      </Text>
      <TextField
        label="Campaign title"
        value={title}
        onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: undefined })); }}
        error={errors.title}
        placeholder="e.g. Launch party this Saturday"
        maxLength={60}
      />
      <TextField
        label="Details (optional)"
        value={description}
        onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: undefined })); }}
        error={errors.description}
        placeholder="What should every Nova post? Any dates or links?"
        multiline
        maxLength={280}
        style={styles.multiline}
      />

      <Text style={styles.heading}>Which platform?</Text>
      <View style={styles.chips}>
        {PLATFORMS.map((p) => (
          <Chip key={p.id} label={p.label} selected={platform === p.id} onPress={() => { setPlatform(p.id); setErrors((e) => ({ ...e, platform: undefined })); }} />
        ))}
      </View>
      {!!errors.platform && <Text style={styles.error}>{errors.platform}</Text>}

      <Text style={styles.heading}>How many Novas, at most?</Text>
      <View style={styles.chips}>
        {GROUP_SIZE_OPTIONS.map((n) => (
          <Chip key={n} label={`${n} Novas`} selected={maxNovas === n} onPress={() => setMaxNovas(n)} />
        ))}
      </View>

      <Text style={styles.heading}>How much reach do you want?</Text>
      <Text style={styles.hint}>1 lumen = {VIEWS_PER_LUMEN.toLocaleString("en-GH")} views per post. This is the total reach of all the Novas together.</Text>
      <View style={styles.chips}>
        {GROUP_LUMEN_OPTIONS.map((l) => (
          <Chip key={l} label={`${l} lumens`} selected={lumens === l} onPress={() => pickLumens(l)} />
        ))}
      </View>
      <TextField label="Or type your own number of lumens" value={lumenText} onChangeText={typeLumens} error={errors.lumens} keyboardType="number-pad" placeholder="e.g. 250" />
      <Text style={styles.hint}>There is no upper limit. Ask for what you can afford.</Text>
      <Card style={styles.summary}>
        <Text style={styles.meta}>Standard price: GHS {rate} per lumen, for an advert that stays up {durationLabel(duration)}</Text>
        <Text style={styles.price}>Up to GHS {maxCost.toLocaleString("en-GH")}</Text>
        <Text style={styles.hint}>
          For about {shortNumber(lumens * VIEWS_PER_LUMEN)} views per post in total. You only pay for the reach the Novas actually bring. Each Nova earns GHS {novaRate(rate)} per lumen of their reach after Aba keeps {COMMISSION_PERCENT}%.
        </Text>
        <Text style={styles.hint}>
          Delivery guarantee: once payments go live, if the verified reach falls short, the difference is refunded or credited to you.
        </Text>
      </Card>

      <Text style={styles.heading}>Smallest audience allowed</Text>
      <Text style={styles.hint}>Views per post a Nova needs to join.</Text>
      <View style={styles.chips}>
        {GROUP_MIN_VIEWS_OPTIONS.map((v) => (
          <Chip key={v} label={v === 0 ? "Any" : `${shortNumber(v)}+ views`} selected={minViews === v} onPress={() => setMinViews(v)} />
        ))}
      </View>

      <Text style={styles.heading}>How long can Novas join?</Text>
      <View style={styles.chips}>
        {GROUP_JOIN_OPTIONS.map((d) => (
          <Chip key={d} label={`${d} days`} selected={joinDays === d} onPress={() => setJoinDays(d)} />
        ))}
      </View>

      <Text style={styles.heading}>How long should the advert stay up?</Text>
      <View style={styles.chips}>
        {DURATION_OPTIONS.map((d) => (
          <Chip key={d} label={durationLabel(d)} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>

      <Text style={styles.heading}>If the reach is not fully met</Text>
      <ChoiceCard
        title="Run with the reach we got"
        description="The campaign goes ahead and you pay only for that reach"
        icon="play-circle-outline"
        selected={ifFewer === "run"}
        onPress={() => setIfFewer("run")}
      />
      <ChoiceCard
        title="Cancel it"
        description="Nothing is charged and the campaign ends"
        icon="close-circle-outline"
        selected={ifFewer === "cancel"}
        onPress={() => setIfFewer("cancel")}
      />

      <Text style={styles.heading}>Which city? (optional)</Text>
      <Text style={styles.hint}>Leave it empty to reach Novas anywhere in Ghana.</Text>
      <View style={styles.chips}>
        {CITIES.map((c) => (
          <Chip key={c} label={c} selected={cityPick === c} onPress={() => { setCityPick(cityPick === c ? "" : c); setErrors((e) => ({ ...e, city: undefined })); }} />
        ))}
      </View>
      {cityPick === "Other" && (
        <TextField label="City or town" value={otherCity} onChangeText={(t) => { setOtherCity(t); setErrors((e) => ({ ...e, city: undefined })); }} placeholder="e.g. Ho" />
      )}
      {!!errors.city && <Text style={styles.error}>{errors.city}</Text>}

      <FormMessage message={formError} />
      <Button title="Post group campaign" loading={saving} onPress={onPost} />
      <Button title="Cancel" variant="secondary" disabled={saving} onPress={onCancel} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...textOnArt, ...typography.title, color: colors.text, marginTop: spacing.md },
  heading: { ...textOnArt, ...typography.heading, color: colors.text },
  hint: { ...textOnArt, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  meta: { ...typography.caption, color: colors.textMuted },
  price: { ...typography.title, color: gold },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  summary: { gap: spacing.xs, backgroundColor: colors.surfaceRaised },
});
