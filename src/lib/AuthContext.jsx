import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // ⚠️ QUICK FIX: parte da false per non bloccare

  // Funzione di pulizia manuale storage
  const clearSupabaseStorage = () => {
    try {
      console.log("🧹 AuthContext: Pulizia manuale storage...");
      
      // localStorage
      const localKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase') ||
        key.includes('auth-token')
      );
      
      console.log("🗑️ AuthContext: Chiavi localStorage da rimuovere:", localKeys);
      localKeys.forEach(key => localStorage.removeItem(key));
      
      // sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase') ||
        key.includes('auth-token')
      );
      
      console.log("🗑️ AuthContext: Chiavi sessionStorage da rimuovere:", sessionKeys);
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
      
      console.log("✅ AuthContext: Storage pulito");
    } catch (err) {
      console.error("❌ AuthContext: Errore pulizia storage:", err);
    }
  };

  // Recupera l'utente attuale all'avvio
  useEffect(() => {
    console.log("📍 AuthProvider useEffect started");
    
    const getUser = async () => {
      console.log("📍 getUser started");
      try {
        console.log("📍 Calling supabase.auth.getUser()...");
        const { data, error } = await supabase.auth.getUser();
        console.log("✅ Got response:", { data, error });
        
        if (error) {
          console.warn('⚠️ Errore nel recupero utente:', error.message);
          setUser(null);
        } else {
          console.log("✅ User set:", data?.user?.email || "null");
          setUser(data?.user ?? null);
        }
      } catch (err) {
        console.error('❌ Errore imprevisto nel recupero utente:', err);
        setUser(null);
      }
      console.log("📍 getUser completed");
    };

    getUser();

    // Listener per login/logout in tempo reale
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("📍 ========== AUTH STATE CHANGE ==========");
      console.log("📍 Event:", event);
      console.log("📍 Session user:", session?.user?.email || "no user");
      console.log("📍 Current user:", user?.email || "no user");
      
      // CRITICO: Ignora eventi se siamo in fase di logout
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log("📍 Evento SIGNED_OUT/USER_DELETED - pulizia completa");
        setUser(null);
        clearSupabaseStorage();
        console.log("✅ User state pulito, storage pulito");
        return;
      }
      
      // Se non c'è session, pulisci
      if (!session || !session.user) {
        console.log("📍 Nessuna session valida - pulizia user");
        setUser(null);
        return;
      }
      
      // Imposta user SOLO se diverso da quello attuale
      if (session.user.id !== user?.id) {
        console.log("📍 Nuovo user rilevato:", session.user.email);
        setUser(session.user);
      } else {
        console.log("📍 User già impostato, skip update");
      }
      
      console.log("📍 ========== AUTH STATE CHANGE END ==========");
    });

    return () => {
      console.log("📍 AuthProvider cleanup");
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  // Funzione signOut aggiornata
  const signOut = async () => {
    console.log("🚪 ========== AuthContext.signOut CHIAMATO ==========");
    console.log("🚪 User prima del signOut:", user?.email);
    
    try {
      // Step 1: Pulizia stato locale PRIMA del signOut Supabase
      console.log("🧹 AuthContext: Pulizia stato user...");
      setUser(null);
      console.log("✅ AuthContext: Stato user = null");
      
      // Step 2: Logout da Supabase
      console.log("🚪 AuthContext: Chiamata supabase.auth.signOut({ scope: 'global' })...");
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("❌ AuthContext: Errore signOut Supabase:", error);
        // Anche in caso di errore, pulisci comunque lo storage
        clearSupabaseStorage();
        throw error;
      }
      
      console.log("✅ AuthContext: signOut Supabase completato");
      
      // Step 3: Pulizia manuale storage
      clearSupabaseStorage();
      
      console.log("✅ ========== AuthContext.signOut COMPLETATO ==========");
      return { error: null };
      
    } catch (err) {
      console.error("❌ AuthContext: Errore durante signOut:", err);
      
      // Anche in caso di errore, forza pulizia
      setUser(null);
      clearSupabaseStorage();
      
      return { error: err };
    }
  };

  const value = {
    user,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut,
  };

  console.log("📍 AuthProvider render - loading:", loading, "user:", user?.email || "null");

  // ⚠️ QUICK FIX: Non blocca più su loading, renderizza subito
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

