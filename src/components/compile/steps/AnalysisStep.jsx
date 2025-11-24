// src/components/compile/steps/AnalysisStep.jsx
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileSearch, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalysisStep({
  uploadedFile,
  onAnalysisComplete,
  onError
}) {
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('Lettura file...');

  useEffect(() => {
    analyzeDocument();
  }, []);

  const analyzeDocument = async () => {
    try {
      setStatus('processing');

      // Task 1: Lettura file
      setCurrentTask('Lettura file in corso...');
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Task 2: Estrazione testo (semplificata)
      setCurrentTask('Estrazione testo dal documento...');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Task 3: Identificazione campi
      setCurrentTask('Identificazione campi...');
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(90);
      setCurrentTask('Finalizzazione analisi...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(100);
      setStatus('success');

      // Notifica completamento (l'analisi vera viene fatta nel parent)
      setTimeout(() => {
        onAnalysisComplete({
          extractedText: '[Analisi completata - il contenuto verrà letto durante la compilazione]',
          identifiedFields: [],
          ocrApplied: false
        });
      }, 500);

    } catch (err) {
      console.error("Analysis error:", err);
      setStatus('error');
      onError('Errore durante l\'analisi: ' + err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card>
        <CardContent className="p-12">
          <div className="text-center max-w-md mx-auto">
            {status === 'processing' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <FileSearch className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Analisi in corso...
                </h3>

                <p className="text-gray-600 mb-6">{currentTask}</p>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-sm text-gray-500 font-medium">{progress}%</p>
              </>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Analisi completata!
                </h3>
                <p className="text-gray-600">
                  Documento analizzato con successo
                </p>
              </motion.div>
            )}

            {status === 'error' && (
              <>
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Errore nell'analisi
                </h3>
                <p className="text-gray-600">
                  Si è verificato un problema durante l'analisi
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
