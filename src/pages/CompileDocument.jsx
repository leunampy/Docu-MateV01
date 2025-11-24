// src/pages/CompileDocument.jsx
// Tool completo per compilazione documenti (versione semplificata senza upload server)

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { callAI } from "@/lib/ai";
import UploadStep from "@/components/compile/steps/UploadStep";
import AnalysisStep from "@/components/compile/steps/AnalysisStep";
import CompanyProfileModal from "@/components/compile/CompanyProfileModal";
import PersonalProfileModal from "@/components/compile/PersonalProfileModal";

const STEPS = {
  UPLOAD: 1,
  ANALYSIS: 2,
  SELECT_PROFILE: 3,
  COMPILATION: 4,
  DOWNLOAD: 5,
};

// Funzione per leggere il contenuto dei file con timeout e gestione errori
const readFileContent = async (file, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    console.log("📝 Reading file:", file.name, "Type:", file.type, "Size:", file.size);
    
    const reader = new FileReader();
    let timeoutId;
    
    // Timeout per evitare blocchi infiniti
    timeoutId = setTimeout(() => {
      console.error("⏱️ Timeout reading file:", file.name);
      reader.abort();
      reject(new Error(`Timeout lettura file (${timeout}ms): ${file.name}`));
    }, timeout);
    
    reader.onload = (e) => {
      clearTimeout(timeoutId);
      console.log("✅ FileReader completed for:", file.name);
      resolve(e.target.result);
    };
    
    reader.onerror = (e) => {
      clearTimeout(timeoutId);
      const errorMsg = reader.error?.message || 'Unknown error';
      console.error("❌ FileReader error for:", file.name, errorMsg);
      reject(new Error(`Errore lettura file: ${errorMsg}`));
    };
    
    reader.onabort = () => {
      clearTimeout(timeoutId);
      console.error("⚠️ FileReader aborted for:", file.name);
      reject(new Error('Lettura file interrotta'));
    };
    
    // DOCX e PDF sono binari, usa ArrayBuffer
    if (file.type.includes('word') || file.type.includes('document')) {
      console.log("📄 Reading DOCX as ArrayBuffer");
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'application/pdf') {
      console.log("📄 Reading PDF as ArrayBuffer");
      reader.readAsArrayBuffer(file);
    } else {
      console.log("📄 Reading as text");
      reader.readAsText(file);
    }
  });
};

