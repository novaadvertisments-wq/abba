// Everything the Business profile screen needs to talk to the database.
import { supabase } from "./supabase";

export const CATEGORIES: { id: string; label: string }[] = [
  { id: "food", label: "Food & drink" },
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Beauty" },
  { id: "events", label: "Events" },
  { id: "tech", label: "Tech" },
  { id: "retail", label: "Retail" },
  { id: "services", label: "Services" },
  { id: "education", label: "Education" },
  { id: "other", label: "Other" },
];

export type BusinessProfileData = {
  business_name: string;
  category: string;
  city: string;
  area: string;
  description: string;
};

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

export async function loadBusinessProfile(
  userId: string,
): Promise<({ ok: true; exists: boolean } & BusinessProfileData) | Failure> {
  try {
    const { data, error } = await supabase
      .from("business_profiles")
      .select("business_name, category, city, area, description")
      .eq("id", userId)
      .maybeSingle();
    if (error) return FAIL;
    return {
      ok: true,
      exists: !!data,
      business_name: data?.business_name ?? "",
      category: data?.category ?? "",
      city: data?.city ?? "",
      area: data?.area ?? "",
      description: data?.description ?? "",
    };
  } catch {
    return FAIL;
  }
}

export async function saveBusinessProfile(
  userId: string,
  d: BusinessProfileData,
): Promise<{ ok: true } | Failure> {
  try {
    const upd = await supabase
      .from("business_profiles")
      .update({ ...d, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id");
    if (upd.error) return FAIL;
    if (upd.data && upd.data.length > 0) return { ok: true };
    const ins = await supabase.from("business_profiles").insert({ id: userId, ...d });
    return ins.error ? FAIL : { ok: true };
  } catch {
    return FAIL;
  }
}
