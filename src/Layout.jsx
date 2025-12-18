import AuthPage from "@/pages/AuthPage";
import React from "react";
import { Link, useLocation, Routes, Route, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Profile from "@/pages/Profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

// Pagine
import Home from "@/pages/Home";
import GenerateDocument from "@/pages/GenerateDocument";
import CompileDocument from "@/pages/CompileDocument";
import Settings from "@/pages/Settings";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ USA AuthContext invece di stato locale
  const { user } = useAuth();
  
  // ✅ Mantieni solo userProfile locale
  const [userProfile, setUserProfile] = React.useState(null);

  // ✅ Carica userProfile quando user cambia
  React.useEffect(() => {
    console.log("🔄 Layout: User changed:", user?.email || "null");
    
    if (!user?.id) {
      console.log("🧹 Layout: Nessun user, pulisco userProfile");
      setUserProfile(null);
      return;
    }
    
    const loadUserProfile = async () => {
      try {
        console.log("👤 Layout: Caricamento userProfile per user:", user.id);
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          console.warn("⚠️ Layout: Profilo utente non trovato:", error.message);
          setUserProfile(null);
          return;
        }
        
        console.log("✅ Layout: UserProfile caricato:", profile);
        setUserProfile(profile);
      } catch (err) {
        console.error("❌ Layout: Errore caricamento userProfile:", err);
        setUserProfile(null);
      }
    };
    
    loadUserProfile();
  }, [user]);

  const handleLogout = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("🚪 ========== LAYOUT LOGOUT ==========");
    console.log("🚪 User prima del logout:", user?.email);

    try {
      // Pulizia stato locale
      console.log("🧹 Layout: Pulizia userProfile locale...");
      setUserProfile(null);
      console.log("✅ Layout: userProfile pulito");

      // Logout da Supabase
      console.log("🚪 Layout: Chiamata supabase.auth.signOut({ scope: 'global' })...");
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error("❌ Layout: Errore durante signOut:", error);
        throw error;
      }

      console.log("✅ Layout: signOut() completato");

      // Pulizia manuale localStorage
      console.log("🧹 Layout: Pulizia manuale localStorage...");
      try {
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || 
          key.includes('supabase') ||
          key.includes('auth-token')
        );
        
        console.log("🗑️ Layout: Chiavi Supabase trovate:", supabaseKeys);
        supabaseKeys.forEach(key => {
          console.log("🗑️ Layout: Rimuovo chiave:", key);
          localStorage.removeItem(key);
        });
        
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith('sb-') || 
          key.includes('supabase') ||
          key.includes('auth-token')
        );
        
        sessionKeys.forEach(key => {
          console.log("🗑️ Layout: Rimuovo da sessionStorage:", key);
          sessionStorage.removeItem(key);
        });
        
        console.log("✅ Layout: Storage pulito");
      } catch (storageErr) {
        console.warn("⚠️ Layout: Errore pulizia storage:", storageErr);
      }

      // Attendi propagazione
      console.log("⏱️ Layout: Attesa propagazione (500ms)...");
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect alla home
      console.log("🔄 Layout: Redirect alla home...");
      console.log("🚪 ========== LAYOUT LOGOUT COMPLETATO ==========");
      
      window.location.href = '/';

    } catch (err) {
      console.error("❌ Layout: Errore logout:", err);
      
      setUserProfile(null);
      
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-') || key.includes('supabase'))
        .forEach(key => localStorage.removeItem(key));
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getUserFullName = () => {
    if (userProfile?.nome && userProfile?.cognome) {
      return `${userProfile.nome} ${userProfile.cognome}`;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Utente";
  };

  const getSubscriptionType = () => {
    return userProfile?.subscription_type || user?.user_metadata?.subscription_type || "free";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="fixed left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DocuMate</h1>
                <p className="text-xs text-gray-500">Documenti Legali Intelligenti</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to={createPageUrl("Settings")}>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-xl">
                      <SettingsIcon className="w-5 h-5 text-gray-600" />
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-auto p-0 hover:opacity-80">
                        <Avatar className="w-10 h-10 border-2 border-indigo-200">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-semibold">
                            {getInitials(getUserFullName())}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="font-semibold text-gray-900">{getUserFullName()}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              getSubscriptionType() === "premium"
                                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                                : getSubscriptionType() === "registered"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {getSubscriptionType() === "premium"
                              ? "⭐ Premium"
                              : getSubscriptionType() === "registered"
                              ? "Registrato"
                              : "Gratuito"}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Profile")} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Profilo
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Settings")} className="cursor-pointer">
                          <SettingsIcon className="w-4 h-4 mr-2" />
                          Impostazioni
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleLogout(e)}
                        className="cursor-pointer text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Esci
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                >
                  Accedi
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/generate-document" element={<GenerateDocument />} />
          <Route path="/compile-document" element={<CompileDocument />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
