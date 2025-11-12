import { supabase } from './supabaseClient';

export const companyProfilesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(profileData) {
    const { data, error } = await supabase
      .from('company_profiles')
      .insert([profileData])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async update(id, profileData) {
    const { data, error } = await supabase
      .from('company_profiles')
      .update(profileData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from('company_profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};
