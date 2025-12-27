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

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [personalProfile, setPersonalProfile] = useState(null);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(false);

  // Stato per lo step corrente: toggle e azienda selezionata
  const [useProfileForStep, setUseProfileForStep] = useState(false);
  const [selectedCompanyForStep, setSelectedCompanyForStep] = useState(null);

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

  // Filtra i campi dello step corrente
  const currentStepFields = visibleFields.filter(field => (field.step || 1) === currentStep);
  
  // Calcola il numero totale di step
  const totalSteps = visibleFields.length > 0 
    ? Math.max(...visibleFields.map(f => f.step || 1))
    : 1;

  // Verifica se lo step ha campi mappabili
  const stepHasPersonalFields = currentStepFields.some(f => f.mapsToPersonal);
  const stepHasCompanyFields = currentStepFields.some(f => f.mapsToCompany);

  // Reset dello stato quando cambia lo step
  useEffect(() => {
    setUseProfileForStep(false);
    setSelectedCompanyForStep(null);
  }, [currentStep]);

  // Funzione per autofillare tutti i campi dello step
  const autofillStepFields = (companyId = null) => {
    currentStepFields.forEach(field => {
      if (companyId && field.mapsToCompany) {
        const company = companies.find(c => c.id === companyId);
        if (company && company[field.mapsToCompany]) {
          setAnswers(prev => ({ 
            ...prev, 
            [field.id]: company[field.mapsToCompany] 
          }));
        }
      } else if (!companyId && field.mapsToPersonal && personalProfile) {
        if (personalProfile[field.mapsToPersonal]) {
          setAnswers(prev => ({ 
            ...prev, 
            [field.id]: personalProfile[field.mapsToPersonal] 
          }));
        }
      }
    });
  };

  const renderField = (field) => {
    // Solo il campo input, senza toggle individuale
    return (
      <>
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
      </>
    );
  };

  const next = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      handleGenerate();
    }
  };

  const prev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
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
              <span>Step {currentStep} di {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Toggle "Usa dati salvati" - mostrato una volta per step */}
          {(stepHasPersonalFields || stepHasCompanyFields) && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <UseSavedDataBox
                enabled={useProfileForStep}
                onToggle={(value) => {
                  setUseProfileForStep(value);
                  if (value) {
                    if (stepHasCompanyFields) {
                      // Aspetta selezione azienda se ci sono campi aziendali
                      // Se ci sono solo campi personali, autofilla subito
                      if (!stepHasPersonalFields) {
                        // Solo campi aziendali, aspetta selezione
                      } else {
                        // Ci sono anche campi personali, autofilla quelli
                        autofillStepFields();
                      }
                    } else {
                      // Solo campi personali, autofilla subito
                      autofillStepFields();
                    }
                  }
                }}
              />
              
              {useProfileForStep && stepHasCompanyFields && (
                <div className="mt-4">
                  <CompanySelector
                    companies={companies}
                    selected={selectedCompanyForStep}
                    onChange={(companyId) => {
                      setSelectedCompanyForStep(companyId);
                      autofillStepFields(companyId);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Renderizza tutti i campi dello step corrente */}
          {currentStepFields.length > 0 ? (
            <div className="space-y-4">
              {currentStepFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nessun campo disponibile per questo step.</p>
          )}

          <div className="flex justify-between mt-6 gap-3">
            <Button 
              variant="outline" 
              onClick={currentStep === 1 ? onBack : prev}
              disabled={loading}
            >
              {currentStep === 1 ? "Indietro" : "Precedente"}
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
              ) : currentStep < totalSteps ? (
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
