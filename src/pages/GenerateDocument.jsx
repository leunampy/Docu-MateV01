import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, Home, Download, Loader2, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkMonthlyLimit, trackGeneration, getGuestId } from "@/lib/guest-tracking";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";

import CategorySelection from "../components/document-generator/CategorySelection";
import DocumentTypeSelection from "../components/document-generator/DocumentTypeSelection";
import QuestionnaireForm from "../components/document-generator/QuestionnaireForm";
import DocumentResult from "../components/document-generator/DocumentResult";

export default function GenerateDocument() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStage, setCurrentStage] = useState("category"); // category, document-type, questionnaire, result
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [error, setError] = useState(null);
  const [limitInfo, setLimitInfo] = useState(null);
  const [base44User, setBase44User] = useState(null);

  // Carica utente base44 per compatibilità
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setBase44User(currentUser);
      } catch (error) {
        setBase44User(null);
      }
    };
    loadUser();
  }, []);

  // Controlla limite mensile all'avvio e quando cambia l'utente
  useEffect(() => {
    const checkLimit = async () => {
      const info = await checkMonthlyLimit(user?.id);
      setLimitInfo(info);
    };
    checkLimit();
  }, [user]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentStage("document-type");
  };

  const handleDocumentTypeSelect = async (docType) => {
    // Controlla limite prima di permettere l'accesso al form
    const limitCheck = await checkMonthlyLimit(user?.id);
    setLimitInfo(limitCheck);
    if (!limitCheck.canGenerate) {
      return;
    }
    
    setSelectedDocumentType(docType);
    setCurrentStage("questionnaire");
  };

  const handleDocumentGenerated = async (document) => {
    // Controlla limite prima di procedere
    const limitCheck = await checkMonthlyLimit(user?.id);
    setLimitInfo(limitCheck);
    if (!limitCheck.canGenerate) {
      return;
    }

    // Traccia la generazione
    await trackGeneration(document.document_type || 'unknown', user?.id);

    // Aggiorna il contatore
    const newInfo = await checkMonthlyLimit(user?.id);
    setLimitInfo(newInfo);

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
      {error && (!limitInfo || limitInfo.remaining > 0) && (
        <div className="max-w-4xl mx-auto mb-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Contatore documenti rimanenti */}
      {limitInfo && limitInfo.success && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              📄 Documenti rimanenti questo mese: <strong>{limitInfo.remaining}/{limitInfo.limit}</strong>
              {limitInfo.isGuest && ' (Registrati per avere 10 documenti/mese!)'}
            </p>
          </div>
        </div>
      )}

      {/* Pulsante reset contatore (solo in development) */}
      {import.meta.env.MODE === 'development' && (
        <div className="max-w-4xl mx-auto mb-4">
          <button 
            onClick={async () => {
              try {
                console.log('🔧 Reset in corso...');
                console.log('User ID:', user?.id);
                
                if (user?.id) {
                  // Prima verifica quanti record ci sono PRIMA del delete
                  const { count: countBefore } = await supabase
                    .from('document_generations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);
                  
                  console.log('📊 Record PRIMA del delete:', countBefore);
                  
                  // Utente registrato - cancella TUTTI i record (non solo del mese corrente)
                  const { error } = await supabase
                    .from('document_generations')
                    .delete()
                    .eq('user_id', user.id);
                  
                  console.log('🗑️ DELETE eseguito.');
                  
                  // Verifica quanti record ci sono DOPO il delete
                  const { count: countAfter } = await supabase
                    .from('document_generations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);
                  
                  console.log('📊 Record DOPO il delete:', countAfter);
                  console.log('✅ Record cancellati:', (countBefore || 0) - (countAfter || 0));
                  
                  if (error) {
                    console.error('❌ Errore reset user:', error);
                    alert('Errore: ' + error.message);
                  } else {
                    console.log('✅ Reset completato per user:', user.id);
                    alert(`Reset completato! Cancellati ${(countBefore || 0) - (countAfter || 0)} record. La pagina si ricaricherà.`);
                    window.location.reload();
                  }
                } else {
                  // Guest
                  const guestId = getGuestId();
                  console.log('Guest ID:', guestId);
                  
                  // Prima verifica quanti record ci sono PRIMA del delete
                  const { count: countBefore } = await supabase
                    .from('document_generations')
                    .select('*', { count: 'exact', head: true })
                    .eq('guest_id', guestId);
                  
                  console.log('📊 Record PRIMA del delete:', countBefore);
                  
                  const { error } = await supabase
                    .from('document_generations')
                    .delete()
                    .eq('guest_id', guestId);
                  
                  console.log('🗑️ DELETE eseguito.');
                  
                  // Verifica quanti record ci sono DOPO il delete
                  const { count: countAfter } = await supabase
                    .from('document_generations')
                    .select('*', { count: 'exact', head: true })
                    .eq('guest_id', guestId);
                  
                  console.log('📊 Record DOPO il delete:', countAfter);
                  console.log('✅ Record cancellati:', (countBefore || 0) - (countAfter || 0));
                  
                  if (error) {
                    console.error('❌ Errore reset guest:', error);
                    alert('Errore: ' + error.message);
                  } else {
                    console.log('✅ Reset completato per guest:', guestId);
                    alert(`Reset completato! Cancellati ${(countBefore || 0) - (countAfter || 0)} record. La pagina si ricaricherà.`);
                    window.location.reload();
                  }
                }
              } catch (err) {
                console.error('❌ Errore generale:', err);
                alert('Errore: ' + err.message);
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🔧 DEV: Reset Contatore Test
          </button>
        </div>
      )}

      {/* Alert limite raggiunto */}
      {limitInfo && !limitInfo.canGenerate && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-900">
              ⚠️ Hai raggiunto il limite mensile di documenti. 
              {limitInfo.isGuest ? ' Registrati per avere 10 documenti/mese!' : ' Upgrade al piano Premium per documenti illimitati.'}
            </p>
          </div>
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
            user={base44User}
            onDocumentGenerated={handleDocumentGenerated}
            onError={setError}
            onBack={handleBack}
            onHome={handleHome}
          />
        )}

        {currentStage === "result" && (
          <DocumentResult
            document={generatedDocument}
            user={base44User}
            onHome={handleHome}
            onNewDocument={() => {
              setCurrentStage("category");
              setSelectedCategory(null);
              setSelectedDocumentType(null);
              setGeneratedDocument(null);
            }}
            onEditData={() => {
              // Torna al wizard mantenendo i dati
              setCurrentStage("questionnaire");
              setGeneratedDocument(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}