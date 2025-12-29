// Entities module - placeholder for future entity management
// Previously used base44Client, now using Supabase directly

import { supabase } from './supabaseClient';

// Query helper - to be implemented with Supabase
export const Query = {
  // Placeholder - implement with Supabase queries as needed
};

// User auth - use supabase.auth directly instead
export const User = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  updateMe: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        ...data
      }
    });
    
    if (error) throw error;
    return user;
  }
};