export default function CompileDocument() {
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [identifiedFields, setIdentifiedFields] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPersonalId, setSelectedPersonalId] = useState('');
  const [profileType, setProfileType] = useState("company");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState(null);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [personalProfiles, setPersonalProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);

  // 🔹 Carica profili aziendali da Supabase
  useEffect(() => {
    console.log("📋 ========== LOAD COMPANY PROFILES ==========");
    console.log("📋 User:", user?.id);
    
    if (!user?.id) {
      console.warn("⚠️ User ID mancante, skip caricamento");
      setLoadingProfiles(false);
      return;
    }

    const loadCompanyProfiles = async () => {
      try {
        console.log("📋 Inizio query company_profiles...");
        const startTime = Date.now();
        
        const { data, error } = await supabase
          .from("company_profiles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        const queryTime = Date.now() - startTime;
        console.log(`📋 Query completata in ${queryTime}ms`);
        console.log("📋 Risultato:", {
          hasData: !!data,
          recordCount: data?.length,
          profiles: data
        });
        
        if (error) {
          console.error("❌ Errore caricamento company_profiles:", error);
          throw error;
        }
        
        setCompanyProfiles(data || []);
        console.log("✅ Company profiles caricati:", data?.length || 0);
        
        // Auto-seleziona il primo profilo se disponibile
        if (data && data.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(data[0].id);
          console.log("✅ Auto-selezionato primo profilo:", data[0].id);
        }
        
      } catch (err) {
        console.error("❌ Errore loadCompanyProfiles:", err);
        setCompanyProfiles([]);
      } finally {
        setLoadingProfiles(false);
      }
    };

    loadCompanyProfiles();
  }, [user?.id, selectedCompanyId]);

  // 🔹 Carica profili personali da Supabase
  useEffect(() => {
    console.log("👤 ========== LOAD PERSONAL PROFILES ==========");
    console.log("👤 User:", user?.id);
    
    if (!user?.id) {
      console.warn("⚠️ User ID mancante, skip caricamento");
      return;
    }

    const loadPersonalProfiles = async () => {
      try {
        console.log("👤 Inizio query user_profiles...");
        const startTime = Date.now();
        
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        const queryTime = Date.now() - startTime;
        console.log(`👤 Query completata in ${queryTime}ms`);
        console.log("👤 Risultato:", {
          hasData: !!data,
          recordCount: data?.length,
          profiles: data
        });
        
        if (error) {
          console.error("❌ Errore caricamento user_profiles:", error);
          throw error;
        }
        
        setPersonalProfiles(data || []);
        console.log("✅ Personal profiles caricati:", data?.length || 0);
        
        // Auto-seleziona il primo profilo se disponibile
        if (data && data.length > 0 && !selectedPersonalId) {
          setSelectedPersonalId(data[0].id);
          console.log("✅ Auto-selezionato primo profilo personale:", data[0].id);
        }
        
        // Imposta anche userProfile per compatibilità
        if (data && data.length > 0) {
          setUserProfile(data[0]);
        }
        
      } catch (err) {
        console.error("❌ Errore loadPersonalProfiles:", err);
        setPersonalProfiles([]);
      }
    };

    loadPersonalProfiles();
  }, [user?.id, selectedPersonalId]);

  // Quando il modal si chiude, ricarica i profili
  const reloadProfiles = async () => {
    if (!user?.id) return;
    
    console.log("🔄 Reload profili...");
    
    const { data: companies } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    const { data: personals } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (companies) {
      setCompanyProfiles(companies);
      console.log("✅ Company profiles ricaricati:", companies.length);
    }
    if (personals) {
      setPersonalProfiles(personals);
      if (personals.length > 0) {
        setUserProfile(personals[0]);
      }
      console.log("✅ Personal profiles ricaricati:", personals.length);
    }
  };

  const selectedCompany = companyProfiles.find(c => c.id === selectedCompanyId);

  // Analisi automatica quando si entra nello step ANALYSIS
  useEffect(() => {
    if (currentStep === STEPS.ANALYSIS && uploadedFiles.length > 0 && !extractedText) {
      handleAnalyze();
    }
  }, [currentStep]);

  const handleFileUploaded = (file) => {
    console.log("✅ File added to CompileDocument:", file.name, "Total files:", uploadedFiles.length + 1);
    setUploadedFiles(prev => {
      const newFiles = [...prev, file];
      console.log("📋 Updated uploadedFiles array:", newFiles.map(f => f.name));
      return newFiles;
    });
    setError(null);
  };

  const handleRemoveFile = (index) => {
    console.log("🗑️ Removing file at index:", index);
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      console.log("📋 Updated uploadedFiles array after removal:", newFiles.map(f => f.name));
      return newFiles;
    });
  };

  const handleAnalyze = async () => {
    console.log("🔍 handleAnalyze called with", uploadedFiles.length, "file(s)");
    
    if (uploadedFiles.length === 0) {
      console.warn("⚠️ No files to analyze");
      setError("Carica almeno un file per procedere");
      return;
    }

    setError(null);
    console.log("🚀 Starting analysis process...");

    try {
      // Leggi il contenuto dei file
      console.log("🔍 Starting file analysis for", uploadedFiles.length, "file(s)");
      const fileContents = await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            console.log("⏱️ FileReader started for:", file.name);
            const content = await readFileContent(file);
            
            // Gestisci ArrayBuffer (per DOCX/PDF) e stringhe
            let contentString;
            if (content instanceof ArrayBuffer) {
              console.log("📦 Content is ArrayBuffer, converting to string preview");
              // Per ora, segnala che è binario (in futuro si può estrarre testo con librerie)
              contentString = `[File binario - ${file.name} - Richiede processing con librerie specifiche]`;
            } else {
              contentString = content;
            }
            
            return {
              name: file.name,
              content: contentString,
              type: file.type
            };
          } catch (err) {
            console.error("❌ Errore lettura file:", file.name, err);
            return {
              name: file.name,
              content: `[Errore lettura file: ${err.message}]`,
              type: file.type
            };
          }
        })
      );

      console.log("📝 File contents read:", fileContents.map(f => ({ name: f.name, contentLength: f.content.length })));

      // Estrai testo (versione semplificata)
      const allText = fileContents.map(f => f.content).join('\n\n---\n\n');
      console.log("📄 Total extracted text length:", allText.length);
      setExtractedText(allText);

      // Identifica campi (versione semplificata)
      console.log("🔍 Identifying fields...");
      const fields = identifyFieldsSimple(allText);
      setIdentifiedFields(fields);

      console.log("🎯 Fields identified:", fields.length, fields.map(f => f.label));

      // Passa allo step successivo dopo un breve delay per mostrare il completamento
      setTimeout(() => {
        setCurrentStep(STEPS.SELECT_PROFILE);
      }, 1500);

    } catch (err) {
      console.error("Analysis error:", err);
      setError('Errore durante l\'analisi: ' + err.message);
    }
  };

  const identifyFieldsSimple = (text) => {
    const fields = [];
    let fieldId = 1;

    // Pattern per trovare campi
    const patterns = [
      { regex: /([A-Za-z\s]+):\s*_{3,}/g, type: 'underscore' },
      { regex: /\[([A-Z_]+)\]/g, type: 'bracket' },
      { regex: /__\/__\/____|gg\/mm\/aaaa/gi, type: 'date' },
      { regex: /€\s*_{3,}/g, type: 'money' },
    ];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex);
      while ((match = regex.exec(text)) !== null) {
        const label = match[1] || 'Campo ' + fieldId;
        fields.push({
          id: `field_${fieldId}`,
          label: label.trim(),
          type: pattern.type,
          pattern: match[0],
          position: { index: match.index }
        });
        fieldId++;
      }
    });

    return fields;
  };

  const handleCompile = async () => {
    console.log("🔧 handleCompile called");
    
    if (uploadedFiles.length === 0) {
      console.warn("⚠️ No files to compile");
      setError("Carica almeno un documento per procedere.");
      return;
    }

    if (profileType === "company" && !selectedCompanyId) {
      console.warn("⚠️ No company profile selected");
      setError("Seleziona un profilo aziendale.");
      return;
    }

    if (profileType === "personal" && !selectedPersonalId) {
      console.warn("⚠️ No personal profile selected");
      setError("Seleziona un profilo personale.");
      return;
    }

    console.log("🚀 Starting compilation process...");
    setIsCompiling(true);
    setError(null);
    setCompiledResult(null);

    try {
      // Leggi il contenuto dei file
      console.log("🔍 Starting file compilation for", uploadedFiles.length, "file(s)");
      const fileContents = await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            console.log("⏱️ FileReader started for:", file.name);
            const content = await readFileContent(file);
            
            // Gestisci ArrayBuffer (per DOCX/PDF) e stringhe
            let contentString;
            if (content instanceof ArrayBuffer) {
              console.log("📦 Content is ArrayBuffer, converting to string preview");
              // Per ora, segnala che è binario (in futuro si può estrarre testo con librerie)
              contentString = `[File binario - ${file.name} - Richiede processing con librerie specifiche]`;
            } else {
              contentString = content;
            }
            
            return {
              name: file.name,
              content: contentString
            };
          } catch (err) {
            console.error("❌ Errore lettura file:", file.name, err);
            return {
              name: file.name,
              content: `[Errore lettura file: ${err.message}]`
            };
          }
        })
      );

      // Prepara dati profilo
      let profileData = {};
      if (profileType === "company" && selectedCompany) {
        profileData = { ...selectedCompany };
      } else if (profileType === "personal" && selectedPersonalId) {
        const selectedPersonal = personalProfiles.find(p => p.id === selectedPersonalId);
        if (selectedPersonal) {
          profileData = { ...selectedPersonal };
        }
      } else if (userProfile) {
        profileData = { ...userProfile };
      }

      // Costruisci prompt per AI
      const prompt = `Sei un assistente specializzato nella compilazione automatica di documenti.

Ti sono stati forniti i seguenti documenti da compilare:

${fileContents.map((f, i) => `
${i + 1}. ${f.name}
CONTENUTO:
${f.content}
---
`).join('\n')}

Devi compilare questi documenti utilizzando i seguenti dati del profilo:

${JSON.stringify(profileData, null, 2)}

Campi identificati da compilare:
${identifiedFields.map(f => `- ${f.label} (${f.type})`).join('\n')}

ISTRUZIONI:
1. Sostituisci tutti i placeholder, underscore e campi vuoti con i dati del profilo fornito
2. Mantieni la struttura e formattazione originale del documento
3. Se un dato non è disponibile nel profilo, lascia il campo vuoto o inserisci [DA COMPILARE]
4. Per le date, usa il formato italiano (gg/mm/aaaa)
5. Per gli importi, usa il formato € X.XXX,XX

Genera il documento compilato completo:`;

      console.log("🤖 Calling AI for compilation...");
      console.log("📤 Prompt length:", prompt.length);
      const generatedText = await callAI(prompt);

      if (!generatedText || generatedText.includes("❌ Errore")) {
        console.error("❌ AI compilation failed:", generatedText);
        throw new Error(generatedText || "Errore durante la generazione del documento");
      }

      console.log("✅ AI compilation successful, result length:", generatedText.length);
      setCompiledResult(generatedText);
      setCurrentStep(STEPS.DOWNLOAD);
      console.log("📥 Moved to DOWNLOAD step");

    } catch (err) {
      console.error("Compilation error:", err);
      setError(err.message || "Errore durante la compilazione del documento. Riprova.");
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

  const handleReset = () => {
    setCurrentStep(STEPS.UPLOAD);
    setUploadedFiles([]);
    setExtractedText('');
    setIdentifiedFields([]);
    setSelectedCompanyId('');
    setSelectedPersonalId('');
    setCompiledResult(null);
    setError(null);
  };

  const stepLabels = [
    'Upload',
    'Analisi',
    'Selezione Profilo',
    'Compilazione',
    'Download',
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.UPLOAD:
        return (
          <UploadStep
            onFileUploaded={handleFileUploaded}
            onError={setError}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        );

      case STEPS.ANALYSIS:
        return (
          <AnalysisStep
            uploadedFile={uploadedFiles[0]}
            onAnalysisComplete={(result) => {
              console.log("✅ Analysis step complete");
            }}
            onError={setError}
          />
        );

      case STEPS.SELECT_PROFILE:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Seleziona Profilo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={profileType}
                onValueChange={setProfileType}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company">Profilo Aziendale</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal">Profilo Personale</Label>
                </div>
              </RadioGroup>

              {profileType === "company" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seleziona Azienda</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCompanyModal(true)}
                    >
                      + Crea Nuovo
                    </Button>
                  </div>
                  {loadingProfiles ? (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Caricamento profili aziendali...
                      </AlertDescription>
                    </Alert>
                  ) : companyProfiles.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nessun profilo aziendale disponibile.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <RadioGroup
                      value={selectedCompanyId}
                      onValueChange={(value) => {
                        console.log("📋 Profilo aziendale selezionato:", value);
                        setSelectedCompanyId(value);
                      }}
                    >
                      {companyProfiles.map((company) => {
                        const profileName = company.ragione_sociale || company.company_name || company.profile_name || company.id;
                        return (
                          <div key={company.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={company.id} id={company.id} />
                            <Label htmlFor={company.id}>
                              {profileName}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </div>
              )}

              {profileType === "personal" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seleziona Profilo Personale</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPersonalModal(true)}
                    >
                      + Crea Nuovo
                    </Button>
                  </div>
                  {loadingProfiles ? (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Caricamento profili personali...
                      </AlertDescription>
                    </Alert>
                  ) : personalProfiles.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nessun profilo personale disponibile.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <RadioGroup
                      value={selectedPersonalId}
                      onValueChange={(value) => {
                        console.log("👤 Profilo personale selezionato:", value);
                        setSelectedPersonalId(value);
                        const selected = personalProfiles.find(p => p.id === value);
                        if (selected) {
                          setUserProfile(selected);
                        }
                      }}
                    >
                      {personalProfiles.map((profile) => {
                        const profileName = profile.nome || profile.name || profile.id;
                        return (
                          <div key={profile.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={profile.id} id={profile.id} />
                            <Label htmlFor={profile.id}>
                              {profileName}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </div>
              )}

              {identifiedFields.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Identificati <strong>{identifiedFields.length}</strong> campi da compilare
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case STEPS.COMPILATION:
        return (
          <Card>
            <CardContent className="p-12 text-center">
              {isCompiling ? (
                <>
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-spin" />
                  <p className="text-lg font-medium">Compilazione in corso...</p>
                </>
              ) : (
                <p className="text-gray-600">Pronto per la compilazione</p>
              )}
            </CardContent>
          </Card>
        );

      case STEPS.DOWNLOAD:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Documento Compilato!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Il documento è stato compilato con successo utilizzando i dati del profilo selezionato.
              </p>
              {compiledResult && (
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">{compiledResult.substring(0, 1000)}...</pre>
                </div>
              )}
              <Button
                onClick={downloadCompiledDocument}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Scarica Documento
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Compila Documenti</h1>
          <p className="text-gray-600">Carica e compila automaticamente i tuoi documenti con i dati aziendali</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepLabels.map((label, index) => {
              const stepNum = index + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;

              return (
                <div key={stepNum} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : stepNum}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'font-semibold' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {stepNum < stepLabels.length && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
                </CardContent>
              </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 gap-3">
                                    <Button
                                      variant="outline"
            onClick={currentStep === STEPS.UPLOAD ? handleReset : () => setCurrentStep(currentStep - 1)}
            disabled={isCompiling}
                                    >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === STEPS.UPLOAD ? 'Reset' : 'Indietro'}
                                    </Button>

          {currentStep === STEPS.UPLOAD && uploadedFiles.length > 0 && (
                                <Button
              onClick={() => {
                setCurrentStep(STEPS.ANALYSIS);
                // handleAnalyze verrà chiamato automaticamente quando si entra in ANALYSIS
                setTimeout(() => handleAnalyze(), 100);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Analizza Documenti
              <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                        )}

          {currentStep === STEPS.SELECT_PROFILE && (
              <Button
                onClick={handleCompile}
              disabled={isCompiling || (profileType === "company" && !selectedCompanyId) || (profileType === "personal" && !selectedPersonalId)}
              className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isCompiling ? (
                  <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Compilazione...
                  </>
                ) : (
                  <>
                    Compila Documenti
                  <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
          )}

          {currentStep === STEPS.DOWNLOAD && (
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Compila Altro Documento
                    </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCompanyModal && (
        <CompanyProfileModal
          open={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            reloadProfiles();
          }}
        />
      )}

      {showPersonalModal && (
        <PersonalProfileModal
          open={showPersonalModal}
          onClose={() => {
            setShowPersonalModal(false);
            reloadProfiles();
          }}
        />
      )}
    </div>
  );
}
