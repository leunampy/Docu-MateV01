
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { User, Building2, FileText, CreditCard, Save, Download, Calendar, CheckCircle, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CompanyProfileModal from "../components/compile/CompanyProfileModal";
import PersonalProfileModal from "../components/compile/PersonalProfileModal";

export default function Profile() {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Company profile states
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompanyProfile, setEditingCompanyProfile] = useState(null);
  
  // Personal profile states
  const [personalProfileSource, setPersonalProfileSource] = useState("main"); // "main" or "saved"
  const [selectedPersonalId, setSelectedPersonalId] = useState("");
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [editingPersonalProfile, setEditingPersonalProfile] = useState(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['userDocuments'],
    queryFn: () => base44.entities.Document.list("-created_date"),
    initialData: [],
  });

  const { data: companyProfiles = [], refetch: refetchCompanies } = useQuery({
    queryKey: ['companyProfiles'],
    queryFn: () => base44.entities.CompanyProfile.list("-created_date"),
    initialData: [],
  });

  const { data: personalProfiles = [], refetch: refetchPersonal } = useQuery({
    queryKey: ['personalProfiles'],
    queryFn: () => base44.entities.PersonalDocumentProfile.list("-created_date"),
    initialData: [],
  });

  const [profileData, setProfileData] = useState({});
  const [companyData, setCompanyData] = useState({});

  useEffect(() => {
    if (personalProfileSource === "saved" && selectedPersonalId && personalProfiles.length > 0) {
      const personal = personalProfiles.find(p => p.id === selectedPersonalId);
      if (personal) {
        setProfileData(personal);
      } else {
        setProfileData({}); // Clear profile data if selected profile not found
      }
    } else if (personalProfileSource === "main" && user) {
      setProfileData(user);
    } else if (personalProfileSource === "saved" && !selectedPersonalId) {
      setProfileData({}); // Clear profileData if 'saved' is selected but no specific profile is chosen
    }
  }, [personalProfileSource, selectedPersonalId, personalProfiles, user]);

  useEffect(() => {
    if (selectedCompanyId && companyProfiles.length > 0) {
      const company = companyProfiles.find(c => c.id === selectedCompanyId);
      if (company) {
        setCompanyData(company);
      }
    } else {
      setCompanyData({}); // Clear company data if no profile is selected
    }
  }, [selectedCompanyId, companyProfiles]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      if (personalProfileSource === "saved" && selectedPersonalId) {
        return base44.entities.PersonalDocumentProfile.update(selectedPersonalId, data);
      }
      return base44.auth.updateMe(data);
    },
    onSuccess: () => {
      if (personalProfileSource === "saved") {
        queryClient.invalidateQueries({ queryKey: ['personalProfiles'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfiles'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSaveCompany = () => {
    if (selectedCompanyId) {
      updateCompanyMutation.mutate({ id: selectedCompanyId, data: companyData });
    }
  };

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewCompany = () => {
    setEditingCompanyProfile(null);
    setShowCompanyModal(true);
  };

  const handleEditCompany = () => {
    if (selectedCompanyId) {
      const company = companyProfiles.find(c => c.id === selectedCompanyId);
      setEditingCompanyProfile(company);
      setShowCompanyModal(true);
    }
  };

  const handleNewPersonal = () => {
    setEditingPersonalProfile(null);
    setShowPersonalModal(true);
  };

  const handleEditPersonal = () => {
    if (selectedPersonalId) {
      const personal = personalProfiles.find(p => p.id === selectedPersonalId);
      setEditingPersonalProfile(personal);
      setShowPersonalModal(true);
    }
  };

  const downloadDocument = (doc) => {
    const blob = new Blob([doc.generated_text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.document_type}_${doc.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  const getSubscriptionColor = (type) => {
    switch(type) {
      case "premium": return "bg-gradient-to-r from-amber-400 to-orange-400 text-white";
      case "registered": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getSubscriptionLabel = (type) => {
    switch(type) {
      case "premium": return "⭐ Premium";
      case "registered": return "Registrato";
      default: return "Gratuito";
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Il Mio Profilo</h1>
          <p className="text-gray-600">Gestisci i tuoi dati personali e aziendali</p>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Modifiche salvate con successo!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">
                      {(profileData.nome?.[0] || "") + (profileData.cognome?.[0] || "") || 
                       user?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {profileData.nome && profileData.cognome 
                      ? `${profileData.nome} ${profileData.cognome}`
                      : user?.full_name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">{user?.email}</p>
                  <Badge className={`${getSubscriptionColor(user?.subscription_type)}`}>
                    {getSubscriptionLabel(user?.subscription_type)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Documenti Generati</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {user?.documents_generated || 0}
                  </span>
                </div>
                {user?.subscription_type === "free" && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-600 mb-2">
                      Documenti gratuiti rimanenti:
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full ${
                            i <= (3 - (user?.documents_generated || 0))
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <Tabs defaultValue="personal" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">
                      <User className="w-4 h-4 mr-2" />
                      Personale
                    </TabsTrigger>
                    <TabsTrigger value="company">
                      <Building2 className="w-4 h-4 mr-2" />
                      Aziendale
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                      <FileText className="w-4 h-4 mr-2" />
                      Documenti
                    </TabsTrigger>
                    <TabsTrigger value="subscription">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Abbonamento
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  {/* Personal Tab */}
                  <TabsContent value="personal" className="space-y-6">
                    {/* Personal Profile Selection */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600" />
                        Gestione Profili Personali
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Scegli se modificare i tuoi dati principali o un profilo salvato
                      </p>
                      
                      <RadioGroup value={personalProfileSource} onValueChange={setPersonalProfileSource} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="main" id="main-profile" />
                          <Label htmlFor="main-profile" className="cursor-pointer flex-1">
                            Usa i Miei Dati Principali
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="saved" id="saved-profile" />
                          <Label htmlFor="saved-profile" className="cursor-pointer flex-1">
                            Usa un Profilo Salvato
                          </Label>
                        </div>
                      </RadioGroup>

                      {personalProfileSource === "saved" && (
                        <div className="mt-4 flex gap-2">
                          <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Seleziona un profilo personale..." />
                            </SelectTrigger>
                            <SelectContent>
                              {personalProfiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.profile_name} - {profile.nome} {profile.cognome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            onClick={handleNewPersonal}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Nuovo
                          </Button>
                          {selectedPersonalId && (
                            <Button
                              variant="outline"
                              onClick={handleEditPersonal}
                              className="flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Modifica
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {personalProfileSource === "saved" && !selectedPersonalId ? (
                      <Alert className="bg-gray-50">
                        <AlertDescription className="text-gray-700">
                          Seleziona un profilo personale dal menu a tendina per visualizzare e modificare i dati, 
                          oppure clicca su "Nuovo" per creare un nuovo profilo personale.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Dati Anagrafici</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Nome</Label>
                              <Input
                                value={profileData.nome || ""}
                                onChange={(e) => handleChange("nome", e.target.value)}
                                placeholder="Nome"
                              />
                            </div>
                            <div>
                              <Label>Cognome</Label>
                              <Input
                                value={profileData.cognome || ""}
                                onChange={(e) => handleChange("cognome", e.target.value)}
                                placeholder="Cognome"
                              />
                            </div>
                            <div>
                              <Label>Data di Nascita</Label>
                              <Input
                                type="date"
                                value={profileData.data_nascita || ""}
                                onChange={(e) => handleChange("data_nascita", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Luogo di Nascita</Label>
                              <Input
                                value={profileData.luogo_nascita || ""}
                                onChange={(e) => handleChange("luogo_nascita", e.target.value)}
                                placeholder="Città"
                              />
                            </div>
                            <div>
                              <Label>Provincia di Nascita</Label>
                              <Input
                                value={profileData.provincia_nascita || ""}
                                onChange={(e) => handleChange("provincia_nascita", e.target.value)}
                                placeholder="PR"
                              />
                            </div>
                            <div>
                              <Label>Codice Fiscale</Label>
                              <Input
                                value={profileData.codice_fiscale || ""}
                                onChange={(e) => handleChange("codice_fiscale", e.target.value.toUpperCase())}
                                placeholder="RSSMRA80A01H501Z"
                              />
                            </div>
                            <div>
                              <Label>Sesso</Label>
                              <Select
                                value={profileData.sesso || ""}
                                onValueChange={(value) => handleChange("sesso", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Maschile</SelectItem>
                                  <SelectItem value="F">Femminile</SelectItem>
                                  <SelectItem value="Altro">Altro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Cittadinanza</Label>
                              <Input
                                value={profileData.cittadinanza || ""}
                                onChange={(e) => handleChange("cittadinanza", e.target.value)}
                                placeholder="Italiana"
                              />
                            </div>
                            <div>
                              <Label>Stato Civile</Label>
                              <Select
                                value={profileData.stato_civile || ""}
                                onValueChange={(value) => handleChange("stato_civile", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Celibe/Nubile">Celibe/Nubile</SelectItem>
                                  <SelectItem value="Coniugato/a">Coniugato/a</SelectItem>
                                  <SelectItem value="Divorziato/a">Divorziato/a</SelectItem>
                                  <SelectItem value="Vedovo/a">Vedovo/a</SelectItem>
                                  <SelectItem value="Separato/a">Separato/a</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Regime Patrimoniale</Label>
                              <Select
                                value={profileData.regime_patrimoniale || ""}
                                onValueChange={(value) => handleChange("regime_patrimoniale", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Comunione dei beni">Comunione dei beni</SelectItem>
                                  <SelectItem value="Separazione dei beni">Separazione dei beni</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Residenza</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Indirizzo</Label>
                              <Input
                                value={profileData.residenza_indirizzo || ""}
                                onChange={(e) => handleChange("residenza_indirizzo", e.target.value)}
                                placeholder="Via/Piazza"
                              />
                            </div>
                            <div>
                              <Label>Numero Civico</Label>
                              <Input
                                value={profileData.residenza_numero_civico || ""}
                                onChange={(e) => handleChange("residenza_numero_civico", e.target.value)}
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <Label>CAP</Label>
                              <Input
                                value={profileData.residenza_cap || ""}
                                onChange={(e) => handleChange("residenza_cap", e.target.value)}
                                placeholder="00100"
                              />
                            </div>
                            <div>
                              <Label>Città</Label>
                              <Input
                                value={profileData.residenza_citta || ""}
                                onChange={(e) => handleChange("residenza_citta", e.target.value)}
                                placeholder="Roma"
                              />
                            </div>
                            <div>
                              <Label>Provincia</Label>
                              <Input
                                value={profileData.residenza_provincia || ""}
                                onChange={(e) => handleChange("residenza_provincia", e.target.value)}
                                placeholder="RM"
                              />
                            </div>
                            <div>
                              <Label>Regione</Label>
                              <Input
                                value={profileData.residenza_regione || ""}
                                onChange={(e) => handleChange("residenza_regione", e.target.value)}
                                placeholder="Lazio"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-2">Domicilio</h3>
                          <p className="text-sm text-gray-600 mb-4">Compila solo se diverso dalla residenza</p>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Indirizzo</Label>
                              <Input
                                value={profileData.domicilio_indirizzo || ""}
                                onChange={(e) => handleChange("domicilio_indirizzo", e.target.value)}
                                placeholder="Via/Piazza"
                              />
                            </div>
                            <div>
                              <Label>Numero Civico</Label>
                              <Input
                                value={profileData.domicilio_numero_civico || ""}
                                onChange={(e) => handleChange("domicilio_numero_civico", e.target.value)}
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <Label>CAP</Label>
                              <Input
                                value={profileData.domicilio_cap || ""}
                                onChange={(e) => handleChange("domicilio_cap", e.target.value)}
                                placeholder="00100"
                              />
                            </div>
                            <div>
                              <Label>Città</Label>
                              <Input
                                value={profileData.domicilio_citta || ""}
                                onChange={(e) => handleChange("domicilio_citta", e.target.value)}
                                placeholder="Milano"
                              />
                            </div>
                            <div>
                              <Label>Provincia</Label>
                              <Input
                                value={profileData.domicilio_provincia || ""}
                                onChange={(e) => handleChange("domicilio_provincia", e.target.value)}
                                placeholder="MI"
                              />
                            </div>
                            <div>
                              <Label>Regione</Label>
                              <Input
                                value={profileData.domicilio_regione || ""}
                                onChange={(e) => handleChange("domicilio_regione", e.target.value)}
                                placeholder="Lombardia"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Contatti</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Email</Label>
                              <Input
                                value={personalProfileSource === "main" ? user?.email || "" : profileData.email || ""}
                                onChange={(e) => handleChange("email", e.target.value)}
                                disabled={personalProfileSource === "main"}
                                className={personalProfileSource === "main" ? "bg-gray-50" : ""}
                              />
                              {personalProfileSource === "main" && (
                                <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
                              )}
                            </div>
                            <div>
                              <Label>Cellulare</Label>
                              <Input
                                value={profileData.phone || ""}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="+39 ..."
                              />
                            </div>
                            <div>
                              <Label>Telefono Fisso</Label>
                              <Input
                                value={profileData.telefono_fisso || ""}
                                onChange={(e) => handleChange("telefono_fisso", e.target.value)}
                                placeholder="+39 ..."
                              />
                            </div>
                            <div>
                              <Label>PEC</Label>
                              <Input
                                value={profileData.pec || ""}
                                onChange={(e) => handleChange("pec", e.target.value)}
                                placeholder="nome@pec.it"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Documento d'Identità</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Tipo Documento</Label>
                              <Select
                                value={profileData.tipo_documento || ""}
                                onValueChange={(value) => handleChange("tipo_documento", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Carta d'Identità">Carta d'Identità</SelectItem>
                                  <SelectItem value="Patente">Patente</SelectItem>
                                  <SelectItem value="Passaporto">Passaporto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Numero Documento</Label>
                              <Input
                                value={profileData.numero_documento || ""}
                                onChange={(e) => handleChange("numero_documento", e.target.value)}
                                placeholder="Numero"
                              />
                            </div>
                            <div>
                              <Label>Rilasciato da</Label>
                              <Input
                                value={profileData.rilasciato_da || ""}
                                onChange={(e) => handleChange("rilasciato_da", e.target.value)}
                                placeholder="Es. Comune di Roma"
                              />
                            </div>
                            <div>
                              <Label>Luogo di Rilascio</Label>
                              <Input
                                value={profileData.luogo_rilascio || ""}
                                onChange={(e) => handleChange("luogo_rilascio", e.target.value)}
                                placeholder="Città"
                              />
                            </div>
                            <div>
                              <Label>Data di Rilascio</Label>
                              <Input
                                type="date"
                                value={profileData.data_rilascio || ""}
                                onChange={(e) => handleChange("data_rilascio", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Data di Scadenza</Label>
                              <Input
                                type="date"
                                value={profileData.data_scadenza_documento || ""}
                                onChange={(e) => handleChange("data_scadenza_documento", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Dati Bancari Personali</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>IBAN</Label>
                              <Input
                                value={profileData.iban_personale || ""}
                                onChange={(e) => handleChange("iban_personale", e.target.value.toUpperCase())}
                                placeholder="IT..."
                              />
                            </div>
                            <div>
                              <Label>Banca</Label>
                              <Input
                                value={profileData.banca_personale || ""}
                                onChange={(e) => handleChange("banca_personale", e.target.value)}
                                placeholder="Nome banca"
                              />
                            </div>
                            <div>
                              <Label>Filiale</Label>
                              <Input
                                value={profileData.filiale_personale || ""}
                                onChange={(e) => handleChange("filiale_personale", e.target.value)}
                                placeholder="Nome filiale"
                              />
                            </div>
                            <div>
                              <Label>Intestatario</Label>
                              <Input
                                value={profileData.intestatario_conto || ""}
                                onChange={(e) => handleChange("intestatario_conto", e.target.value)}
                                placeholder="Nome e cognome"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Dati Professionali</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Qualifica Professionale</Label>
                              <Input
                                value={profileData.qualifica_professionale || ""}
                                onChange={(e) => handleChange("qualifica_professionale", e.target.value)}
                                placeholder="Es. Avvocato, Ingegnere"
                              />
                            </div>
                            <div>
                              <Label>Ordine Professionale</Label>
                              <Input
                                value={profileData.ordine_professionale || ""}
                                onChange={(e) => handleChange("ordine_professionale", e.target.value)}
                                placeholder="Es. Ordine degli Avvocati"
                              />
                            </div>
                            <div>
                              <Label>Numero Iscrizione</Label>
                              <Input
                                value={profileData.numero_iscrizione_ordine || ""}
                                onChange={(e) => handleChange("numero_iscrizione_ordine", e.target.value)}
                                placeholder="Numero"
                              />
                            </div>
                            <div>
                              <Label>Data Iscrizione</Label>
                              <Input
                                type="date"
                                value={profileData.data_iscrizione_ordine || ""}
                                onChange={(e) => handleChange("data_iscrizione_ordine", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Provincia Ordine</Label>
                              <Input
                                value={profileData.provincia_ordine || ""}
                                onChange={(e) => handleChange("provincia_ordine", e.target.value)}
                                placeholder="RM"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salva Modifiche
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* Company Tab */}
                  <TabsContent value="company" className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        Gestione Profili Aziendali
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Seleziona un profilo aziendale esistente per modificarlo o creane uno nuovo
                      </p>
                      <div className="flex gap-2">
                        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleziona un profilo aziendale..." />
                          </SelectTrigger>
                          <SelectContent>
                            {companyProfiles.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.profile_name} - {company.company_name || "Senza nome"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={handleNewCompany}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Nuovo
                        </Button>
                        {selectedCompanyId && (
                          <Button
                            variant="outline"
                            onClick={handleEditCompany}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Modifica
                          </Button>
                        )}
                      </div>
                    </div>

                    {!selectedCompanyId ? (
                      <Alert className="bg-gray-50">
                        <AlertDescription className="text-gray-700">
                          Seleziona un profilo aziendale dal menu a tendina per visualizzare e modificare i dati, 
                          oppure clicca su "Nuovo" per creare un nuovo profilo aziendale.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Separator />

                        {/* Company Data Form */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Dati Societari</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Ragione Sociale</Label>
                              <Input
                                value={companyData.company_name || ""}
                                onChange={(e) => handleCompanyChange("company_name", e.target.value)}
                                placeholder="Nome Azienda S.r.l."
                              />
                            </div>
                            <div>
                              <Label>Forma Giuridica</Label>
                              <Select
                                value={companyData.forma_giuridica || ""}
                                onValueChange={(value) => handleCompanyChange("forma_giuridica", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="S.r.l.">S.r.l.</SelectItem>
                                  <SelectItem value="S.p.A.">S.p.A.</SelectItem>
                                  <SelectItem value="S.a.s.">S.a.s.</SelectItem>
                                  <SelectItem value="S.n.c.">S.n.c.</SelectItem>
                                  <SelectItem value="Ditta Individuale">Ditta Individuale</SelectItem>
                                  <SelectItem value="Società Cooperativa">Società Cooperativa</SelectItem>
                                  <SelectItem value="Altro">Altro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Partita IVA</Label>
                              <Input
                                value={companyData.company_vat || ""}
                                onChange={(e) => handleCompanyChange("company_vat", e.target.value)}
                                placeholder="IT..."
                              />
                            </div>
                            <div>
                              <Label>Codice Fiscale Aziendale</Label>
                              <Input
                                value={companyData.company_codice_fiscale || ""}
                                onChange={(e) => handleCompanyChange("company_codice_fiscale", e.target.value)}
                                placeholder="Codice fiscale"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Sede Legale</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Indirizzo</Label>
                              <Input
                                value={companyData.company_address || ""}
                                onChange={(e) => handleCompanyChange("company_address", e.target.value)}
                                placeholder="Via/Piazza"
                              />
                            </div>
                            <div>
                              <Label>CAP</Label>
                              <Input
                                value={companyData.sede_legale_cap || ""}
                                onChange={(e) => handleCompanyChange("sede_legale_cap", e.target.value)}
                                placeholder="00100"
                              />
                            </div>
                            <div>
                              <Label>Città</Label>
                              <Input
                                value={companyData.sede_legale_citta || ""}
                                onChange={(e) => handleCompanyChange("sede_legale_citta", e.target.value)}
                                placeholder="Roma"
                              />
                            </div>
                            <div>
                              <Label>Provincia</Label>
                              <Input
                                value={companyData.sede_legale_provincia || ""}
                                onChange={(e) => handleCompanyChange("sede_legale_provincia", e.target.value)}
                                placeholder="RM"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Contatti Aziendali</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Telefono</Label>
                              <Input
                                value={companyData.company_phone || ""}
                                onChange={(e) => handleCompanyChange("company_phone", e.target.value)}
                                placeholder="+39 ..."
                              />
                            </div>
                            <div>
                              <Label>Email Aziendale</Label>
                              <Input
                                value={companyData.company_email || ""}
                                onChange={(e) => handleCompanyChange("company_email", e.target.value)}
                                placeholder="info@azienda.it"
                              />
                            </div>
                            <div>
                              <Label>PEC Aziendale</Label>
                              <Input
                                value={companyData.company_pec || ""}
                                onChange={(e) => handleCompanyChange("company_pec", e.target.value)}
                                placeholder="azienda@pec.it"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleSaveCompany}
                          disabled={updateCompanyMutation.isPending}
                          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salva Modifiche Profilo Aziendale
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="space-y-4">
                    {docsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20" />
                        ))}
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Nessun documento generato ancora</p>
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {doc.document_type.replace(/_/g, " ").toUpperCase()}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(doc.created_date), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(doc)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Scarica
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Subscription Tab */}
                  <TabsContent value="subscription" className="space-y-6">
                    <div className="text-center py-8">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        user?.subscription_type === "premium" 
                          ? "bg-gradient-to-br from-amber-400 to-orange-400"
                          : "bg-gray-200"
                      }`}>
                        <CreditCard className={`w-8 h-8 ${
                          user?.subscription_type === "premium" ? "text-white" : "text-gray-600"
                        }`} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Piano {getSubscriptionLabel(user?.subscription_type)}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {user?.subscription_type === "premium" 
                          ? "Accesso illimitato a tutte le funzionalità"
                          : user?.subscription_type === "registered"
                          ? "Salva i tuoi documenti e profilo aziendale"
                          : "Genera fino a 3 documenti gratuitamente"}
                      </p>

                      {user?.subscription_type !== "premium" && (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                            <h4 className="font-bold text-lg mb-2">Passa a Premium</h4>
                            <ul className="text-left space-y-2 mb-4">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span>Documenti illimitati</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span>Compilazione automatica documenti</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span>Supporto prioritario</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span>Template personalizzati</span>
                              </li>
                            </ul>
                            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                              Aggiorna a Premium
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      {/* Company Profile Modal */}
      {showCompanyModal && (
        <CompanyProfileModal
          existingProfile={editingCompanyProfile}
          onClose={() => {
            setShowCompanyModal(false);
            setEditingCompanyProfile(null);
          }}
          onSave={() => {
            setShowCompanyModal(false);
            setEditingCompanyProfile(null);
            refetchCompanies();
          }}
        />
      )}

      {/* Personal Profile Modal */}
      {showPersonalModal && (
        <PersonalProfileModal
          existingProfile={editingPersonalProfile}
          onClose={() => {
            setShowPersonalModal(false);
            setEditingPersonalProfile(null);
          }}
          onSave={() => {
            setShowPersonalModal(false);
            setEditingPersonalProfile(null);
            refetchPersonal();
          }}
        />
      )}
    </div>
  );
}
