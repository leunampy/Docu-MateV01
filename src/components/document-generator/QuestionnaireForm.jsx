// src/components/document-generator/QuestionnaireForm.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/api/supabaseClient";

import UseSavedDataBox from "@/components/questionnaire/UseSavedDataBox";
import CompanySelector from "@/components/questionnaire/CompanySelector";

import { DOCUMENT_SCHEMAS } from "@/data/documentSchemas";
import { callAI } from "@/lib/ai";
import { buildDocumentPrompt } from "@/lib/promptBuilder";

export default function QuestionnaireForm({
  documentType,
  onDocumentGenerated,
  onError,
  onBack,
}) {
  const schema = DOCUMENT_SCHEMAS[documentType.id];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [personalProfile, setPersonalProfile] = useState(null);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(false);

  // Stato per ogni singolo campo:
  // { campo_id: { useSaved: boolean, selectedCompanyId: string | null } }
  const [fieldPrefill, setFieldPrefill] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: personal } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setPersonalProfile(personal || null);

      const { data: companyList } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id);

      setCompanies(companyList || []);
    };

    loadData();
  }, []);

  if (!schema) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Errore</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Schema non definito.</p>
            <Button variant="outline" onClick={onBack}>Indietro</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields = schema.fields || [];

  // Filtra i campi visibili in base alle dipendenze
  const visibleFields = fields.filter((field) => {
    if (field.dependsOn) {
      return answers[field.dependsOn.field] === field.dependsOn.value;
    }

    if (field.dependsOnAny) {
      return field.dependsOnAny.some(
        (cond) => answers[cond.field] === cond.value
      );
    }

    return true;
  });

  // Raggruppa campi per step
  const fieldsByStep = visibleFields.reduce((acc, field) => {
    const stepNum = field.step || 1;
    if (!acc[stepNum]) acc[stepNum] = [];
    acc[stepNum].push(field);
    return acc;
  }, {});

  const stepNumbers = Object.keys(fieldsByStep).map(Number).sort((a, b) => a - b);
  const currentStepNumber = stepNumbers[step] || stepNumbers[0];
  const currentStepFields = fieldsByStep[currentStepNumber] || [];

  const applyAutoFill = (field, companyId = null) => {
    if (!field) return;

    // Azienda
    if (companyId && field.mapsToCompany) {
      const company = companies.find((c) => c.id === companyId);
      if (company && company[field.mapsToCompany]) {
        setAnswers((prev) => ({
          ...prev,
          [field.id]: company[field.mapsToCompany],
        }));
      }
      return;
    }

    // Profilo personale
    if (!companyId && field.mapsToPersonal && personalProfile) {
      if (personalProfile[field.mapsToPersonal]) {
        setAnswers((prev) => ({
          ...prev,
          [field.id]: personalProfile[field.mapsToPersonal],
        }));
      }
    }
  };

  const renderField = (field) => {
    const settings = fieldPrefill[field.id] || {
      useSaved: false,
      companyId: null,
    };

    return (
      <>
        {/* Campo principale */}
        {field.type === "choice" ? (
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={answers[field.id] || ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
          >
            <option value="">— Seleziona —</option>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            type={field.type === "number" ? "number" : field.type}
            value={answers[field.id] || ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
          />
        )}

        {/* Toggle “usa dati salvati” */}
        {(field.mapsToCompany || field.mapsToPersonal) && (
          <UseSavedDataBox
            enabled={settings.useSaved}
            onToggle={(value) => {
              setFieldPrefill((prev) => ({
                ...prev,
                [field.id]: { ...settings, useSaved: value },
              }));

              if (!value) return; // disattivato

              if (field.mapsToCompany) {
                // Non autofill finché non seleziona azienda
                return;
              }

              // Personale
              applyAutoFill(field, null);
            }}
          />
        )}

        {/* Se vuole usare un profilo aziendale: mostra select */}
        {settings.useSaved && field.mapsToCompany && (
          <CompanySelector
            companies={companies}
            selected={settings.companyId}
            onChange={(companyId) => {
              setFieldPrefill((prev) => ({
                ...prev,
                [field.id]: { ...settings, companyId },
              }));
              applyAutoFill(field, companyId);
            }}
          />
        )}
      </>
    );
  };

  const next = () => {
    if (step < stepNumbers.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleGenerate();
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Build prompt for document generation using prompt builder
      const prompt = buildDocumentPrompt(documentType, answers, schema);

      const generatedText = await callAI(prompt);

      if (!generatedText || generatedText.includes("❌ Errore")) {
        throw new Error(generatedText || "Errore durante la generazione del documento");
      }

      onDocumentGenerated({
        text: generatedText,
        type_name: documentType.name,
        document_type: documentType.id,
      });
    } catch (err) {
      onError(err.message || "Errore durante la generazione del documento. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="questionnaire"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{documentType.name}</CardTitle>
          
          {/* 📊 Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {step + 1} di {stepNumbers.length}</span>
              <span>{Math.round(((step + 1) / stepNumbers.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / stepNumbers.length) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Titolo dello step */}
          <h3 className="text-xl font-semibold mb-4">
            {currentStepNumber === 1 && '🏠 Dati Immobile'}
            {currentStepNumber === 2 && '👤 Dati Locatore'}
            {currentStepNumber === 3 && '👤 Dati Locatario'}
            {currentStepNumber === 4 && '📝 Dati Contratto'}
            {!currentStepNumber && 'Dati'}
          </h3>

          {/* Renderizza TUTTI i campi dello step corrente */}
          <div className="space-y-4">
            {currentStepFields.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Pulsanti navigazione */}
          <div className="flex justify-between mt-6 gap-3">
            <Button 
              variant="outline" 
              onClick={step === 0 ? onBack : prev}
              disabled={loading}
            >
              {step === 0 ? "Indietro" : "Precedente"}
            </Button>

            <Button 
              className="bg-blue-600 text-white" 
              onClick={next}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Generazione...
                </>
              ) : step < stepNumbers.length - 1 ? (
                "Avanti"
              ) : (
                "Genera Documento"
              )}
            </Button>
          </div>

          {/* 📄 Preview Risposte Date */}
          {Object.keys(answers).length > 0 && (
            <details className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                📋 Mostra risposte date ({Object.keys(answers).length})
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                {Object.entries(answers).map(([key, value]) => {
                  const field = fields.find(f => f.id === key);
                  const label = field?.label || key;
                  return (
                    <div key={key} className="flex justify-between border-b pb-1">
                      <span className="text-gray-600 font-medium">{label}:</span>
                      <span className="text-gray-900">{value || "—"}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
