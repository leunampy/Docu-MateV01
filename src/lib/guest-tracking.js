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
    const { data, error } = await supabase
      .from('document_generations')
      .select('id', { count: 'exact' })
      .eq(isGuest ? 'guest_id' : 'user_id', identifier)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    const count = data?.length || 0;
    const remaining = Math.max(0, limit - count);

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
    return { success: false, error: error.message };
  }
};

// Registra una generazione documento
export const trackGeneration = async (documentType, userId = null) => {
  const isGuest = !userId;
  const identifier = isGuest ? getGuestId() : userId;

  console.log('🔵 trackGeneration chiamato:', { documentType, userId, isGuest, identifier });

  try {
    const insertData = {
      [isGuest ? 'guest_id' : 'user_id']: identifier,
      document_type: documentType,
      created_at: new Date().toISOString(),
    };
    
    console.log('🔵 Dati da inserire:', insertData);

    const { data, error } = await supabase
      .from('document_generations')
      .insert(insertData)
      .select();

    if (error) {
      console.error('❌ Errore Supabase:', error);
      throw error;
    }
    
    console.log('✅ Record inserito:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Errore tracking:', error);
    return { success: false, error: error.message };
  }
};
