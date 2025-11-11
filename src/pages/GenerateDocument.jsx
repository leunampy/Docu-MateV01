import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, Home, Download, Loader2, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import CategorySelection from "../components/document-generator/CategorySelection";
import DocumentTypeSelection from "../components/document-generator/DocumentTypeSelection";
import QuestionnaireForm from "../components/document-generator/QuestionnaireForm";
import DocumentResult from "../components/document-generator/DocumentResult";

export default function GenerateDocument() {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState("category"); // category, document-type, questionnaire, result
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentStage("document-type");
  };

  const handleDocumentTypeSelect = (docType) => {
    setSelectedDocumentType(docType);
    setCurrentStage("questionnaire");
  };

  const handleDocumentGenerated = (document) => {
    setGeneratedDocument(document);
    setCurrentStage("result");
  };

  const handleBack = () => {
    if (currentStage === "document-type") {
      setCurrentStage("category");
      setSelectedCategory(null);
    } else if (currentStage === "questionnaire") {
      setCurrentStage("document-type");
      setSelectedDocumentType(null);
    } else if (currentStage === "result") {
      setCurrentStage("category");
      setSelectedCategory(null);
      setSelectedDocumentType(null);
      setGeneratedDocument(null);
    }
  };

  const handleHome = () => {
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen px-4 py-12">
      {error && (
        <div className="max-w-4xl mx-auto mb-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentStage === "category" && (
          <CategorySelection 
            onSelect={handleCategorySelect}
            onHome={handleHome}
          />
        )}

        {currentStage === "document-type" && (
          <DocumentTypeSelection
            category={selectedCategory}
            onSelect={handleDocumentTypeSelect}
            onBack={handleBack}
            onHome={handleHome}
          />
        )}

        {currentStage === "questionnaire" && (
          <QuestionnaireForm
            documentType={selectedDocumentType}
            user={user}
            onDocumentGenerated={handleDocumentGenerated}
            onError={setError}
            onBack={handleBack}
            onHome={handleHome}
          />
        )}

        {currentStage === "result" && (
          <DocumentResult
            document={generatedDocument}
            user={user}
            onHome={handleHome}
            onNewDocument={() => {
              setCurrentStage("category");
              setSelectedCategory(null);
              setSelectedDocumentType(null);
              setGeneratedDocument(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}