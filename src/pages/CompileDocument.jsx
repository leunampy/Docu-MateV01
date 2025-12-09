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
import { detectAllPatterns, extractLabelFromContext } from "@/lib/patternDetection";
import { analyzeDocumentWithAI } from "@/lib/aiVisionAnalysis";
import mammoth from "mammoth";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import JSZip from "jszip";
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
  const [selectedPersonalId, setSelectedPersonalId] = useState('');
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

  // Query per profili personali (placeholder - da implementare se necessario)
  const { data: personalProfiles = [] } = useQuery({
    queryKey: ['personalProfiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // TODO: Implementare caricamento profili personali se necessario
      return [];
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

  // 🧠 DIZIONARIO SEMANTICO: Mappa etichette documento → campi profilo
  const SEMANTIC_FIELD_DICTIONARY = {
    ragione_sociale: [
      'nome',
      'nome/denominazione',
      'nome / denominazione',
      'denominazione',
      'ragione sociale',
      'nome operatore economico',
      "nome dell'operatore economico",
      'operatore economico',
      'nome azienda',
      'nome società',
      'nome impresa',
      'denominazione sociale',
      'ditta',
      'nome ditta',
    ],
    partita_iva: [
      'partita iva',
      'partita iva, se applicabile',
      'p.iva',
      'p. iva',
      'piva',
      'numero di partita iva',
      'numero partita iva',
      'codice iva',
    ],
    codice_fiscale: [
      'codice fiscale',
      'c.f.',
      'cf',
      'cod. fiscale',
      'numero di identificazione nazionale',
      'altro numero di identificazione nazionale',
    ],
    forma_giuridica: [
      'forma giuridica',
      "forma giuridica dell'impresa",
      'tipo società',
      'natura giuridica',
    ],
    indirizzo: [
      'indirizzo',
      'indirizzo postale',
      'via e numero civico',
      'via',
      'sede',
      'sede legale',
      'indirizzo completo',
    ],
    cap: ['cap', 'codice postale', 'c.a.p.'],
    citta: ['città', 'comune', 'località'],
    provincia: ['provincia', 'prov.', 'prov'],
    paese: ['paese', 'stato', 'nazione'],
    email_aziendale: [
      'email',
      'e-mail',
      'posta elettronica',
      'indirizzo email',
      'mail',
      'pec o mail',
    ],
    telefono_aziendale: [
      'telefono',
      'tel.',
      'tel',
      'cellulare',
      'numero di telefono',
      'recapito telefonico',
    ],
    pec: ['pec', 'pec o mail', 'posta elettronica certificata'],
    rappresentante_legale: [
      'rappresentante legale',
      'rappresentante',
      'legale rappresentante',
      'persone di contatto',
      'persona di contatto',
    ],
    numero_dipendenti: [
      'numero addetti',
      'numero dipendenti',
      'dipendenti',
      'addetti',
    ],
    fatturato_anno_corrente: [
      'fatturato',
      'fatturato annuale',
      "volume d'affari",
    ],
    capitale_sociale: ['capitale sociale', 'capitale'],
    iban: ['iban', 'codice iban'],
  };

  // 🧠 Funzione per trovare campo profilo da etichetta documento
  const findProfileFieldByLabel = (label) => {
    const normalizedLabel = label?.toLowerCase().trim();
    if (!normalizedLabel) return null;

    for (const [profileField, synonyms] of Object.entries(SEMANTIC_FIELD_DICTIONARY)) {
      if (
        synonyms.some((synonym) => {
          const normalizedSynonym = synonym.toLowerCase();
          if (normalizedLabel === normalizedSynonym) return true;
          if (
            normalizedLabel.includes(normalizedSynonym) ||
            normalizedSynonym.includes(normalizedLabel)
          ) {
            return true;
          }
          return false;
        })
      ) {
        return profileField;
      }
    }

    return null;
  };

  // 📦 Compila DOCX lavorando direttamente sul XML (preserva formattazione)
  const compileDocxPreservingFormat = async (file, profileData) => {
    console.log("📦 ========== COMPILAZIONE DIRETTA XML ==========");
    console.log("📦 File:", file.name);
    console.log("📦 Profilo:", profileData.ragione_sociale);
    
    try {
      // FASE 1: Carica DOCX come ZIP
      console.log("📦 Fase 1: Caricamento DOCX come ZIP...");
      const arrayBuffer = await readFileContent(file);
      if (!(arrayBuffer instanceof ArrayBuffer)) {
        throw new Error("File deve essere ArrayBuffer");
      }
      console.log("📦 ArrayBuffer size:", arrayBuffer.byteLength, "bytes");

      const zip = new JSZip();
      const docxZip = await zip.loadAsync(arrayBuffer);
      console.log("✅ ZIP caricato");

      // DEBUG: Analisi completa dello ZIP
      console.log("🔍 ========== DEBUG ZIP OBJECT ==========");
      console.log("🔍 Type of docxZip:", typeof docxZip);
      console.log("🔍 docxZip constructor:", docxZip?.constructor?.name);
      console.log("🔍 docxZip.files exists:", !!docxZip.files);
      const allFiles = Object.keys(docxZip.files || {});
      console.log("🔍 Number of files:", allFiles.length);
      console.log("🔍 All files in ZIP:");
      allFiles.forEach((filename, index) => {
        const file = docxZip.files[filename];
        console.log(`  ${index + 1}. ${filename}`);
        console.log(`     - isDir: ${file?.dir}`);
        console.log(`     - hasData: ${!!file?._data}`);
      });

      const criticalFiles = [
        '[Content_Types].xml',
        '_rels/.rels',
        'word/document.xml',
        'word/styles.xml',
        'word/_rels/document.xml.rels',
      ];
      console.log("🔍 Critical files check:");
      criticalFiles.forEach((filename) => {
        const exists = !!docxZip.file(filename);
        console.log(`  ${exists ? '✅' : '❌'} ${filename}`);
      });
      console.log("🔍 ========================================");

      // FASE 2: Estrai document.xml (contiene tutto il contenuto)
      console.log("📦 Fase 2: Estrazione document.xml...");
      const documentXmlFile = docxZip.file('word/document.xml');
      if (!documentXmlFile) {
        console.error("❌ document.xml NON TROVATO nello ZIP!");
        console.error("📦 File disponibili:", allFiles.filter((f) => f.startsWith('word/')));
        throw new Error("document.xml non trovato nel DOCX");
      }
      console.log("✅ document.xml trovato");
      
      let documentXml = await documentXmlFile.async('string');
      console.log("✅ document.xml estratto, size:", documentXml.length, "caratteri");
      
      // FASE 3: Estrai anche il testo per analisi AI
      console.log("📦 Fase 3: Estrazione testo per AI...");
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = textResult.value;
      console.log("✅ Testo estratto, length:", extractedText.length);
      
      // FASE 4: Prepara mappatura campi
      console.log("📦 Fase 4: Preparazione mappatura campi...");
      
      // Mapping ESTESO con TUTTE le varianti possibili
      const fieldMappings = {
        // RAGIONE SOCIALE (molte varianti!)
        'Ragione Sociale': profileData.ragione_sociale || '[DA COMPILARE]',
        'ragione sociale': profileData.ragione_sociale || '[DA COMPILARE]',
        'Denominazione': profileData.ragione_sociale || '[DA COMPILARE]',
        'denominazione': profileData.ragione_sociale || '[DA COMPILARE]',
        'Nome dell\'operatore economico': profileData.ragione_sociale || '[DA COMPILARE]',
        'nome dell\'operatore economico': profileData.ragione_sociale || '[DA COMPILARE]',
        'Nome operatore economico': profileData.ragione_sociale || '[DA COMPILARE]',
        'Operatore economico': profileData.ragione_sociale || '[DA COMPILARE]',
        'Nome azienda': profileData.ragione_sociale || '[DA COMPILARE]',
        'Nome': profileData.ragione_sociale || '[DA COMPILARE]',
        
        // PARTITA IVA
        'Partita IVA': profileData.partita_iva || '[DA COMPILARE]',
        'partita iva': profileData.partita_iva || '[DA COMPILARE]',
        'P.IVA': profileData.partita_iva || '[DA COMPILARE]',
        'P. IVA': profileData.partita_iva || '[DA COMPILARE]',
        'PIVA': profileData.partita_iva || '[DA COMPILARE]',
        'Numero di partita IVA': profileData.partita_iva || '[DA COMPILARE]',
        
        // CODICE FISCALE
        'Codice Fiscale': profileData.codice_fiscale || '[DA COMPILARE]',
        'codice fiscale': profileData.codice_fiscale || '[DA COMPILARE]',
        'C.F.': profileData.codice_fiscale || '[DA COMPILARE]',
        'CF': profileData.codice_fiscale || '[DA COMPILARE]',
        
        // FORMA GIURIDICA
        'Forma Giuridica': profileData.forma_giuridica || '[DA COMPILARE]',
        'forma giuridica': profileData.forma_giuridica || '[DA COMPILARE]',
        'Forma giuridica': profileData.forma_giuridica || '[DA COMPILARE]',
        'Tipo società': profileData.forma_giuridica || '[DA COMPILARE]',
        
        // INDIRIZZO
        'Indirizzo': profileData.indirizzo || '[DA COMPILARE]',
        'indirizzo': profileData.indirizzo || '[DA COMPILARE]',
        'Via': profileData.indirizzo || '[DA COMPILARE]',
        'Sede': profileData.indirizzo || '[DA COMPILARE]',
        'Sede legale': profileData.indirizzo || '[DA COMPILARE]',
        'Indirizzo completo': profileData.indirizzo || '[DA COMPILARE]',
        
        // CAP
        'CAP': profileData.cap || '[DA COMPILARE]',
        'cap': profileData.cap || '[DA COMPILARE]',
        'Codice postale': profileData.cap || '[DA COMPILARE]',
        
        // CITTÀ
        'Città': profileData.citta || '[DA COMPILARE]',
        'città': profileData.citta || '[DA COMPILARE]',
        'Comune': profileData.citta || '[DA COMPILARE]',
        'comune': profileData.citta || '[DA COMPILARE]',
        'Località': profileData.citta || '[DA COMPILARE]',
        
        // PROVINCIA
        'Provincia': profileData.provincia || '[DA COMPILARE]',
        'provincia': profileData.provincia || '[DA COMPILARE]',
        'Prov.': profileData.provincia || '[DA COMPILARE]',
        'Prov': profileData.provincia || '[DA COMPILARE]',
        
        // PAESE
        'Paese': profileData.paese || 'Italia',
        'paese': profileData.paese || 'Italia',
        'Stato': profileData.paese || 'Italia',
        'stato': profileData.paese || 'Italia',
        'Nazione': profileData.paese || 'Italia',
        
        // CONTATTI
        'Email': profileData.email_aziendale || '[DA COMPILARE]',
        'email': profileData.email_aziendale || '[DA COMPILARE]',
        'E-mail': profileData.email_aziendale || '[DA COMPILARE]',
        'Posta elettronica': profileData.email_aziendale || '[DA COMPILARE]',
        'Indirizzo email': profileData.email_aziendale || '[DA COMPILARE]',
        
        'Telefono': profileData.telefono_aziendale || '[DA COMPILARE]',
        'telefono': profileData.telefono_aziendale || '[DA COMPILARE]',
        'Tel.': profileData.telefono_aziendale || '[DA COMPILARE]',
        'Tel': profileData.telefono_aziendale || '[DA COMPILARE]',
        'Cellulare': profileData.telefono_aziendale || '[DA COMPILARE]',
        'Numero di telefono': profileData.telefono_aziendale || '[DA COMPILARE]',
        
        'PEC': profileData.pec || '[DA COMPILARE]',
        'pec': profileData.pec || '[DA COMPILARE]',
        'Posta certificata': profileData.pec || '[DA COMPILARE]',
        
        // DATI ECONOMICI
        'Fatturato': profileData.fatturato_anno_corrente || '[DA COMPILARE]',
        'fatturato': profileData.fatturato_anno_corrente || '[DA COMPILARE]',
        'Fatturato annuale': profileData.fatturato_anno_corrente || '[DA COMPILARE]',
        
        'Capitale Sociale': profileData.capitale_sociale || '[DA COMPILARE]',
        'capitale sociale': profileData.capitale_sociale || '[DA COMPILARE]',
        'Capitale': profileData.capitale_sociale || '[DA COMPILARE]',
        
        'Numero Dipendenti': profileData.numero_dipendenti || '[DA COMPILARE]',
        'numero dipendenti': profileData.numero_dipendenti || '[DA COMPILARE]',
        'Dipendenti': profileData.numero_dipendenti || '[DA COMPILARE]',
        'N. dipendenti': profileData.numero_dipendenti || '[DA COMPILARE]',
        
        // RAPPRESENTANTE
        'Rappresentante Legale': profileData.rappresentante_legale || '[DA COMPILARE]',
        'rappresentante legale': profileData.rappresentante_legale || '[DA COMPILARE]',
        'Rappresentante': profileData.rappresentante_legale || '[DA COMPILARE]',
        'Legale rappresentante': profileData.rappresentante_legale || '[DA COMPILARE]',
        
        // ALTRI
        'IBAN': profileData.iban || '[DA COMPILARE]',
        'iban': profileData.iban || '[DA COMPILARE]',
        
        'Data': new Date().toLocaleDateString('it-IT'),
        'data': new Date().toLocaleDateString('it-IT'),
        'Data odierna': new Date().toLocaleDateString('it-IT'),
      };
      
      console.log("📦 Mappature preparate:", Object.keys(fieldMappings).length);
      console.log("📦 Dati disponibili:", Object.entries(profileData).filter(([_, v]) => v && v !== '[DA COMPILARE]').length);
      
      // FASE 5: Sistema Modulare Multi-Pattern + AI
      console.log("📦 Fase 5: Analisi Multi-Pattern + AI...");

      // 1. Rileva TUTTI i pattern (universale)
      const allPatterns = detectAllPatterns(extractedText);

      if (allPatterns.length === 0) {
        console.warn("⚠️ Nessun pattern trovato nel documento");
        throw new Error("Nessun pattern da compilare trovato nel documento");
      }

      // 2. Estrai label da contesto per ogni pattern
      allPatterns.forEach(pattern => {
        pattern.label = extractLabelFromContext(pattern.contextBefore);
      });

      // 3. Analisi AI per context-awareness
      const aiMappingsRaw = await analyzeDocumentWithAI(extractedText, allPatterns, profileData);

      // 4. Crea mapping finale
      let aiMappings = aiMappingsRaw
        .filter(m => m.should_compile && m.value && m.value !== '[DA COMPILARE]')
        .map(m => {
          const pattern = allPatterns[m.pattern_index];
          if (!pattern) return null;
          return {
            pattern: pattern.pattern,
            label: m.label,
            profile_field: m.profile_field,
            value: m.value,
            section: m.section,
            confidence: m.confidence,
            source: 'ai-vision'
          };
        })
        .filter(m => m && m.pattern); // Rimuovi mapping senza pattern valido

      console.log(`\n📊 Mapping finale: ${aiMappings.length} campi da compilare`);
      aiMappings.forEach((m, i) => {
        console.log(`  ${i + 1}. [${m.section || 'UNKNOWN'}] "${m.label}" → ${m.profile_field} = "${m.value}"`);
      });
      
      // 🔬 DEBUG: Analisi encoding ellipsis nell'XML
      console.log("\n🔬 ========== DEBUG ENCODING XML ==========");
      
      // Cerca i primi 5 pattern ellipsis nell'XML
      const xmlEllipsisMatches = [...documentXml.matchAll(/\[…+\]/g)];
      console.log(`🔬 Pattern ellipsis nell'XML: ${xmlEllipsisMatches.length}`);
      
      if (xmlEllipsisMatches.length > 0) {
        console.log("\n🔬 Primi 5 pattern nell'XML:");
        xmlEllipsisMatches.slice(0, 5).forEach((match, i) => {
          const pattern = match[0];
          const index = match.index;
          
          // Estrai contesto: 100 char prima e dopo
          const contextStart = Math.max(0, index - 100);
          const contextEnd = Math.min(documentXml.length, index + pattern.length + 100);
          const context = documentXml.substring(contextStart, contextEnd);
          
          console.log(`\n  ${i + 1}. Pattern: "${pattern}"`);
          console.log(`     Index: ${index}`);
          console.log(`     Contesto XML:`);
          console.log(`     ...${context}...`);
          
          // Analisi caratteri pattern
          console.log(`     Analisi caratteri pattern:`);
          for (let j = 0; j < pattern.length; j++) {
            const char = pattern[j];
            const code = char.charCodeAt(0);
            const hex = code.toString(16).toUpperCase().padStart(4, '0');
            console.log(`       [${j}] '${char}' → U+${hex} (${code})`);
          }
        });
      }
      
      // Cerca anche pattern con entità XML (&hellip; o &#8230;)
      const entityMatches = documentXml.match(/\[(&hellip;|&#8230;)+\]/g);
      if (entityMatches && entityMatches.length > 0) {
        console.log(`\n🔬 Pattern con entità XML trovati: ${entityMatches.length}`);
        console.log(`   Esempi: ${entityMatches.slice(0, 3).join(', ')}`);
      }
      
      // Cerca pattern con puntini normali
      const dotsMatchesXml = documentXml.match(/\[\.{3,}\]/g);
      if (dotsMatchesXml && dotsMatchesXml.length > 0) {
        console.log(`\n🔬 Pattern con puntini trovati: ${dotsMatchesXml.length}`);
        console.log(`   Esempi: ${dotsMatchesXml.slice(0, 3).join(', ')}`);
      }
      
      console.log("\n🔬 ========== FINE DEBUG ENCODING ==========\n");
      
      // FASE 6: Sostituisci nel XML (SENZA DUPLICAZIONE)
      console.log("📦 Fase 6: Sostituzione campi nel XML...");
      let replacementCount = 0;
      const xmlSizeBefore = documentXml.length;
      console.log("📦 XML size PRIMA sostituzioni:", xmlSizeBefore, "caratteri");
      
      // Debug: verifica pattern nell'XML
      const ellipsisInXml = documentXml.match(/\[…+\]/g);
      const dotsInXml = documentXml.match(/\[\.{3,}\]/g);
      console.log(`🔍 Pattern nell'XML: ellipsis=${ellipsisInXml ? ellipsisInXml.length : 0}, dots=${dotsInXml ? dotsInXml.length : 0}`);
      if (ellipsisInXml && ellipsisInXml.length > 0) {
        console.log(`   Esempi ellipsis XML: ${ellipsisInXml.slice(0, 3).join(', ')}`);
      }

      aiMappings.forEach((mapping, index) => {
        const { label, pattern, value, profile_field } = mapping;
        
        if (!pattern || !value || value === '[DA COMPILARE]') {
          console.log(`  ${index + 1}. SKIP "${label}" (valore mancante)`);
          return;
        }

        console.log(`  ${index + 1}. Elaboro "${label}"`);
        console.log(`     Campo: ${profile_field || 'N/A'}`);
        console.log(`     Pattern: "${pattern}"`);
        console.log(`     Valore: "${value}"`);

        const safeValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        // Escape pattern per regex, gestendo anche ellipsis Unicode (U+2026)
        let escapedPattern = pattern
          .replace(/\\/g, '\\\\')  // Escape backslash per primo
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]')
          .replace(/\./g, '\\.')
          .replace(/\+/g, '\\+')
          .replace(/\*/g, '\\*')
          .replace(/\?/g, '\\?')
          .replace(/\^/g, '\\^')
          .replace(/\$/g, '\\$')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/\|/g, '\\|')
          .replace(/…/g, '…'); // Ellipsis Unicode (U+2026) - non serve escape, ma assicuriamoci che sia gestito

        const matchRegex = new RegExp(escapedPattern, 'g');
        const matchesBefore = documentXml.match(matchRegex);
        const matchCount = matchesBefore ? matchesBefore.length : 0;

        if (matchCount > 0) {
          console.log(`     ✓ Trovati ${matchCount} match nel XML`);
          
          // Sostituisci SOLO LA PRIMA occorrenza (non tutte!)
          const singleRegex = new RegExp(escapedPattern);  // NO flag 'g' = solo prima
          documentXml = documentXml.replace(singleRegex, safeValue);
          replacementCount++;
          
          console.log(`     ✅ Sostituita PRIMA occorrenza (${matchCount} totali nel documento) con "${safeValue.substring(0, 30)}..."`);
        } else {
          console.log(`     ⚠️ Pattern non trovato nel XML`);
          
          // Debug: cerca pattern ellipsis nell'XML
          if (pattern.includes('…')) {
            // Cerca ellipsis Unicode direttamente nell'XML
            const ellipsisInXml = documentXml.match(/\[…+\]/g);
            if (ellipsisInXml && ellipsisInXml.length > 0) {
              console.log(`     ℹ️ Trovati ${ellipsisInXml.length} pattern ellipsis nell'XML (ma pattern specifico non matchato)`);
              // Il pattern specifico non è stato trovato, potrebbe essere un problema di encoding
              // Non sostituiamo qui per evitare di sostituire pattern sbagliati
            } else {
              // Cerca ellipsis codificato in modo diverso (es: entità XML)
              const ellipsisEntity = documentXml.match(/\[&hellip;+\]|\[&#8230;+\]/g);
              if (ellipsisEntity && ellipsisEntity.length > 0) {
                console.log(`     ℹ️ Trovati pattern ellipsis come entità XML: ${ellipsisEntity.length}`);
              }
            }
          } else if (pattern.includes('[') && pattern.includes(']')) {
            const dotsOnly = pattern.match(/\[\.+\]/);
            if (dotsOnly) {
              const simplifiedPattern = dotsOnly[0]
                .replace(/\[/g, '\\[')
                .replace(/\]/g, '\\]')
                .replace(/\./g, '\\.');
              const simplifiedRegex = new RegExp(simplifiedPattern, 'g');
              const simplifiedMatches = documentXml.match(simplifiedRegex);
              if (simplifiedMatches && simplifiedMatches.length > 0) {
                console.log(`     ℹ️ Trovato pattern semplificato: ${simplifiedMatches.length}x`);
              }
            }
          }
        }

        const currentXmlSize = documentXml.length;
        if (currentXmlSize > xmlSizeBefore * 2) {
          console.error(
            `❌ ANOMALIA: XML raddoppiato! Before: ${xmlSizeBefore}, Now: ${currentXmlSize}`
          );
          throw new Error("Errore sostituzione: XML sta esplodendo di dimensione");
        }
      });

      const xmlSizeAfter = documentXml.length;
      console.log("📦 XML size DOPO sostituzioni:", xmlSizeAfter, "caratteri");
      console.log("📦 Differenza:", xmlSizeAfter - xmlSizeBefore, "caratteri");
      if (xmlSizeAfter > xmlSizeBefore * 1.5) {
        console.warn("⚠️ WARNING: XML cresciuto oltre il 50%!");
        console.warn("   Before:", xmlSizeBefore, "After:", xmlSizeAfter);
      }
      if (xmlSizeAfter > 10_000_000) {
        console.error("❌ ERRORE: XML troppo grande (> 10MB)");
        throw new Error(`XML troppo grande: ${xmlSizeAfter} bytes. Probabile loop di duplicazione.`);
      }

      console.log(`✅ Totale sostituzioni effettuate: ${replacementCount}`);
      if (replacementCount === 0) {
        console.error("❌ NESSUNA SOSTITUZIONE EFFETTUATA!");
        console.log("📄 XML sample (primi 1000 char):", documentXml.substring(0, 1000));
        console.log("📋 Pattern AI cercati:");
        aiMappings.forEach((m, i) => {
          console.log(`  ${i + 1}. "${m.pattern}" per campo "${m.label}"`);
        });
        throw new Error(
          `Nessun campo compilato. Verifica che:
1. Il DOCX contenga pattern riconoscibili ([....], ____)
2. I dati del profilo siano completi (/profile)
3. L'AI stia generando mapping corretti
`
        );
      }
      
      // FASE 7: Salva XML modificato e rigenera DOCX
      console.log("📦 Fase 7: Ricostruzione DOCX...");
      console.log("🔍 ========== DEBUG XML MODIFICATO ==========");
      console.log("🔍 XML length:", documentXml.length, "characters");
      console.log("🔍 XML starts with:", documentXml.substring(0, 100));
      console.log("🔍 XML ends with:", documentXml.substring(Math.max(0, documentXml.length - 100)));
      const xmlStartsValid =
        documentXml?.trim().startsWith('<?xml') || documentXml?.trim().startsWith('<w:document');
      console.log("🔍 XML starts valid:", xmlStartsValid);
      if (!xmlStartsValid) {
        console.error("❌ XML non inizia correttamente!");
      }
      console.log("🔍 ==========================================");

      try {
        console.log("🔍 Tentativo salvataggio document.xml...");
        docxZip.file('word/document.xml', documentXml);
        console.log("✅ document.xml salvato");
        const savedXml = docxZip.file('word/document.xml');
        if (!savedXml) {
          console.error("❌ document.xml NON trovato dopo salvataggio!");
          throw new Error("Salvataggio document.xml fallito");
        }
        console.log("✅ document.xml verificato nello ZIP");

        const filesInZip = Object.keys(docxZip.files);
        console.log("📦 Files nello ZIP:", filesInZip.length);
        console.log("📦 Files principali:", filesInZip.slice(0, 10).join(', '));
        const essentialFiles = [
          '[Content_Types].xml',
          '_rels/.rels',
          'word/document.xml',
          'word/styles.xml',
          'word/_rels/document.xml.rels',
        ];
        const missingFiles = essentialFiles.filter((f) => !docxZip.file(f));
        if (missingFiles.length > 0) {
          console.error("❌ File essenziali mancanti:", missingFiles);
          throw new Error(`ZIP corrotto: mancano ${missingFiles.join(', ')}`);
        }
        console.log("✅ ZIP integro, file essenziali presenti");

        console.log("📦 Generazione Blob DOCX...");
        console.log("🔍 ========== DEBUG GENERATE ASYNC ==========");
        console.log("🔍 Tentativo generazione Blob...");
        console.log("🔍 Files nello ZIP prima di generate:", filesInZip.length);

        let blob;
        try {
          blob = await docxZip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE',
            compressionOptions: {
              level: 6,
            },
          });
          console.log("✅ generateAsync completato");
        } catch (genError) {
          console.error("❌ generateAsync FALLITO:", genError);
          console.error("❌ Error stack:", genError.stack);
          throw new Error(`generateAsync failed: ${genError.message}`);
        }

        console.log("🔍 Blob generato:");
        console.log("🔍 - type:", blob.type);
        console.log("🔍 - size:", blob.size, "bytes");
        console.log("🔍 - constructor:", blob.constructor?.name);

        if (blob.size < 5000) {
          console.error("❌ Blob TROPPO PICCOLO:", blob.size, "bytes");
          console.error("❌ Probabilmente è XML puro, non DOCX ZIP!");
          const reader = new FileReader();
          reader.onload = function (e) {
            const arr = new Uint8Array(e.target.result);
            const header = String.fromCharCode(...arr.slice(0, 4));
            console.log("🔍 File header (primi 4 bytes):", header);
            console.log(
              "🔍 Hex:",
              Array.from(arr.slice(0, 10))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(' ')
            );
            if (header.startsWith('PK')) {
              console.log("✅ File è uno ZIP (header corretto)");
            } else if (header.startsWith('<?xm')) {
              console.error("❌ File è XML puro (non è uno ZIP!)");
            } else {
              console.error("❌ Header sconosciuto:", header);
            }
          };
          reader.readAsArrayBuffer(blob.slice(0, 100));
          throw new Error("Blob generato troppo piccolo - probabilmente XML invece di DOCX");
        }
        console.log("🔍 ==========================================");

        // TEST: generazione anche come ArrayBuffer
        console.log("🔍 TEST: Generazione come ArrayBuffer...");
        try {
          const arrayBufferTest = await docxZip.generateAsync({
            type: 'arraybuffer',
            compression: 'DEFLATE',
          });
          console.log("✅ ArrayBuffer generato, size:", arrayBufferTest.byteLength);
          const view = new Uint8Array(arrayBufferTest);
          const isPK = view[0] === 0x50 && view[1] === 0x4b;
          console.log("🔍 ArrayBuffer ha header ZIP (PK):", isPK);
          if (!isPK) {
            console.error("❌ ArrayBuffer NON è uno ZIP valido!");
            console.log("🔍 Primi 20 bytes:", Array.from(view.slice(0, 20)));
          } else if (arrayBufferTest.byteLength > 5000) {
            console.log("✅ ArrayBuffer valido, uso questo per creare Blob...");
            blob = new Blob([arrayBufferTest], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            console.log("✅ Blob ricreato da ArrayBuffer, size:", blob.size);
          } else {
            console.warn("⚠️ ArrayBuffer generato ma dimensione ridotta:", arrayBufferTest.byteLength);
          }
        } catch (arrErr) {
          console.error("❌ Test ArrayBuffer fallito:", arrErr);
        }

        console.log("✅ ========== COMPILAZIONE COMPLETATA ==========");
        console.log("✅ DOCX finale size:", blob.size, "bytes");
        console.log("✅ Sostituzioni effettuate:", replacementCount);
        console.log("✅ Formattazione originale: PRESERVATA");

        return blob;
      } catch (zipErr) {
        console.error("❌ Errore generazione DOCX:", zipErr);
        console.error("❌ Stack:", zipErr.stack);
        throw new Error(`Impossibile generare DOCX: ${zipErr.message}`);
      }
      
    } catch (err) {
      console.error("❌ Errore compilazione XML:", err);
      throw new Error(`Impossibile compilare documento: ${err.message}`);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     FUNZIONI LEGACY (mantenute come fallback)
     Se compileDocxPreservingFormat fallisce, si possono riattivare
     ═══════════════════════════════════════════════════════════ */

  // 📖 Estrae testo da DOCX usando mammoth
  /* const extractTextFromDocx = async (file) => {
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
  }; */

  // 🤖 AI compila il documento identificando campi vuoti
  /* const compileWithAI = async (extractedText, profileData, fileName) => {
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
  }; */

  // 📦 Genera DOCX formattato da testo compilato
  /* const generateDocx = async (compiledText, originalFileName) => {
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
  }; */

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
      } else if (profileType === "personal" && selectedPersonalId) {
        const selectedPersonal = personalProfiles.find(p => p.id === selectedPersonalId);
        if (selectedPersonal) {
          profileData = { ...selectedPersonal };
        }
      } else if (userProfile) {
        profileData = { ...userProfile };
      }

      const file = uploadedFiles[0];
      console.log("📄 File:", file.name);
      console.log("📊 Profilo:", profileData.ragione_sociale || profileData.nome || "N/A");

      // ✅ NUOVO: Usa compileDocxPreservingFormat (preserva formattazione originale)
      console.log("📦 Usando sistema XML diretto...");
      const compiledBlob = await compileDocxPreservingFormat(file, profileData);

      /* ❌ VECCHIO SISTEMA (COMMENTATO come fallback)
      console.log("🚀 ========== SISTEMA UNIVERSALE AI ==========");
      console.log("🔄 FASE 1/3: Estrazione testo da DOCX...");
      const extractedText = await extractTextFromDocx(file);

      console.log("🔄 FASE 2/3: Compilazione con AI...");
      const compiledText = await compileWithAI(extractedText, profileData, file.name);

      console.log("🔄 FASE 3/3: Generazione DOCX formattato...");
      const compiledBlob = await generateDocx(compiledText, file.name);
      */

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
    console.log("📥 ========== DOWNLOAD DOCUMENTO ==========");

    if (!compiledResult) {
      alert("Nessun documento da scaricare");
      return;
    }

    try {
      const originalName =
        uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, "") || "documento";
      const filename = `${originalName}_compilato_${Date.now()}.docx`;

      console.log("📥 Download file:", filename);
      console.log("📥 Blob type:", compiledResult.type);
      console.log("📥 Blob size:", compiledResult.size ?? 'N/A');

      if (!(compiledResult instanceof Blob)) {
        console.error("❌ compiledResult non è un Blob:", typeof compiledResult);
        alert("Errore: documento non valido");
        return;
      }

      if (compiledResult.size < 1024) {
        console.error("❌ File troppo piccolo:", compiledResult.size);
        alert("Errore: documento generato sembra corrotto (troppo piccolo)");
        return;
      }

      const url = window.URL.createObjectURL(compiledResult);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);

      console.log("📥 Triggering download...");
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log("✅ ========== DOWNLOAD COMPLETATO ==========");
      }, 100);
    } catch (err) {
      console.error("❌ Errore download:", err);
      alert(`Errore download: ${err.message}`);
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
