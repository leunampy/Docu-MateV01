import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/52752017-d5b4-4cac-bcba-56f136837bf9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:3',message:'Supabase env vars check',data:{url:supabaseUrl,keyPresent:!!supabaseAnonKey,keyLength:supabaseAnonKey?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variabili d\'ambiente Supabase non configurate. Alcune funzionalità potrebbero non funzionare.');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/52752017-d5b4-4cac-bcba-56f136837bf9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:7',message:'Supabase config missing',data:{urlMissing:!supabaseUrl,keyMissing:!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// #region agent log
fetch('http://127.0.0.1:7242/ingest/52752017-d5b4-4cac-bcba-56f136837bf9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:10',message:'Supabase client created',data:{url:supabaseUrl,clientCreated:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
