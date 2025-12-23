import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Home, CheckCircle, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DocumentResult({ document: generatedDoc, user, onHome, onNewDocument }) {
  const downloadDocument = () => {
    if (!generatedDoc) return;

    const blob = new Blob([generatedDoc.text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${generatedDoc.document_type}_${new Date().getTime()}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Documento Generato!
          </h2>
          <p className="text-gray-600">
            Il tuo <strong>{generatedDoc.type_name}</strong> è pronto per essere scaricato
          </p>
        </div>

        {/* Document Preview */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto border-2 border-gray-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
            {generatedDoc.text}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={downloadDocument}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
          >
            <Download className="w-5 h-5 mr-2" />
            Scarica Documento
          </Button>
          <Button
            onClick={onNewDocument}
            variant="outline"
            className="flex-1"
          >
            <Plus className="w-5 h-5 mr-2" />
            Genera Altro Documento
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
        </div>

        {/* User Limit Alert */}
        {user && user.subscription_type === "free" && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              Hai generato {user.documents_generated || 1} di 3 documenti gratuiti.{" "}
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="font-semibold text-blue-600 hover:underline"
              >
                Registrati
              </button>{" "}
              per salvare i tuoi documenti e accedere a più funzionalità!
            </AlertDescription>
          </Alert>
        )}
      </Card>
    </motion.div>
  );
}