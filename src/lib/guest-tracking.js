// src/lib/guest-tracking.js
import { supabase } from '@/api/supabaseClient';

const GUEST_ID_KEY = 'documate_guest_id';
const MONTHLY_LIMIT_GUEST = 5;
const MONTHLY_LIMIT_USER = 10;

// Genera un ID guest univoco
const generateGuestId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `guest_${timestamp}_${random}`;
};

// Ottieni o crea guest ID
export const getGuestId = () => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

// Controlla quanti documenti ha generato questo mese
export const checkMonthlyLimit = async (userId = null) => {
  const isGuest = !userId;
  const identifier = isGuest ? getGuestId() : userId;
  const limit = isGuest ? MONTHLY_LIMIT_GUEST : MONTHLY_LIMIT_USER;

  // Data di inizio mese corrente
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52752017-d5b4-4cac-bcba-56f136837bf9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'guest-tracking.js:36',message:'Checking monthly limit',data:{isGuest,identifier,startOfMonth:startOfMonth.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    const { data, error } = await supabase
      .from('document_generations')
      .select('id', { count: 'exact' })
      .eq(isGuest ? 'guest_id' : 'user_id', identifier)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    const count = data?.length || 0;
    const remaining = Math.max(0, limit - count);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52752017-d5b4-4cac-bcba-56f136837bf9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'guest-tracking.js:44',message:'Monthly limit result',data:{count,limit,remaining,canGenerate:count<limit,isGuest},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    return {
      success: true,
      count,
      limit,
      remaining,
      canGenerate: count < limit,
      isGuest,
    };
  } catch (error) {
    console.error('Errore controllo limite:', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52752017-d5b4-4cac-bcba-56f136837bf9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'guest-tracking.js:56',message:'Monthly limit error',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    return { success: false, error: error.message };
  }
};

// Registra una generazione documento
export const trackGeneration = async (documentType, userId = null) => {
  const isGuest = !userId;
  const identifier = isGuest ? getGuestId() : userId;

  try {
    const { error } = await supabase
      .from('document_generations')
      .insert({
        [isGuest ? 'guest_id' : 'user_id']: identifier,
        document_type: documentType,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Errore tracking:', error);
    return { success: false, error: error.message };
  }
};
