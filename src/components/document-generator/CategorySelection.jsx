import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, FileText, Briefcase, Users, DollarSign, FileCheck } from "lucide-react";

const CATEGORIES = [
  {
    id: "civili_privati",
    name: "Contratti Civili e Privati",
    description: "Affitti, prestiti, vendite tra privati",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "commerciali_aziendali",
    name: "Contratti Commerciali e Aziendali",
    description: "Forniture, partnership, licenze",
    icon: Briefcase,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "lavoro_hr",
    name: "Contratti di Lavoro e HR",
    description: "Assunzioni, stage, NDA",
    icon: Users,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "finanziari_assicurativi",
    name: "Contratti Finanziari e Assicurativi",
    description: "Prestiti, garanzie, assicurazioni",
    icon: DollarSign,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "modulistica_pubblica",
    name: "Modulistica Legale Standardizzata",
    description: "Autodichiarazioni, messa in mora, PEC",
    icon: FileCheck,
    color: "from-pink-500 to-rose-500",
  },
];

export default function CategorySelection({ onSelect, onHome }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Scegli la Categoria
        </h1>
        <p className="text-xl text-gray-600">
          Seleziona il tipo di documento che vuoi generare
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {CATEGORIES.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              onClick={() => onSelect(category)}
              className="group relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-300 transition-all duration-300 h-full"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative p-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <Button
          onClick={onHome}
          variant="outline"
          size="lg"
        >
          <Home className="w-5 h-5 mr-2" />
          Torna alla Home
        </Button>
      </div>
    </motion.div>
  );
}