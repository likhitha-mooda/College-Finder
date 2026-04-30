import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Placements = {
  placement_percentage: number;
  avg_package_lpa: number;
  highest_package_lpa: number;
  top_recruiters: string[];
};

export type College = Omit<Tables<"colleges">, "placements"> & {
  placements: Placements;
};

export type ListParams = {
  search?: string;
  location?: string | null;
  minFees?: number;
  maxFees?: number;
  page?: number;
  pageSize?: number;
};

export async function listColleges(params: ListParams = {}) {
  const { search, location, minFees, maxFees, page = 1, pageSize = 12 } = params;
  let q = supabase
    .from("colleges")
    .select("*", { count: "exact" })
    .order("rating", { ascending: false })
    .order("name", { ascending: true });

  if (search && search.trim()) q = q.ilike("name", `%${search.trim()}%`);
  if (location) q = q.eq("location", location);
  if (typeof minFees === "number") q = q.gte("fees", minFees);
  if (typeof maxFees === "number") q = q.lte("fees", maxFees);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await q.range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as unknown as College[], count: count ?? 0 };
}

export async function getCollege(id: string) {
  const { data, error } = await supabase.from("colleges").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as College | null;
}

export async function getCollegesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("colleges").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as unknown as College[];
}

export async function listLocations() {
  const { data, error } = await supabase.from("colleges").select("location");
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r) => set.add(r.location));
  return Array.from(set).sort();
}

/* Saved colleges */
export async function getSavedIds(userId: string) {
  const { data, error } = await supabase.from("saved_colleges").select("college_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.college_id));
}

export async function saveCollege(userId: string, collegeId: string) {
  const { error } = await supabase.from("saved_colleges").insert({ user_id: userId, college_id: collegeId });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unsaveCollege(userId: string, collegeId: string) {
  const { error } = await supabase.from("saved_colleges").delete().eq("user_id", userId).eq("college_id", collegeId);
  if (error) throw error;
}

export async function listSavedColleges(userId: string) {
  const { data, error } = await supabase
    .from("saved_colleges")
    .select("college_id, created_at, colleges(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((r) => r.colleges as unknown as College | null)
    .filter((c): c is College => !!c);
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}