import { supabase } from './supabaseClient';

export const profileApi = {
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async saveUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([{ ...profileData, user_id: userId }])
      .select();
    if (error) throw error;
    return data?.[0];
  }
};

export const companyApi = {
  async getCompanies(userId) {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async saveCompany(userId, companyData) {
    const payload = { ...companyData, user_id: userId };
    const { data, error } = await supabase
      .from('company_profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const documentsApi = {
  async getDocuments(userId) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
