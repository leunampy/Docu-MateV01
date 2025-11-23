import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { profileApi, companyApi, documentsApi } from "@/api/profileApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, User, FileText, CreditCard, Plus } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [docList, setDocList] = useState([]);
  const [activeTab, setActiveTab] = useState("personale");
  const [saving, setSaving] = useState(false);

  // 🔹 Carica utente loggato
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    loadUser();
  }, []);

  // 🔹 Carica dati da Supabase
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const prof = await profileApi.getUserProfile(user.id);
      setProfile(prof || {});
      const comps = await companyApi.getCompanies(user.id);
      setCompanies(comps || []);
      const docs = await documentsApi.getDocuments(user.id);
      setDocList(docs || []);
    };
    fetchData();
  }, [user]);

  // 🔹 Salva profilo personale
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const saved = await profileApi.saveUserProfile(user.id, profile);
      setProfile(saved);
      alert("✅ Profilo salvato con successo!");
    } catch (err) {
      console.error(err);
      alert("Errore nel salvataggio del profilo.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Salva o crea azienda
  const handleSaveCompany = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const saved = await companyApi.saveCompany(user.id, selectedCompany);
      setSelectedCompany(saved);
      const refreshed = await companyApi.getCompanies(user.id);
      setCompanies(refreshed);
      alert("✅ Dati aziendali salvati!");
    } catch (err) {
      console.error(err);
      alert("Errore nel salvataggio dei dati aziendali.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Il Mio Profilo</h1>
        <p className="text-gray-600 mb-10">
          Gestisci i tuoi dati personali e aziendali
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-md border border-gray-200/50">
              <CardContent className="flex flex-col items-center py-8">
                <Avatar className="w-20 h-20 mb-4 bg-indigo-100">
                  <AvatarFallback className="text-indigo-700 font-semibold">
                    {initials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-semibold text-lg text-gray-900">
                  {profile?.nome
                    ? `${profile.nome} ${profile.cognome}`
                    : user?.email?.split("@")[0]}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="mt-2 px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  Gratuito
                </span>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-200/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Documenti Generati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-gray-700">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span>Totale</span>
                  </div>
                  <span className="font-semibold text-indigo-700">
                    {docList.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-3">
            <Card className="shadow-md border border-gray-200/50">
              <CardContent className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-8">
                    <TabsTrigger value="personale">
                      <User className="w-4 h-4 mr-2" /> Personale
                    </TabsTrigger>
                    <TabsTrigger value="aziendale">
                      <Building2 className="w-4 h-4 mr-2" /> Aziendale
                    </TabsTrigger>
                    <TabsTrigger value="documenti">
                      <FileText className="w-4 h-4 mr-2" /> Documenti
                    </TabsTrigger>
                  </TabsList>

                  {/* 🔹 Tab Personale */}
                  <TabsContent value="personale">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Dati Personali
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Nome"
                        value={profile?.nome || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, nome: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Cognome"
                        value={profile?.cognome || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, cognome: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Telefono"
                        value={profile?.telefono || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, telefono: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Codice Fiscale"
                        value={profile?.codice_fiscale || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            codice_fiscale: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {saving ? "Salvataggio..." : "Salva Modifiche"}
                    </Button>
                  </TabsContent>

                  {/* 🔹 Tab Aziendale */}
                  <TabsContent value="aziendale">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Profili Aziendali
                      </h3>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setSelectedCompany({
                            company_name: "",
                            partita_iva: "",
                            codice_fiscale: "",
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" /> Nuovo
                      </Button>
                    </div>

                    <select
                      className="border rounded-lg w-full p-2 mb-4"
                      value={selectedCompany?.id || ""}
                      onChange={(e) =>
                        setSelectedCompany(
                          companies.find((c) => c.id === e.target.value)
                        )
                      }
                    >
                      <option value="">Seleziona azienda...</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}
                        </option>
                      ))}
                    </select>

                    {selectedCompany && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Ragione Sociale"
                            value={selectedCompany.company_name || ""}
                            onChange={(e) =>
                              setSelectedCompany({
                                ...selectedCompany,
                                company_name: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Partita IVA"
                            value={selectedCompany.partita_iva || ""}
                            onChange={(e) =>
                              setSelectedCompany({
                                ...selectedCompany,
                                partita_iva: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Codice Fiscale"
                            value={selectedCompany.codice_fiscale || ""}
                            onChange={(e) =>
                              setSelectedCompany({
                                ...selectedCompany,
                                codice_fiscale: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Città"
                            value={selectedCompany.città || ""}
                            onChange={(e) =>
                              setSelectedCompany({
                                ...selectedCompany,
                                città: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button
                          onClick={handleSaveCompany}
                          disabled={saving}
                          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {saving ? "Salvataggio..." : "Salva Azienda"}
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* 🔹 Tab Documenti */}
                  <TabsContent value="documenti">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Archivio Documenti
                    </h3>
                    {docList.length === 0 ? (
                      <p className="text-gray-600">
                        Nessun documento generato al momento.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {docList.map((doc) => (
                          <li
                            key={doc.id}
                            className="p-3 border rounded-lg flex justify-between items-center hover:bg-slate-50"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {doc.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {doc.type} – {doc.status}
                              </p>
                            </div>
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              Apri
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

