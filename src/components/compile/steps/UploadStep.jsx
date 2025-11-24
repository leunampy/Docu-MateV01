// src/components/compile/steps/UploadStep.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function UploadStep({ onFileUploaded, onError, uploadedFiles = [], onRemoveFile }) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    // Validazione robusta
    if (!file) {
      console.warn("⚠️ No file provided");
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validazioni
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      onError('Tipo file non supportato. Usa PDF o Word (.doc, .docx)');
      return;
    }

    if (file.size === 0) {
      onError('File vuoto. Seleziona un file valido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('File troppo grande. Massimo 10MB');
      return;
    }

    onError(null);

    // Salva file in memoria (immediato, senza async)
    try {
      console.log("✅ File added to memory:", file.name);
      onFileUploaded(file);
    } catch (err) {
      console.error("❌ Error calling onFileUploaded:", err);
      onError('Errore durante il salvataggio del file: ' + err.message);
      return;
    }
    
    // Reset input per permettere di ricaricare lo stesso file
    const input = document.getElementById('file-input');
    if (input) {
      input.value = '';
      console.log("🔄 File input reset");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 scale-105'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            } cursor-pointer`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFileSelect(files[0]);
                } else {
                  console.warn("⚠️ onChange triggered but no files");
                }
              }}
              className="hidden"
            />

            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700 mb-2">
              Carica il documento da compilare
            </p>
            <p className="text-gray-500 mb-4">
              Clicca qui o trascina il file
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              <span>PDF, DOC, DOCX • Max 10MB</span>
            </div>
          </div>

          {/* Lista file caricati */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-gray-700">File caricati:</p>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {onRemoveFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Suggerimento:</p>
                <p>
                  Assicurati che il documento contenga campi chiaramente identificabili
                  (linee tratteggiate, underscore, placeholder tra parentesi quadre, ecc.)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
