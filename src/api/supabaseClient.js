import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variabili d\'ambiente Supabase non configurate. Alcune funzionalità potrebbero non funzionare.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

