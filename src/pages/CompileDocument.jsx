// src/pages/CompileDocument.jsx
// Tool completo per compilazione documenti (versione semplificata senza upload server)

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { listCompanyProfiles } from "@/api/companyProfilesApi";
import { profileApi } from "@/api/profileApi";
import { callAI } from "@/lib/ai";
import mammoth from "mammoth";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import UploadStep from "@/components/compile/steps/UploadStep";
import AnalysisStep from "@/components/compile/steps/AnalysisStep";

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
  console.log("🔴 DEBUG: CompileDocument component RENDERED");
  
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [identifiedFields, setIdentifiedFields] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [profileType, setProfileType] = useState("company");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log("🔴 DEBUG: isCompiling changed to:", isCompiling);
  }, [isCompiling]);

  // Carica profili aziendali
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: companyProfiles = [] } = useQuery({
    queryKey: ['companyProfiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return listCompanyProfiles(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return profileApi.getUserProfile(user.id);
    },
    enabled: !!user?.id,
  });

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

  // 📖 Estrae testo da DOCX usando mammoth
  const extractTextFromDocx = async (file) => {
    console.log("📖 ========== ESTRAZIONE TESTO DOCX ==========");
    console.log("📖 File:", file.name);

    try {
      // Leggi file come ArrayBuffer
      const arrayBuffer = await readFileContent(file);

      if (!(arrayBuffer instanceof ArrayBuffer)) {
        throw new Error("File deve essere ArrayBuffer");
      }

      console.log("📖 ArrayBuffer ricevuto, size:", arrayBuffer.byteLength);

      // Estrai testo con mammoth
      console.log("📖 Estrazione testo con mammoth...");
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (result.messages && result.messages.length > 0) {
        console.log("⚠️ Mammoth warnings:", result.messages);
      }

      const extractedText = result.value || "";
      console.log("✅ Testo estratto, length:", extractedText.length);
      console.log("📄 Preview:", extractedText.substring(0, 300) + "...");

      return extractedText;
    } catch (err) {
      console.error("❌ Errore estrazione testo:", err);
      throw new Error(`Errore estrazione DOCX: ${err.message}`);
    }
  };

  // 🤖 AI compila il documento identificando campi vuoti
  const compileWithAI = async (extractedText, profileData, fileName) => {
    console.log("🤖 ========== COMPILAZIONE AI ==========");
    console.log("🤖 Testo da compilare, length:", extractedText.length);
    console.log("🤖 Profilo:", profileData.ragione_sociale);

    try {
      const profileSummary = {
        ragione_sociale: profileData.ragione_sociale || null,
        forma_giuridica: profileData.forma_giuridica || null,
        partita_iva: profileData.partita_iva || null,
        codice_fiscale: profileData.codice_fiscale || null,
        indirizzo: profileData.indirizzo || null,
        cap: profileData.cap || null,
        citta: profileData.citta || null,
        provincia: profileData.provincia || null,
        paese: profileData.paese || "Italia",
        email: profileData.email_aziendale || null,
        telefono: profileData.telefono_aziendale || null,
        pec: profileData.pec || null,
        fatturato: profileData.fatturato_anno_corrente || null,
        capitale: profileData.capitale_sociale || null,
        dipendenti: profileData.numero_dipendenti || null,
        rappresentante: profileData.rappresentante_legale || null,
        cf_rappresentante: profileData.cf_rappresentante || null,
        iban: profileData.iban || null,
        data_oggi: new Date().toLocaleDateString("it-IT"),
      };

      const datiDisponibili = Object.entries(profileSummary)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n");

      console.log("📊 Dati disponibili per AI:");
      console.log(datiDisponibili);

      const prompt = `Sei un assistente esperto nella compilazione di documenti amministrativi e legali italiani.

DOCUMENTO DA COMPILARE: ${fileName}

TESTO ESTRATTO DAL DOCUMENTO:
${extractedText}

DATI DEL PROFILO AZIENDALE DISPONIBILI:
${datiDisponibili}

COMPITO:
1. Analizza il testo del documento estratto
2. Identifica TUTTI i campi vuoti che richiedono compilazione, come:
   - Underscore consecutivi: ___________
   - Parentesi quadre vuote: [          ]
   - Spazi dopo etichette tipo "Ragione Sociale: ______"
   - Campi con testo segnaposto tipo "[DA COMPILARE]" o "[INSERIRE]"
3. Per OGNI campo vuoto identificato:
   - Determina quale dato del profilo corrisponde (es: "Ragione Sociale" → usa ragione_sociale)
   - Sostituisci il campo vuoto con il dato corretto dal profilo
   - Se il dato NON è disponibile nel profilo, lascia: [DA COMPILARE]
4. Mantieni IDENTICA la struttura del documento:
   - Stessi paragrafi e interruzioni di riga
   - Stesse intestazioni e numerazioni
   - Stessa formattazione testuale
5. NON aggiungere testo non presente nell'originale
6. NON rimuovere sezioni del documento

REGOLE SPECIFICHE DI MAPPATURA:
- "Ragione Sociale" / "Denominazione" / "Nome azienda" → ragione_sociale
- "Forma Giuridica" / "Tipo società" → forma_giuridica
- "Partita IVA" / "P.IVA" / "P. IVA" → partita_iva
- "Codice Fiscale" / "C.F." / "CF" → codice_fiscale
- "Indirizzo" / "Via" / "Sede legale" → indirizzo
- "CAP" / "Codice postale" → cap
- "Città" / "Comune" / "Località" → citta
- "Provincia" / "Prov." → provincia
- "Paese" / "Stato" / "Nazione" → paese
- "Email" / "E-mail" / "Posta elettronica" → email
- "Telefono" / "Tel." / "Cellulare" → telefono
- "PEC" / "Posta certificata" → pec
- "Data" / "Data odierna" → data_oggi
- "Rappresentante legale" / "Legale rappresentante" → rappresentante
- "IBAN" / "Conto corrente" → iban
- "Fatturato" → fatturato
- "Capitale sociale" / "Capitale" → capitale
- "Numero dipendenti" / "Dipendenti" → dipendenti

IMPORTANTE:
- Preserva TUTTA la struttura originale
- Sostituisci SOLO i campi vuoti identificati
- Non modificare testo già presente
- Mantieni numerazioni, elenchi, sezioni

GENERA ORA IL DOCUMENTO COMPILATO COMPLETO:`;

      console.log("🤖 Chiamata AI, prompt length:", prompt.length);
      const compiledText = await callAI(prompt);

      if (!compiledText || compiledText.includes("❌ Errore")) {
        throw new Error("AI non ha compilato correttamente il documento");
      }

      console.log("✅ AI completato, result length:", compiledText.length);
      return compiledText;
    } catch (err) {
      console.error("❌ Errore compilazione AI:", err);
      throw err;
    }
  };

  // 📦 Genera DOCX formattato da testo compilato
  const generateDocx = async (compiledText, originalFileName) => {
    console.log("📦 ========== GENERAZIONE DOCX ==========");
    console.log("📦 Testo da convertire, length:", compiledText.length);

    try {
      const lines = compiledText.split("\n");
      console.log("📦 Righe totali:", lines.length);

      const paragraphs = lines.map((line) => {
        const trimmedLine = line.trim();

        const isHeading =
          /^[A-ZÀÈÉÌÒÙ\\s]+$/.test(trimmedLine) &&
          trimmedLine.length > 3 &&
          trimmedLine.length < 100;
        const isSectionNumber = /^[0-9]+\\./.test(trimmedLine);

        if (trimmedLine.length === 0) {
          return new Paragraph({ text: "" });
        }

        if (isHeading) {
          return new Paragraph({
            text: trimmedLine,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          });
        }

        if (isSectionNumber) {
          return new Paragraph({
            text: trimmedLine,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          });
        }

        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        });
      });

      console.log("📦 Paragrafi creati:", paragraphs.length);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      console.log("📦 Documento docx creato");

      const blob = await Packer.toBlob(doc);
      console.log("✅ Blob generato, size:", blob.size, "bytes");

      return blob;
    } catch (err) {
      console.error("❌ Errore generazione DOCX:", err);
      throw new Error(`Errore generazione DOCX: ${err.message}`);
    }
  };

  const handleCompile = async () => {
    console.log("🔴 DEBUG: ========================================");
    console.log("🔴 DEBUG: handleCompile CHIAMATO!");
    console.log("🔴 DEBUG: Timestamp:", new Date().toISOString());
    console.log("🔴 DEBUG: uploadedFiles:", uploadedFiles);
    console.log("🔴 DEBUG: uploadedFiles.length:", uploadedFiles.length);
    console.log("🔴 DEBUG: profileType:", profileType);
    console.log("🔴 DEBUG: selectedCompanyId:", selectedCompanyId);
    console.log("🔴 DEBUG: selectedCompany:", selectedCompany);
    console.log("🔴 DEBUG: isCompiling:", isCompiling);
    console.log("🔴 DEBUG: ========================================");
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

    console.log("🚀 Starting compilation process...");
    console.log("🔴 DEBUG: setIsCompiling(true) - START COMPILATION");
    setIsCompiling(true);
    setError(null);
    setCompiledResult(null);

    try {
      // Prepara dati profilo
      let profileData = {};
      if (profileType === "company" && selectedCompany) {
        profileData = { ...selectedCompany };
      } else if (userProfile) {
        profileData = { ...userProfile };
      }

      console.log("🚀 ========== SISTEMA UNIVERSALE AI ==========");

      const file = uploadedFiles[0];
      console.log("📄 File:", file.name);
      console.log("📊 Profilo:", profileData.ragione_sociale);

      // FASE 1: Estrazione testo da DOCX
      console.log("🔄 FASE 1: Estrazione testo...");
      const extractedText = await extractTextFromDocx(file);

      // FASE 2: Compilazione intelligente con AI
      console.log("🔄 FASE 2: Compilazione AI...");
      const compiledText = await compileWithAI(extractedText, profileData, file.name);

      // FASE 3: Generazione DOCX formattato
      console.log("🔄 FASE 3: Generazione DOCX...");
      const compiledBlob = await generateDocx(compiledText, file.name);

      console.log("✅ Sistema universale completato");
      console.log("📦 Blob finale, size:", compiledBlob.size, "bytes");

      setCompiledResult(compiledBlob);
      setCurrentStep(STEPS.DOWNLOAD);
      console.log("📥 Passaggio a DOWNLOAD");

    } catch (err) {
      console.error("Compilation error:", err);
      setError(err.message || "Errore durante la compilazione del documento. Riprova.");
    } finally {
      console.log("🔴 DEBUG: setIsCompiling(false) - END COMPILATION");
      setIsCompiling(false);
    }
  };

  const downloadCompiledDocument = () => {
    if (!compiledResult) {
      alert("Nessun documento da scaricare");
      return;
    }

    try {
      const originalName =
        uploadedFiles[0]?.name.replace(/\.[^/.]+$/, "") || "documento";
      const filename = `${originalName}_compilato_${Date.now()}.docx`;

      console.log("📥 Download:", filename);

      const url = window.URL.createObjectURL(compiledResult);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log("✅ Download completato");
      }, 100);
    } catch (err) {
      console.error("❌ Errore download:", err);
      alert("Errore download");
    }
  };

  const handleReset = () => {
    setCurrentStep(STEPS.UPLOAD);
    setUploadedFiles([]);
    setExtractedText('');
    setIdentifiedFields([]);
    setSelectedCompanyId('');
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
                  <Label>Seleziona Azienda</Label>
                  {companyProfiles.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nessun profilo aziendale disponibile. Crea un profilo dalla pagina Profilo Aziendale.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={selectedCompanyId}
                      onValueChange={(value) => {
                        console.log("📋 Profilo aziendale selezionato:", value);
                        setSelectedCompanyId(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona un'azienda..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companyProfiles.map((company) => {
                          const profileName = company.ragione_sociale || company.company_name || company.profile_name || company.id;
                          return (
                            <SelectItem key={company.id} value={company.id}>
                              {profileName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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
                  {compiledResult instanceof Blob ? (
                    <p className="text-sm text-gray-600">
                      Documento DOCX compilato ({Math.round(compiledResult.size / 1024)} KB)
                    </p>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap">{compiledResult.substring(0, 1000)}...</pre>
                  )}
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
                onClick={() => {
                  console.log("🔴 DEBUG: ========================================");
                  console.log("🔴 DEBUG: BOTTONE COMPILAZIONE CLICCATO!");
                  console.log("🔴 DEBUG: Timestamp:", new Date().toISOString());
                  console.log("🔴 DEBUG: isCompiling before call:", isCompiling);
                  console.log("🔴 DEBUG: currentStep:", currentStep);
                  console.log("🔴 DEBUG: Calling handleCompile...");
                  console.log("🔴 DEBUG: ========================================");
                  handleCompile();
                }}
              disabled={isCompiling || (profileType === "company" && !selectedCompanyId)}
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
    </div>
  );
}
