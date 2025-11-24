import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // ⚠️ QUICK FIX: parte da false per non bloccare

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
      console.log("📍 Auth state changed:", event, session?.user?.email || "no user");
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log("📍 SIGNED_OUT event - pulizia stato user");
        setUser(null);
        return;
      }
      
      setUser(session?.user ?? null);
    });

    return () => {
      console.log("📍 AuthProvider cleanup");
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  // Azioni disponibili nel contesto
  const signOut = async () => {
    console.log("📍 AuthContext signOut chiamato");
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error("❌ Errore signOut in AuthContext:", error);
        throw error;
      }
      // Cleanup immediato dello stato
      console.log("📍 AuthContext signOut - pulizia stato user");
      setUser(null);
      return { error: null };
    } catch (err) {
      console.error("❌ Errore durante signOut in AuthContext:", err);
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

