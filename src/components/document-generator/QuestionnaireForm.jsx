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

  const currentField = visibleFields[step];

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
    if (step < visibleFields.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Build prompt for document generation
      const prompt = `Sei un assistente legale specializzato nella redazione di documenti legali italiani.

Devi generare un documento di tipo: ${documentType.name}

Dati forniti:
${JSON.stringify(answers, null, 2)}

ISTRUZIONI:
1. Genera un documento legale completo e professionale in italiano
2. Utilizza tutti i dati forniti per compilare il documento
3. Segui le norme e le convenzioni legali italiane
4. Il documento deve essere formattato correttamente e pronto per l'uso
5. Includi tutte le clausole standard necessarie per questo tipo di documento
6. Assicurati che il documento sia completo e legalmente valido

Genera il documento:`;

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
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-lg font-medium">{currentField?.label}</p>

          {currentField && renderField(currentField)}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onBack}>Indietro</Button>

            <Button className="bg-blue-600 text-white" onClick={next}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Generazione...
                </>
              ) : step < visibleFields.length - 1 ? (
                "Avanti"
              ) : (
                "Genera Documento"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
