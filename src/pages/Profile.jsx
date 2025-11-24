import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { User, Building2, FileText, CreditCard, Plus, Trash2 } from "lucide-react";

const COMPANY_NUMERIC_FIELDS = [
  "fatturato_anno_corrente",
  "fatturato_anno_precedente",
  "fatturato_due_anni_fa",
  "fatturato_tre_anni_fa",
  "patrimonio_netto",
  "capitale_circolante",
  "numero_dipendenti",
  "numero_collaboratori",
  "organico_medio_triennio",
];

const PERSONAL_NUMERIC_FIELDS = [];

function normalizeNumericFields(payload, numericFields) {
  return numericFields.reduce((acc, field) => {
    const value = acc[field];
    acc[field] =
      value === undefined || value === null || `${value}`.trim() === "" ? null : value;
    return acc;
  }, { ...payload });
}

function supabaseWithTimeout(operationPromise, timeout = 10000) {
  return Promise.race([
    operationPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("⏱️ Timeout: operazione troppo lenta")), timeout)
    ),
  ]);
}

export default function ProfilePage() {
  const authContext = useAuth();
  
  // Controllo di sicurezza per evitare errori se il contesto non è disponibile
  if (!authContext) {
    return (
      <div className="text-center py-20 text-gray-500">
        Caricamento...
      </div>
    );
  }
  
  const user = authContext.user;

  const [activeTab, setActiveTab] = useState("personal");

  // PERSONAL (multi)
  const [personalProfiles, setPersonalProfiles] = useState([]);
  const [selectedPersonalId, setSelectedPersonalId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfileList, setLoadingProfileList] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // COMPANY (multi)
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loadingCompanyList, setLoadingCompanyList] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);

  // stats
  const [documentCount, setDocumentCount] = useState(0);

  // ---------- HELPERS ----------
  function getInitials(emailOrName) {
    if (!emailOrName) return "U";
    const parts = emailOrName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailOrName[0].toUpperCase();
  }

  function setField(field, value) {
    setProfile((prev) => ({ ...(prev || {}), [field]: value }));
  }

  function setCompanyField(field, value) {
    setCompanyProfile((prev) => ({ ...(prev || {}), [field]: value }));
  }

  // ---------- LOAD LISTS ----------
  async function loadPersonalProfiles() {
    if (!user?.id) return;
    setLoadingProfileList(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Errore caricamento profili personali:", error);
      setPersonalProfiles([]);
    } else {
      setPersonalProfiles(data || []);
      // if no selection, set primary profile if exists
      if (!selectedPersonalId) {
        const primary = data && data.length ? data[0] : null;
        if (primary) {
          setSelectedPersonalId(primary.id);
          setProfile(primary);
        } else {
          setProfile({});
        }
      } else {
        // try to keep selected loaded
        const sel = (data || []).find((p) => p.id === selectedPersonalId);
        if (sel) setProfile(sel);
      }
    }
    setLoadingProfileList(false);
  }

  async function loadCompanyProfiles() {
    console.log("🔍 ========== LOAD COMPANY PROFILES ==========");
    console.log("🔍 User disponibile:", !!user);
    console.log("🔍 User ID:", user?.id);

    if (!user?.id) {
      console.warn("⚠️ User ID mancante, skip loadCompanyProfiles");
      return;
    }

    setLoadingCompanyList(true);

    try {
      console.log("🔍 Inizio query SELECT company_profiles...");
      const startTime = Date.now();

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const queryTime = Date.now() - startTime;
      console.log(`🔍 Query completata in ${queryTime}ms`);
      console.log("🔍 Risposta Supabase:", {
        hasData: !!data,
        recordCount: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        records: data,
      });

      // Log dei campi presenti nei record per verificare i nomi dei campi
      if (data && data.length > 0) {
        console.log("🔍 Campi presenti nel primo record:", Object.keys(data[0]));
        console.log("🔍 Valori campi nome:", {
          ragione_sociale: data[0].ragione_sociale,
          company_name: data[0].company_name,
          profile_name: data[0].profile_name,
          id: data[0].id,
        });
      }

      if (error) {
        console.error("❌ Errore query SELECT:", error);
        console.error("❌ Dettagli errore completo:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          stack: error.stack,
        });
        setCompanyProfiles([]);
      } else {
        console.log("🔍 Profili caricati:", data);
        setCompanyProfiles(data || []);
        console.log("🔍 setCompanyProfiles chiamato con", data?.length || 0, "profili");

        if (!selectedCompanyId) {
          const primary = data && data.length ? data[0] : null;
          if (primary) {
            console.log("🔍 Nessun profilo selezionato, seleziono il primo:", primary.id);
            setSelectedCompanyId(primary.id);
            setCompanyProfile(primary);
          } else {
            console.log("🔍 Nessun profilo disponibile");
            setCompanyProfile({});
          }
        } else {
          console.log("🔍 Profilo già selezionato:", selectedCompanyId);
          const sel = (data || []).find((c) => c.id === selectedCompanyId);
          if (sel) {
            console.log("🔍 Profilo selezionato trovato nei dati caricati");
            setCompanyProfile(sel);
          } else {
            console.warn("⚠️ Profilo selezionato non trovato nei dati caricati");
          }
        }
      }

      console.log("🔍 ========== LOAD COMPLETATO ==========");
    } catch (err) {
      console.error("❌ Errore loadCompanyProfiles:", {
        message: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack,
      });
      setCompanyProfiles([]);
    } finally {
      setLoadingCompanyList(false);
    }
  }

  // ---------- STATS ----------
  async function loadDocumentStats() {
    if (!user?.id) return;
    const { count, error } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) {
      console.error("Errore conteggio documenti:", error);
      return;
    }

    setDocumentCount(count || 0);
  }

  // initial load
  useEffect(() => {
    console.log("🔄 useEffect triggered - user changed:", user?.id);
    if (user?.id) {
      console.log("🔄 User ID disponibile, carico profili...");
      loadPersonalProfiles();
      loadCompanyProfiles();
      loadDocumentStats();
    } else {
      console.log("🔄 User ID non disponibile, skip caricamento");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // when selected id changes, set the object
  useEffect(() => {
    if (selectedPersonalId) {
      const p = personalProfiles.find((x) => x.id === selectedPersonalId);
      setProfile(p ? { ...p } : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonalId, personalProfiles]);

  useEffect(() => {
    if (selectedCompanyId) {
      const c = companyProfiles.find((x) => x.id === selectedCompanyId);
      setCompanyProfile(c ? { ...c } : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, companyProfiles]);

  // ---------- CREATE new profiles ----------
  async function createNewPersonalProfile() {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      nome: "Nuovo profilo",
      cognome: "",
    };
    const { data, error } = await supabase
      .from("user_profiles")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("Errore creazione profilo personale:", error);
      alert("Errore creazione profilo personale");
      return;
    }
    await loadPersonalProfiles();
    setSelectedPersonalId(data.id);
  }

  async function createNewCompanyProfile() {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      ragione_sociale: "Nuova azienda",
    };
    const { data, error } = await supabase
      .from("company_profiles")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("Errore creazione profilo aziendale:", error);
      alert("Errore creazione profilo aziendale");
      return;
    }
    await loadCompanyProfiles();
    setSelectedCompanyId(data.id);
  }

  // ---------- DELETE ----------
  async function deletePersonalProfile(id) {
    if (!id) return;
    if (!confirm("Eliminare questo profilo personale?")) return;
    const { error } = await supabase.from("user_profiles").delete().eq("id", id);
    if (error) {
      console.error("Errore eliminazione profilo personale:", error);
      alert("Errore eliminazione profilo personale");
      return;
    }
    // reload and clear selection
    await loadPersonalProfiles();
    setSelectedPersonalId((prev) => {
      if (prev === id) return personalProfiles.length ? personalProfiles[0]?.id : null;
      return prev;
    });
  }

  async function deleteCompanyProfile(id) {
    if (!id) return;
    if (!confirm("Eliminare questo profilo aziendale?")) return;
    const { error } = await supabase.from("company_profiles").delete().eq("id", id);
    if (error) {
      console.error("Errore eliminazione profilo aziendale:", error);
      alert("Errore eliminazione profilo aziendale");
      return;
    }
    await loadCompanyProfiles();
    setSelectedCompanyId((prev) => {
      if (prev === id) return companyProfiles.length ? companyProfiles[0]?.id : null;
      return prev;
    });
  }

  // ---------- SAVE / UPSERT ----------
  async function savePersonalProfile() {
    if (!user?.id || !profile) return;
    setSavingProfile(true);
    const normalizedPayload = normalizeNumericFields(
      { ...profile, user_id: user.id },
      PERSONAL_NUMERIC_FIELDS
    );

    try {
      let result;
      if (profile.id) {
        const { data, error } = await supabaseWithTimeout(
          supabase
            .from("user_profiles")
            .update(normalizedPayload)
            .eq("id", profile.id)
            .select()
            .single()
        );
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseWithTimeout(
          supabase.from("user_profiles").insert(normalizedPayload).select().single()
        );
        if (error) throw error;
        result = data;
      }

      setProfile(result);
      setSelectedPersonalId(result.id);
      await loadPersonalProfiles();
      alert("✅ Profilo personale salvato!");
    } catch (err) {
      console.error("❌ Errore salvataggio profilo personale:", err);
      alert(`❌ Errore: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveCompanyProfile() {
    if (!user?.id || !companyProfile) return;
    setSavingCompany(true);

    const normalizedPayload = normalizeNumericFields(
      { ...companyProfile, user_id: user.id },
      COMPANY_NUMERIC_FIELDS
    );

    try {
      let result;
      if (companyProfile.id) {
        const { data, error } = await supabaseWithTimeout(
          supabase
            .from("company_profiles")
            .update(normalizedPayload)
            .eq("id", companyProfile.id)
            .select()
            .single()
        );
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseWithTimeout(
          supabase.from("company_profiles").insert(normalizedPayload).select().single()
        );
        if (error) throw error;
        result = data;
      }

      setCompanyProfile(result);
      setSelectedCompanyId(result.id);
      await loadCompanyProfiles();
      alert("✅ Profilo aziendale salvato con successo!");
    } catch (err) {
      console.error("❌ Errore salvataggio profilo aziendale:", err);
      if (err.message?.includes("row-level security")) {
        alert("⚠️ Errore permessi database. Contatta il supporto.");
      } else if (err.message?.includes("invalid input syntax")) {
        alert("⚠️ Alcuni campi contengono dati non validi. Controlla i campi numerici.");
      } else {
        alert(`❌ Errore: ${err.message}`);
      }
    } finally {
      setSavingCompany(false);
    }
  }

  // ---------- RENDER ----------
  if (!user) {
    return (
      <div className="text-center py-20 text-gray-500">
        Devi effettuare l'accesso per visualizzare il profilo.
      </div>
    );
  }

  const fullName = profile?.nome || profile?.cognome 
    ? `${profile?.nome || ""} ${profile?.cognome || ""}`.trim() 
    : (user?.email || "Utente");

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Il Mio Profilo</h1>
        <p className="text-gray-600">Gestisci i tuoi dati e i profili aziendali.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT */}
        <div className="w-full lg:w-1/3 space-y-4">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarFallback className="bg-indigo-600 text-white text-xl">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{fullName}</h2>
              <p className="text-gray-500 text-sm mb-3">{user.email}</p>
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">Gratuito</Badge>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Statistiche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Documenti generati</p>
                  <p className="text-xl font-bold text-gray-900">{documentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: TABS */}
        <div className="w-full lg:w-2/3 space-y-4">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-4 pb-2">
              {/* TABS */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                <button className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 ${activeTab === "personal" ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`} onClick={() => setActiveTab("personal")}>
                  <User className="inline w-4 h-4 mr-1" /> Personale
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 ${activeTab === "company" ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`} onClick={() => setActiveTab("company")}>
                  <Building2 className="inline w-4 h-4 mr-1" /> Aziendale
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 ${activeTab === "documents" ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`} onClick={() => setActiveTab("documents")}>
                  <FileText className="inline w-4 h-4 mr-1" /> Documenti
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 ${activeTab === "billing" ? "border-indigo-600 text-indigo-600 bg-indigo-50" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`} onClick={() => setActiveTab("billing")}>
                  <CreditCard className="inline w-4 h-4 mr-1" /> Abbonamento
                </button>
              </div>

              {/* TAB CONTENT */}
              {activeTab === "personal" && (
                <>
                  {/* Personal top actions: select, add, delete */}
                  <div className="mt-4 mb-4 flex items-center gap-3">
                    <Label>Seleziona profilo personale</Label>
                    <select
                      value={selectedPersonalId || ""}
                      onChange={(e) => setSelectedPersonalId(e.target.value || null)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">-- Nuovo / Nessuno --</option>
                      {personalProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {`${p.nome || "—"} ${p.cognome || ""}`.trim() || p.id}
                        </option>
                      ))}
                    </select>

                    <Button onClick={createNewPersonalProfile} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Nuovo
                    </Button>

                    {selectedPersonalId && (
                      <Button variant="destructive" onClick={() => deletePersonalProfile(selectedPersonalId)} className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Elimina
                      </Button>
                    )}
                  </div>

                  {/* Personal form */}
                  <div className="space-y-8">
                    {/* Dati principali */}
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Anagrafici</h2>
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Nome</Label>
                          <Input value={profile?.nome || ""} onChange={(e) => setField("nome", e.target.value)} />
                        </div>
                        <div>
                          <Label>Cognome</Label>
                          <Input value={profile?.cognome || ""} onChange={(e) => setField("cognome", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <Label>Data di Nascita</Label>
                          <Input type="date" value={profile?.data_nascita || ""} onChange={(e) => setField("data_nascita", e.target.value)} />
                        </div>
                        <div>
                          <Label>Luogo di Nascita</Label>
                          <Input value={profile?.luogo_nascita || ""} onChange={(e) => setField("luogo_nascita", e.target.value)} />
                        </div>
                        <div>
                          <Label>Provincia di Nascita</Label>
                          <Input value={profile?.provincia_nascita || ""} onChange={(e) => setField("provincia_nascita", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    {/* Residenza */}
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Residenza</h2>
                      <div className="grid md:grid-cols-4 gap-6 mb-4">
                        <div className="md:col-span-2">
                          <Label>Indirizzo</Label>
                          <Input value={profile?.indirizzo || ""} onChange={(e) => setField("indirizzo", e.target.value)} />
                        </div>
                        <div>
                          <Label>Numero Civico</Label>
                          <Input value={profile?.numero_civico || ""} onChange={(e) => setField("numero_civico", e.target.value)} />
                        </div>
                        <div>
                          <Label>CAP</Label>
                          <Input value={profile?.cap || ""} onChange={(e) => setField("cap", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label>Città</Label>
                          <Input value={profile?.citta || ""} onChange={(e) => setField("citta", e.target.value)} />
                        </div>
                        <div>
                          <Label>Provincia</Label>
                          <Input value={profile?.provincia || ""} onChange={(e) => setField("provincia", e.target.value)} />
                        </div>
                        <div>
                          <Label>Regione</Label>
                          <Input value={profile?.regione || ""} onChange={(e) => setField("regione", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    {/* Contact & Document sections shortened (keep same fields as before) */}
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contatti</h2>
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Email</Label>
                          <Input value={user.email} disabled />
                        </div>
                        <div>
                          <Label>Telefono</Label>
                          <Input value={profile?.telefono || ""} onChange={(e) => setField("telefono", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento d'Identità</h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label>Tipo Documento</Label>
                          <Input value={profile?.documento_tipo || ""} onChange={(e) => setField("documento_tipo", e.target.value)} />
                        </div>
                        <div>
                          <Label>Numero Documento</Label>
                          <Input value={profile?.documento_numero || ""} onChange={(e) => setField("documento_numero", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    <div className="pt-6 flex justify-end">
                      <Button onClick={savePersonalProfile} disabled={savingProfile} className="bg-indigo-600 hover:bg-indigo-700 px-8">
                        {savingProfile ? "Salvataggio..." : "Salva Profilo Personale"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* --- company tab (multi) --- */}
              {activeTab === "company" && (
                <>
                  {(() => {
                    console.log("🔍 Rendering dropdown profili aziendali:", {
                      companyProfilesCount: companyProfiles.length,
                      loadingCompanyList,
                      selectedCompanyId,
                      profiles: companyProfiles,
                    });
                    return null;
                  })()}
                  <div className="mt-4 mb-4 flex items-center gap-3">
                    <Label>Seleziona profilo aziendale</Label>
                    <select value={selectedCompanyId || ""} onChange={(e) => setSelectedCompanyId(e.target.value || null)} className="border rounded px-2 py-1">
                      <option value="">-- Nuovo / Nessuno --</option>
                      {companyProfiles.map((c) => {
                        // Fallback per il nome del profilo
                        const profileName = c.ragione_sociale || c.company_name || c.profile_name || c.id;
                        console.log("🔍 Rendering option profilo:", {
                          id: c.id,
                          ragione_sociale: c.ragione_sociale,
                          company_name: c.company_name,
                          profile_name: c.profile_name,
                          selectedName: profileName,
                        });
                        return (
                          <option key={c.id} value={c.id}>
                            {profileName}
                          </option>
                        );
                      })}
                    </select>
                    {!loadingCompanyList && companyProfiles.length === 0 && (
                      <span className="text-sm text-yellow-600 ml-2">
                        ⚠️ Nessun profilo caricato (verifica console per dettagli)
                      </span>
                    )}

                    <Button onClick={createNewCompanyProfile} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Nuova
                    </Button>

                    {selectedCompanyId && (
                      <Button variant="destructive" onClick={() => deleteCompanyProfile(selectedCompanyId)} className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Elimina
                      </Button>
                    )}
                  </div>

                  <div className="space-y-8 mt-4">
                    {/* Company form */}
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Aziendali</h2>
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Ragione Sociale</Label>
                          <Input value={companyProfile?.ragione_sociale || ""} onChange={(e) => setCompanyField("ragione_sociale", e.target.value)} />
                        </div>
                        <div>
                          <Label>Forma Giuridica</Label>
                          <Input value={companyProfile?.forma_giuridica || ""} onChange={(e) => setCompanyField("forma_giuridica", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Partita IVA</Label>
                          <Input value={companyProfile?.partita_iva || ""} onChange={(e) => setCompanyField("partita_iva", e.target.value)} />
                        </div>
                        <div>
                          <Label>Codice Fiscale</Label>
                          <Input value={companyProfile?.codice_fiscale || ""} onChange={(e) => setCompanyField("codice_fiscale", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Email aziendale</Label>
                          <Input value={companyProfile?.email || ""} onChange={(e) => setCompanyField("email", e.target.value)} />
                        </div>
                        <div>
                          <Label>Telefono</Label>
                          <Input value={companyProfile?.telefono || ""} onChange={(e) => setCompanyField("telefono", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    {/* sede legale, rappresentante, banca, fatturato (same fields as before) */}
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sede Legale</h2>
                      <div className="grid md:grid-cols-4 gap-6 mb-4">
                        <div className="md:col-span-2">
                          <Label>Indirizzo</Label>
                          <Input value={companyProfile?.indirizzo || ""} onChange={(e) => setCompanyField("indirizzo", e.target.value)} />
                        </div>
                        <div>
                          <Label>CAP</Label>
                          <Input value={companyProfile?.cap || ""} onChange={(e) => setCompanyField("cap", e.target.value)} />
                        </div>
                        <div>
                          <Label>Città</Label>
                          <Input value={companyProfile?.citta || ""} onChange={(e) => setCompanyField("citta", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <Label>Provincia</Label>
                          <Input value={companyProfile?.provincia || ""} onChange={(e) => setCompanyField("provincia", e.target.value)} />
                        </div>
                        <div>
                          <Label>Paese</Label>
                          <Input value={companyProfile?.paese || ""} onChange={(e) => setCompanyField("paese", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Rappresentante Legale</h2>
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Nome</Label>
                          <Input value={companyProfile?.rappresentante_nome || ""} onChange={(e) => setCompanyField("rappresentante_nome", e.target.value)} />
                        </div>
                        <div>
                          <Label>Cognome</Label>
                          <Input value={companyProfile?.rappresentante_cognome || ""} onChange={(e) => setCompanyField("rappresentante_cognome", e.target.value)} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label>Codice Fiscale</Label>
                          <Input value={companyProfile?.rappresentante_cf || ""} onChange={(e) => setCompanyField("rappresentante_cf", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Bancari Aziendali</h2>
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <Label>Banca</Label>
                          <Input value={companyProfile?.banca_aziendale || ""} onChange={(e) => setCompanyField("banca_aziendale", e.target.value)} />
                        </div>
                        <div>
                          <Label>IBAN</Label>
                          <Input value={companyProfile?.iban_aziendale || ""} onChange={(e) => setCompanyField("iban_aziendale", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati Economici</h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label>Fatturato Anno Corrente</Label>
                          <Input value={companyProfile?.fatturato_anno_corrente || ""} onChange={(e) => setCompanyField("fatturato_anno_corrente", e.target.value)} />
                        </div>
                      </div>
                    </section>

                    <div className="pt-6 flex justify-end">
                      <Button onClick={saveCompanyProfile} disabled={savingCompany} className="bg-indigo-600 hover:bg-indigo-700 px-8">
                        {savingCompany ? "Salvataggio..." : "Salva Profilo Aziendale"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* documents / billing placeholders */}
              {activeTab === "documents" && (
                <div className="py-10 text-center text-gray-500 text-sm">Qui vedrai l’elenco dei documenti salvati collegati al tuo profilo.</div>
              )}
              {activeTab === "billing" && (
                <div className="py-10 text-center text-gray-500 text-sm">Questa sezione sarà disponibile a breve (gestione abbonamento).</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

