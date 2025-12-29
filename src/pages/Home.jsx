import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, FileSignature, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const navigate = useNavigate();
  const [selectedBox, setSelectedBox] = useState(null);

  const handleBoxClick = (boxType) => {
    if (boxType === "generate") {
      setSelectedBox("generate");
      setTimeout(() => {
        navigate(createPageUrl("GenerateDocument"));
      }, 600);
    } else if (boxType === "compile") {
      setSelectedBox("compile");
      setTimeout(() => {
        navigate(createPageUrl("CompileDocument"));
      }, 600);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-0 pb-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 -mt-6"
        >
          <h1 className="text-5xl font-bold text-center">
            Benvenuto in <span className="text-indigo-600">DocuMate</span>
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            La soluzione intelligente per creare e gestire i tuoi documenti legali e burocratici
          </p>
        </motion.div>

        {/* Boxes Container */}
        <div className="grid md:grid-cols-2 gap-6 mt-10 relative">
          <AnimatePresence mode="wait">
            {/* Generate Documents Box */}
            <motion.div
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{
                opacity: selectedBox === "compile" ? 0 : 1,
                x: selectedBox === "compile" ? -100 : 0,
                scale: selectedBox === "generate" ? 1.05 : 1,
              }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={selectedBox === "compile" ? "hidden" : ""}
              onClick={() => handleBoxClick("generate")}
            >
              {/* @ts-ignore */}
              <Card className="group relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-300 transition-all duration-300 bg-white h-[480px] flex flex-col">
                {/* @ts-ignore */}
                <CardContent className="relative flex-1 p-4 space-y-2 flex flex-col">
                  {/* Background & Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-500" />

                  {/* Icon */}
                  <div className="mb-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <FileText className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Genera Documenti
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Crea documenti legali professionali in pochi minuti attraverso un questionario guidato.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <span>Generazione AI intelligente</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span>Template professionali</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <ArrowRight className="w-5 h-5 text-indigo-600" />
                        <span>Download immediato</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      Disponibile
                    </Badge>
                    <ArrowRight className="w-6 h-6 text-indigo-600 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Compile Documents Box */}
            <motion.div
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{
                opacity: selectedBox === "generate" ? 0 : 1,
                x: selectedBox === "generate" ? 100 : 0,
                scale: selectedBox === "compile" ? 1.05 : 1,
              }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={selectedBox === "generate" ? "hidden" : ""}
            >
              {/* @ts-ignore */}
              <Card
                onClick={(e) => e.preventDefault()}
                className="group relative overflow-hidden cursor-not-allowed opacity-60 border-2 border-transparent hover:border-blue-300 transition-all duration-300 bg-white h-[480px] flex flex-col"
              >
                {/* @ts-ignore */}
                <CardContent className="relative flex-1 p-4 space-y-2 flex flex-col">
                  {/* Background & Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />

                  {/* Icon */}
                  <div className="mb-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <FileSignature className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Compila Documenti 🚧
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Funzione in lavorazione - disponibile a breve. Compila automaticamente moduli e documenti burocratici esistenti.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FileSignature className="w-5 h-5 text-blue-600" />
                        <span>Compilazione automatica</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>Supporto multipli formati</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                        <span>Validazione automatica</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      🚧 In sviluppo
                    </Badge>
                    <ArrowRight className="w-6 h-6 text-blue-600 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-gray-500">
            Non hai ancora un account?{" "}
            <Link to="/auth?tab=register" className="text-indigo-600 hover:underline font-semibold">
              Registrati gratuitamente
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
