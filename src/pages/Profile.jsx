import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newCompany, setNewCompany] = useState({});
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [docList, setDocList] = useState([]);
  const [activeTab, setActiveTab] = useState("personale");
  const [saving, setSaving] = useState(false);

  // 🔹 Carica dati utente
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // profilo personale
        const { data: personal, error: personalError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (personalError) {
          console.error("Errore nel caricamento del profilo personale:", personalError);
        }
        if (personal) setProfile(personal);

        // profili aziendali
        const { data: companyList, error: companyError } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", user.id);
        if (companyError) {
          console.error("Errore nel caricamento dei profili aziendali:", companyError);
        }
        if (companyList) setCompanies(companyList);

        // documenti
        const { data: docs, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (docsError) {
          console.error("Errore nel caricamento dei documenti:", docsError);
        }
        if (docs) setDocList(docs);
      }
    };

    fetchData();
  }, []);

  // 🔹 Salva profilo personale
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert([{ ...profile, user_id: user.id }]);
      if (error) {
        console.error("Errore nel salvataggio del profilo:", error);
        alert("Errore nel salvataggio del profilo");
      } else {
        alert("Profilo salvato con successo!");
      }
    } catch (err) {
      console.error("Errore imprevisto nel salvataggio del profilo:", err);
      alert("Errore nel salvataggio del profilo");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Gestione aziendale
  const handleNewCompany = () => {
    setNewCompany({
      ragione_sociale: "",
      forma_giuridica: "",
      partita_iva: "",
      codice_fiscale: "",
      indirizzo: "",
      citta: "",
      provincia: "",
      cap: "",
      user_id: user.id,
    });
    setSelectedCompany(null);
    setIsEditingCompany(true);
  };

  const handleEditCompany = (company) => {
    setNewCompany(company);
    setSelectedCompany(company);
    setIsEditingCompany(true);
  };

  const handleSaveCompany = async () => {
    if (!newCompany.ragione_sociale) {
      alert("Inserisci la ragione sociale");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_profiles")
        .upsert([{ ...newCompany, user_id: user.id }]);

      if (error) {
        console.error("Errore nel salvataggio dell'azienda:", error);
        alert("Errore nel salvataggio dell'azienda");
        return;
      }

      alert("Profilo aziendale salvato con successo!");
      setIsEditingCompany(false);

      // aggiorna lista aziende
      const { data: updatedCompanies, error: refreshError } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id);
      
      if (refreshError) {
        console.error("Errore nell'aggiornamento della lista aziende:", refreshError);
      } else {
        setCompanies(updatedCompanies || []);
      }
    } catch (err) {
      console.error("Errore imprevisto nel salvataggio dell'azienda:", err);
      alert("Errore nel salvataggio dell'azienda");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Il Mio Profilo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 🔹 Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{user?.email}</CardTitle>
              <p className="text-sm text-gray-500">
                {profile.nome || "Nome non impostato"}
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiche</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Documenti Generati:{" "}
                <span className="font-semibold">{docList.length}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 🔹 Contenuto principale */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="personale">Personale</TabsTrigger>
              <TabsTrigger value="aziendale">Aziendale</TabsTrigger>
              <TabsTrigger value="documenti">Documenti</TabsTrigger>
              <TabsTrigger value="abbonamento">Abbonamento</TabsTrigger>
            </TabsList>

            {/* 🔸 PERSONALE */}
            <TabsContent value="personale">
              <Card>
                <CardHeader>
                  <CardTitle>Dati Personali</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nome"
                    value={profile.nome || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, nome: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Cognome"
                    value={profile.cognome || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, cognome: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Codice Fiscale"
                    value={profile.codice_fiscale || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        codice_fiscale: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Telefono"
                    value={profile.telefono || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, telefono: e.target.value })
                    }
                  />
                  <Button
                    className="col-span-2 mt-4"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🔸 AZIENDALE */}
            <TabsContent value="aziendale">
              <Card>
                <CardHeader>
                  <CardTitle>Gestione Profili Aziendali</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isEditingCompany ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-500">
                          Seleziona un profilo aziendale o creane uno nuovo.
                        </p>
                        <Button
                          onClick={handleNewCompany}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          + Nuovo
                        </Button>
                      </div>
                      {companies.length === 0 ? (
                        <p className="text-gray-500">
                          Nessuna azienda associata.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {companies.map((c) => (
                            <li
                              key={c.id}
                              className="border p-3 rounded-lg hover:bg-gray-50 flex justify-between items-center"
                            >
                              <div>
                                <strong>{c.ragione_sociale}</strong> –{" "}
                                {c.forma_giuridica}
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => handleEditCompany(c)}
                              >
                                Modifica
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        placeholder="Ragione Sociale"
                        value={newCompany.ragione_sociale || ""}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            ragione_sociale: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Forma Giuridica (es. SRL, SPA)"
                        value={newCompany.forma_giuridica || ""}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            forma_giuridica: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Partita IVA"
                        value={newCompany.partita_iva || ""}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            partita_iva: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Codice Fiscale"
                        value={newCompany.codice_fiscale || ""}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            codice_fiscale: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Indirizzo"
                        value={newCompany.indirizzo || ""}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            indirizzo: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Città"
                          value={newCompany.citta || ""}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              citta: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Provincia"
                          value={newCompany.provincia || ""}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              provincia: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="CAP"
                          value={newCompany.cap || ""}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              cap: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button onClick={handleSaveCompany} disabled={saving}>
                          {saving ? "Salvataggio..." : "Salva"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingCompany(false)}
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🔸 DOCUMENTI */}
            <TabsContent value="documenti">
              <Card>
                <CardHeader>
                  <CardTitle>Documenti Generati</CardTitle>
                </CardHeader>
                <CardContent>
                  {docList.length === 0 ? (
                    <p className="text-gray-500">
                      Non hai ancora generato documenti.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {docList.map((doc) => (
                        <li key={doc.id} className="py-2 flex justify-between">
                          <span>{doc.titolo || "Documento senza titolo"}</span>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Apri
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🔸 ABBONAMENTO */}
            <TabsContent value="abbonamento">
              <Card>
                <CardHeader>
                  <CardTitle>Abbonamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Attualmente il tuo piano è:{" "}
                    <strong>{profile.subscription_type || "Gratuito"}</strong>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
