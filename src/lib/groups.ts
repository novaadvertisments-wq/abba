// Group campaigns: one budget, many Novas, shared by each Nova's views.
import { supabase } from "./supabase";

export type GroupStatus = "open" | "closed" | "cancelled";

export type BusinessGroup = {
  id: string;
  title: string;
  description: string;
  total_budget_ghs: number; // the most the business can be charged
  target_lumens: number;
  rate_ghs: number; // GHS per lumen, fixed by the standard rate
  max_novas: number;
  platform: string;
  city: string;
  min_views: number;
  join_deadline: string;
  duration_days: number;
  if_fewer: "run" | "cancel";
  status: GroupStatus;
  created_at: string;
  joined_count: number;
  total_views: number;
  cost_ghs: number; // what the business owes so far
};

export type NovaGroup = Omit<BusinessGroup, "created_at" | "cost_ghs"> & {
  business_name: string;
  business_category: string;
  business_avatar: string;
  my_views: number | null;
  joined: boolean;
  est_share: number | null;
  final_share: number | null;
  kept_for_micro: boolean;
  cap_views: number;
};

// Hand-off for "Run again" and templates: the Campaigns tab leaves a draft here and the Post tab picks it up.
export type GroupDraft = Partial<NewGroup>;
let pendingDraft: GroupDraft | null = null;
export const setPendingDraft = (d: GroupDraft) => { pendingDraft = d; };
export const takePendingDraft = () => { const d = pendingDraft; pendingDraft = null; return d; };

export type GroupMember = {
  nova_id: string;
  nova_name: string;
  nova_city: string;
  views: number;
  share_ghs: number;
  is_final: boolean;
  nova_avatar: string;
};

export type NewGroup = {
  title: string;
  description: string;
  target_lumens: number;
  max_novas: number;
  platform: string;
  city: string;
  min_views: number;
  join_days: number;
  duration_days: number;
  if_fewer: "run" | "cancel";
};

type Failure = { ok: false; message: string };
const FAIL: Failure = { ok: false, message: "Something went wrong. Check your internet and try again." };

// Messages the database writes on purpose (they start with a capital letter and are short).
function friendly(error: { code?: string; message?: string }): Failure {
  if (error.code === "P0001" && error.message) return { ok: false, message: error.message };
  return FAIL;
}

export async function loadBusinessGroups(): Promise<{ ok: true; groups: BusinessGroup[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("business_groups");
    if (error) return FAIL;
    return { ok: true, groups: (data ?? []) as BusinessGroup[] };
  } catch {
    return FAIL;
  }
}

export async function loadGroupMembers(id: string): Promise<{ ok: true; members: GroupMember[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("group_members_of", { p_campaign: id });
    if (error) return FAIL;
    return { ok: true, members: (data ?? []) as GroupMember[] };
  } catch {
    return FAIL;
  }
}

export async function createGroup(userId: string, g: NewGroup): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.from("group_campaigns").insert({ business_id: userId, ...g });
    if (error) return error.code === "P0001" && error.message ? { ok: false, message: error.message } : FAIL;
    return { ok: true };
  } catch {
    return FAIL;
  }
}

export async function closeGroup(id: string): Promise<{ ok: true; status: GroupStatus } | Failure> {
  try {
    const { data, error } = await supabase.rpc("close_group", { p_campaign: id });
    if (error) return friendly(error);
    return { ok: true, status: data as GroupStatus };
  } catch {
    return FAIL;
  }
}

export async function loadNovaGroups(): Promise<{ ok: true; groups: NovaGroup[] } | Failure> {
  try {
    const { data, error } = await supabase.rpc("nova_open_groups");
    if (error) return FAIL;
    return { ok: true, groups: (data ?? []) as NovaGroup[] };
  } catch {
    return FAIL;
  }
}

export async function joinGroup(id: string): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.rpc("join_group", { p_campaign: id });
    return error ? friendly(error) : { ok: true };
  } catch {
    return FAIL;
  }
}

export async function leaveGroup(id: string): Promise<{ ok: true } | Failure> {
  try {
    const { error } = await supabase.rpc("leave_group", { p_campaign: id });
    return error ? friendly(error) : { ok: true };
  } catch {
    return FAIL;
  }
}

// "3 days left", "5 hours left", "ended"
export function timeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Joining ended";
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "Less than an hour left to join";
  if (hours < 48) return `${hours} hours left to join`;
  return `${Math.floor(hours / 24)} days left to join`;
}
