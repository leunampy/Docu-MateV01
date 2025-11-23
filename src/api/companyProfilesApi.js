import { supabase } from "@/api/supabaseClient";

// Funzioni individuali (per backward compatibility)
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

// Oggetto API per CompanyProfileModal
const companyProfilesApi = {
  async list(userId) {
    return listCompanyProfiles(userId);
  },
  
  async get(id) {
    return getCompanyProfile(id);
  },
  
  async create(data) {
    // Aggiungi user_id se mancante
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const payload = { ...data, user_id: user.id };
    return upsertCompanyProfile(payload);
  },
  
  async update(id, data) {
    const payload = { ...data, id };
    return upsertCompanyProfile(payload);
  },
  
  async delete(id) {
    return deleteCompanyProfile(id);
  }
};

export { companyProfilesApi };

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
