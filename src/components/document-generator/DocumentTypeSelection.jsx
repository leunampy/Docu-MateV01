import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DOCUMENT_TYPES = {
  civili_privati: [
    { id: "contratto_affitto", name: "Contratto di Affitto / Locazione", popular: true },
    { id: "comodato_uso", name: "Contratto di Comodato d'Uso" },
    { id: "prestito_privati", name: "Contratto di Prestito tra Privati" },
    { id: "vendita_privata", name: "Contratto di Vendita Privata" },
  ],
  commerciali_aziendali: [
    { id: "fornitura_servizi", name: "Contratto di Fornitura / Servizi", popular: true },
    { id: "collaborazione_partnership", name: "Contratto di Collaborazione / Partnership" },
    { id: "licenza_cessione", name: "Contratto di Licenza o Cessione di Diritti" },
  ],
  lavoro_hr: [
    { id: "lavoro_determinato", name: "Contratto di Lavoro a Tempo Determinato", popular: true },
    { id: "lavoro_indeterminato", name: "Contratto di Lavoro a Tempo Indeterminato", popular: true },
    { id: "stage_tirocinio", name: "Contratto di Stage / Tirocinio" },
    { id: "lavoro_autonomo", name: "Contratto di Lavoro Autonomo / Collaborazione Occasionale" },
    { id: "nda", name: "Accordo di Riservatezza (NDA)", popular: true },
  ],
  finanziari_assicurativi: [
    { id: "prestito_mutuo", name: "Contratto di Prestito / Mutuo" },
    { id: "garanzia", name: "Contratto di Garanzia" },
    { id: "assicurativo", name: "Contratto Assicurativo Standardizzato" },
  ],
  modulistica_pubblica: [
    { id: "autodichiarazione", name: "Autodichiarazione" },
    { id: "messa_in_mora", name: "Messa in Mora / Sollecito di Pagamento" },
    { id: "lettera_formale", name: "Lettera Formale (PEC o Raccomandata)" },
    { id: "dgue", name: "DGUE / Documenti per Gare Pubbliche" },
  ],
};

export default function DocumentTypeSelection({ category, onSelect, onBack, onHome }) {
  const documents = DOCUMENT_TYPES[category.id] || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
            <category.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {category.name}
            </h1>
            <p className="text-gray-600">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Document Types Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              onClick={() => onSelect(doc)}
              className="group relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-300 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    {doc.popular && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        Popolare
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {doc.name}
                  </h3>
                </div>
                <div className="transform group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Indietro
        </Button>
        <Button
          onClick={onHome}
          variant="outline"
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>
    </motion.div>
  );
}