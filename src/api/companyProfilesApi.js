import { supabase } from "@/api/supabaseClient";

export async function listCompanyProfiles(userId) {
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCompanyProfile(id) {
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertCompanyProfile(payload) {
  const { data, error } = await supabase
    .from("company_profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompanyProfile(id) {
  const { error } = await supabase.from("company_profiles").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* Example: helpers for related tables */
export async function listCompanyLocations(companyProfileId) {
  const { data, error } = await supabase
    .from("company_locations")
    .select("*")
    .eq("company_profile_id", companyProfileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertCompanyLocation(payload) {
  const { data, error } = await supabase
    .from("company_locations")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* replicate similar helpers for representatives, certifications, insurances, financials, contacts */
