import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { callAI } from "@/lib/ai";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, User, Building2, Plus, Loader2, Download, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CompanyProfileModal from "../components/compile/CompanyProfileModal";
import PersonalProfileModal from "../components/compile/PersonalProfileModal";

export default function CompileDocument() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState([]);
  const [profileType, setProfileType] = useState("personal");
  const [personalProfileSource, setPersonalProfileSource] = useState("main");
  const [selectedPersonalId, setSelectedPersonalId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      console.log("🔄 [USER QUERY] Chiamata base44.auth.me()...");
      const result = await base44.auth.me();
      console.log("🔄 [USER QUERY] Risultato:", result);
      console.log("🔄 [USER QUERY] User ID:", result?.id);
      return result;
    },
  });

  const { data: companyProfiles = [], refetch: refetchCompanies, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ['companyProfiles'],
    queryFn: async () => {
      console.log("📋 ========== LOAD COMPANY PROFILES ==========");
      console.log("📋 User disponibile:", user);
      console.log("📋 User ID:", user?.id);
      console.log("📋 Chiamata base44.entities.CompanyProfile.list...");
      const startTime = Date.now();
      try {
        const result = await base44.entities.CompanyProfile.list("-created_date");
        const elapsed = Date.now() - startTime;
        console.log(`📋 Query completata in ${elapsed}ms`);
        console.log("📋 Risultato:", result);
        console.log("📋 Numero profili:", result?.length || 0);
        console.log("📋 ========== LOAD COMPLETATO ==========");
        return result;
      } catch (err) {
        console.error("❌ Errore caricamento profili aziendali:", err);
        throw err;
      }
    },
    initialData: [],
    enabled: !!user?.id,
  });

  const { data: personalProfiles = [], refetch: refetchPersonal, isLoading: personalLoading } = useQuery({
    queryKey: ['personalProfiles'],
    queryFn: async () => {
      console.log("👤 [PERSONAL PROFILES] Caricamento profili personali...");
      try {
        const result = await base44.entities.PersonalDocumentProfile.list("-created_date");
        console.log("👤 [PERSONAL PROFILES] Risultato:", result);
        console.log("👤 [PERSONAL PROFILES] Numero profili:", result?.length || 0);
        return result;
      } catch (err) {
        console.error("❌ Errore caricamento profili personali:", err);
        throw err;
      }
    },
    initialData: [],
    enabled: !!user?.id,
  });

  // Logging dettagliato per debug
  useEffect(() => {
    console.log("🔍 ========== COMPONENTE RENDER ==========");
    console.log("🔍 User:", user);
    console.log("🔍 User ID:", user?.id);
    console.log("🔍 User Loading:", userLoading);
    console.log("🔍 User Error:", userError);
    console.log("🔍 Company Profiles:", companyProfiles);
    console.log("🔍 Company Profiles Length:", companyProfiles?.length);
    console.log("🔍 Company Loading:", companyLoading);
    console.log("🔍 Company Error:", companyError);
    console.log("🔍 Personal Profiles:", personalProfiles);
    console.log("🔍 Personal Profiles Length:", personalProfiles?.length);
    console.log("🔍 Personal Loading:", personalLoading);
    console.log("🔍 Selected Company ID:", selectedCompanyId);
    console.log("🔍 Profile Type:", profileType);
    console.log("🔍 ========================================");
  }, [user, userLoading, userError, companyProfiles, companyLoading, companyError, personalProfiles, personalLoading, selectedCompanyId, profileType]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setUploadedFiles(prev => [...prev, ...files]);
      setUploadedFileUrls(prev => [...prev, ...urls]);
    } catch (err) {
      setError("Errore durante il caricamento dei file. Riprova.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFileUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompile = async () => {
    if (uploadedFileUrls.length === 0) {
      setError("Carica almeno un documento per procedere.");
      return;
    }

    if (profileType === "personal" && personalProfileSource === "saved" && !selectedPersonalId) {
      setError("Seleziona un profilo personale.");
      return;
    }

    if (profileType === "company" && !selectedCompanyId) {
      setError("Seleziona un profilo aziendale.");
      return;
    }

    setIsCompiling(true);
    setError(null);
    setCompiledResult(null);

    try {
      let profileData = {};
      
      if (profileType === "personal") {
        if (personalProfileSource === "main") {
          // Usa i dati del profilo utente principale
          profileData = {
            nome: user?.nome,
            cognome: user?.cognome,
            codice_fiscale: user?.codice_fiscale,
            data_nascita: user?.data_nascita,
            luogo_nascita: user?.luogo_nascita,
            residenza_indirizzo: user?.residenza_indirizzo,
            residenza_citta: user?.residenza_citta,
            residenza_cap: user?.residenza_cap,
            residenza_provincia: user?.residenza_provincia,
            phone: user?.phone,
            email: user?.email,
            pec: user?.pec,
            tipo_documento: user?.tipo_documento,
            numero_documento: user?.numero_documento,
            iban_personale: user?.iban_personale,
          };
        } else {
          // Usa un profilo personale salvato
          const personal = personalProfiles.find(p => p.id === selectedPersonalId);
          if (personal) {
            profileData = { ...personal };
          }
        }
      } else {
        const company = companyProfiles.find(c => c.id === selectedCompanyId);
        if (company) {
          profileData = { ...company };
        }
      }

      const prompt = `Sei un assistente specializzato nella compilazione automatica di documenti.

Ti sono stati forniti i seguenti documenti da compilare:
${uploadedFiles.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}

Devi compilare questi documenti utilizzando i seguenti dati del profilo ${profileType === "personal" ? "personale" : "aziendale"}:

${JSON.stringify(profileData, null, 2)}

ISTRUZIONI:
1. Analizza attentamente ogni documento caricato
2. Identifica tutti i campi che devono essere compilati (es. _____, [CAMPO], {{campo}}, o spazi vuoti evidenti)
3. Compila automaticamente i campi con i dati del profilo fornito
4. Se un campo richiesto non ha dati corrispondenti nel profilo, lascialo vuoto o indica [DA COMPILARE]
5. Mantieni la formattazione originale del documento
6. Restituisci il documento compilato in formato testo ben formattato

Procedi con la compilazione:`;

      const result = await callAI(prompt);

      setCompiledResult(result);
    } catch (err) {
      setError("Errore durante la compilazione. Riprova.");
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const downloadCompiledDocument = () => {
    if (!compiledResult) return;

    const blob = new Blob([compiledResult], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documento_compilato_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setUploadedFileUrls([]);
    setCompiledResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Compila Documenti</h1>
          <p className="text-gray-600">Carica i tuoi documenti e compilali automaticamente con i tuoi dati</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {!compiledResult ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Carica Documenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                          <p className="text-gray-600">Caricamento in corso...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            Clicca per caricare o trascina i file qui
                          </p>
                          <p className="text-sm text-gray-500">
                            PDF, DOC, DOCX, TXT (Puoi caricare più file)
                          </p>
                        </>
                      )}
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">File Caricati:</Label>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-indigo-600" />
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Rimuovi
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Seleziona Profilo per Compilazione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={profileType} onValueChange={setProfileType}>
                    {/* Dati Personali */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="personal" id="personal" />
                        <Label htmlFor="personal" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            <div>
                              <p className="font-medium">Dati Personali</p>
                              <p className="text-sm text-gray-600">
                                Usa i tuoi dati personali o profili salvati
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* Expanded Personal Options */}
                      <AnimatePresence>
                        {profileType === "personal" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-8 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <RadioGroup value={personalProfileSource} onValueChange={setPersonalProfileSource}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="main" id="main-profile" />
                                  <Label htmlFor="main-profile" className="cursor-pointer">
                                    Usa i Miei Dati Principali
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="saved" id="saved-profile" />
                                  <Label htmlFor="saved-profile" className="cursor-pointer">
                                    Usa un Profilo Salvato
                                  </Label>
                                </div>
                              </RadioGroup>

                              {personalProfileSource === "saved" && (
                                <div className="mt-3 space-y-2">
                                  <Label className="text-sm">Seleziona Profilo Personale</Label>
                                  <div className="flex gap-2">
                                    <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Scegli un profilo..." />
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
                                      onClick={() => setShowPersonalModal(true)}
                                      className="flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Nuovo
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Dati Aziendali */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="company" id="company" />
                        <Label htmlFor="company" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <div>
                              <p className="font-medium">Dati Aziendali</p>
                              <p className="text-sm text-gray-600">
                                Usa i dati di uno dei tuoi profili aziendali
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* Expanded Company Options */}
                      <AnimatePresence>
                        {profileType === "company" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-8 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <Label className="text-sm">Seleziona Profilo Aziendale</Label>

                              {/* Debug Info */}
                              {companyProfiles.length === 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                  ⚠️ <strong>DEBUG:</strong> Nessun profilo aziendale trovato.
                                  {companyLoading && " (Caricamento in corso...)"}
                                  {companyError && ` Errore: ${companyError.message}`}
                                  {!user && " (User non disponibile)"}
                                  <br />
                                  <span className="text-xs text-gray-600">
                                    Controlla la console per dettagli.
                                  </span>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Scegli un'azienda..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {companyProfiles.map((company) => {
                                      console.log("🏢 [RENDER] Company item:", company);
                                      return (
                                        <SelectItem key={company.id} value={company.id}>
                                          {company.profile_name} - {company.company_name}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowCompanyModal(true)}
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Nuovo
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Compile Button */}
              <Button
                onClick={handleCompile}
                disabled={isCompiling || uploadedFileUrls.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 h-14 text-lg"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Compilazione in corso...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Compila Documenti
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Documento Compilato
                    </CardTitle>
                    <Button variant="outline" onClick={resetForm}>
                      Nuovo Documento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border-2 border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                      {compiledResult}
                    </pre>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={downloadCompiledDocument}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Scarica Documento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personal Profile Modal */}
        {showPersonalModal && (
          <PersonalProfileModal
            onClose={() => setShowPersonalModal(false)}
            onSave={() => {
              setShowPersonalModal(false);
              refetchPersonal();
            }}
          />
        )}

        {/* Company Profile Modal */}
        {showCompanyModal && (
          <CompanyProfileModal
            onClose={() => setShowCompanyModal(false)}
            onSave={() => {
              setShowCompanyModal(false);
              refetchCompanies();
            }}
          />
        )}
      </div>
    </div>
  );
}