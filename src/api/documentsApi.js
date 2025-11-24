// src/api/documentsApi.js
import { supabase } from './supabaseClient';

export const documentsApi = {
  // Upload file a Supabase Storage
  async uploadDocument(file, userId) {
    console.log("📤 Uploading document:", file.name, "for user:", userId);

    if (!userId) {
      throw new Error('User ID non valido');
    }

    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    console.log("📤 Attempting upload to bucket 'documents', path:", fileName);

    // Upload a Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError);
      console.error("❌ Error code:", uploadError.statusCode);
      console.error("❌ Error message:", uploadError.message);
      
      // Se il bucket non esiste, fornisci un messaggio più chiaro
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === 404) {
        throw new Error('Bucket "documents" non trovato in Supabase Storage. Crea il bucket nella dashboard di Supabase.');
      }
      
      throw uploadError;
    }

    console.log("✅ File uploaded to storage:", uploadData.path);

    // Crea record nel DB
    console.log("📝 Creating database record...");
    const { data: docRecord, error: dbError } = await supabase
      .from('uploaded_documents')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: fileExt,
        file_size: file.size,
        storage_path: uploadData.path,
        status: 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ DB insert error:", dbError);
      console.error("❌ Error code:", dbError.code);
      console.error("❌ Error message:", dbError.message);
      console.error("❌ Error details:", dbError.details);
      console.error("❌ Error hint:", dbError.hint);
      
      // Se la tabella non esiste, fornisci un messaggio più chiaro
      if (dbError.code === '42P01' || dbError.message?.includes('relation') || dbError.message?.includes('does not exist')) {
        throw new Error('Tabella "uploaded_documents" non trovata nel database. Esegui la migration SQL su Supabase.');
      }
      
      throw dbError;
    }

    console.log("✅ Document record created:", docRecord.id);
    return docRecord;
  },

  // Analizza documento (versione semplificata client-side per ora)
  async analyzeDocument(documentId, file) {
    console.log("🔍 Analyzing document:", documentId);

    try {
      // Estrai testo in base al tipo di file
      let extractedText = '';

      if (file.type === 'application/pdf') {
        extractedText = await this.extractTextFromPDF(file);
      } else if (file.type.includes('word') || file.type.includes('document')) {
        extractedText = await this.extractTextFromWord(file);
      } else {
        throw new Error('Tipo file non supportato');
      }

      console.log("📝 Text extracted, length:", extractedText.length);

      // Identifica campi da compilare
      const identifiedFields = this.identifyFields(extractedText);

      console.log("🎯 Fields identified:", identifiedFields.length);

      // Aggiorna DB
      const { error: updateError } = await supabase
        .from('uploaded_documents')
        .update({
          extracted_text: extractedText,
          identified_fields: identifiedFields,
          status: 'analyzed'
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      return {
        extractedText,
        identifiedFields,
        ocrApplied: false
      };

    } catch (error) {
      console.error("Analysis error:", error);

      // Aggiorna status a error
      await supabase
        .from('uploaded_documents')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', documentId);

      throw error;
    }
  },

  // Helper: Estrai testo da PDF (semplificato)
  async extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          // Per ora usa pdf.js minimale
          // In produzione usa: import * as pdfjsLib from 'pdfjs-dist'
          const text = "TESTO ESTRATTO DAL PDF:\n\n" +
            "Contratto di [TIPO_CONTRATTO]\n\n" +
            "Tra le parti:\n" +
            "Ragione Sociale: _______________\n" +
            "Partita IVA: _______________\n" +
            "Codice Fiscale: _______________\n" +
            "Indirizzo: _______________\n" +
            "Città: _______________\n" +
            "CAP: _______________\n\n" +
            "E\n\n" +
            "Nome: _______________\n" +
            "Cognome: _______________\n" +
            "Data di nascita: __/__/____\n" +
            "Luogo di nascita: _______________\n\n" +
            "Si conviene quanto segue:\n" +
            "Data inizio: __/__/____\n" +
            "Data fine: __/__/____\n" +
            "Importo: €_______________";

          resolve(text);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Errore lettura file'));
      reader.readAsArrayBuffer(file);
    });
  },

  // Helper: Estrai testo da Word (semplificato)
  async extractTextFromWord(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        // Per ora placeholder
        // In produzione usa: mammoth.extractRawText
        const text = "TESTO ESTRATTO DA WORD:\n\n" +
          "Documento con campi:\n" +
          "Campo 1: _______________\n" +
          "Campo 2: _______________\n";

        resolve(text);
      };

      reader.onerror = () => reject(new Error('Errore lettura file'));
      reader.readAsText(file);
    });
  },

  // Helper: Identifica campi nel testo
  identifyFields(text) {
    const fields = [];
    let fieldId = 1;

    // Pattern per trovare campi da compilare
    const patterns = [
      // Underscore: _______________
      { regex: /([A-Za-z\s]+):\s*_{3,}/g, type: 'underscore' },
      // Placeholder: [CAMPO]
      { regex: /\[([A-Z_]+)\]/g, type: 'bracket' },
      // Date: __/__/____
      { regex: /__\/__\/____|gg\/mm\/aaaa/gi, type: 'date' },
      // Money: €___
      { regex: /€\s*_{3,}/g, type: 'money' },
    ];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex);

      while ((match = regex.exec(text)) !== null) {
        const label = match[1] || 'Campo ' + fieldId;
        const context = text.substring(Math.max(0, match.index - 50), match.index + 50);

        // Suggerisci mapping intelligente
        const suggestedField = this.suggestFieldMapping(label.toLowerCase());

        fields.push({
          id: `field_${fieldId}`,
          label: label.trim(),
          type: this.determineFieldType(label),
          pattern: match[0],
          context: context.trim(),
          suggestedField: suggestedField,
          required: true,
          position: { index: match.index }
        });

        fieldId++;
      }
    });

    return fields;
  },

  // Helper: Suggerisci mapping campo
  suggestFieldMapping(label) {
    const mappings = {
      'ragione sociale': 'ragione_sociale',
      'partita iva': 'partita_iva',
      'codice fiscale': 'codice_fiscale',
      'indirizzo': 'indirizzo',
      'città': 'citta',
      'citta': 'citta',
      'cap': 'cap',
      'provincia': 'provincia',
      'nome': 'nome',
      'cognome': 'cognome',
      'data nascita': 'data_nascita',
      'luogo nascita': 'luogo_nascita',
      'email': 'email',
      'telefono': 'telefono',
      'pec': 'pec',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (label.includes(key)) return value;
    }

    return null;
  },

  // Helper: Determina tipo campo
  determineFieldType(label) {
    label = label.toLowerCase();

    if (label.includes('data') || label.includes('nascita')) return 'date';
    if (label.includes('importo') || label.includes('€')) return 'number';
    if (label.includes('email')) return 'email';
    if (label.includes('telefono') || label.includes('cell')) return 'phone';
    if (label.includes('codice fiscale') || label.includes('cf')) return 'fiscal_code';
    if (label.includes('partita iva') || label.includes('p.iva')) return 'vat';
    if (label.includes('indirizzo') || label.includes('via')) return 'address';

    return 'text';
  },

  // Compila documento
  async compileDocument(uploadedDocumentId, fieldsMapping, profileType, profileId, originalFile) {
    console.log("🔧 Compiling document:", uploadedDocumentId);

    // Carica documento originale dal DB
    const { data: docData } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('id', uploadedDocumentId)
      .single();

    if (!docData) throw new Error('Document not found');

    // Carica profilo dati
    const tableName = profileType === 'company' ? 'company_profiles' : 'user_profiles';
    const { data: profileData } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', profileId)
      .single();

    if (!profileData) throw new Error('Profile not found');

    // Sostituisci campi nel testo
    let compiledText = docData.extracted_text;

    docData.identified_fields.forEach(field => {
      const mappedFieldName = fieldsMapping[field.id];
      if (!mappedFieldName) return;

      const value = this.getNestedValue(profileData, mappedFieldName) || '[DA COMPILARE]';

      // Sostituisci il pattern con il valore
      compiledText = compiledText.replace(field.pattern, value);
    });

    console.log("✅ Text compiled");

    // Crea file compilato (per ora come .txt)
    const compiledBlob = new Blob([compiledText], { type: 'text/plain' });
    const compiledFileName = `compiled_${Date.now()}_${docData.file_name.replace(/\.[^/.]+$/, '')}.txt`;

    // Upload file compilato
    const { data: { user } } = await supabase.auth.getUser();
    const compiledFilePath = `${user.id}/${compiledFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(compiledFilePath, compiledBlob, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) throw uploadError;

    console.log("✅ Compiled file uploaded");

    // Salva record compilazione
    const { data: compiledDoc, error: insertError } = await supabase
      .from('compiled_documents')
      .insert({
        user_id: user.id,
        uploaded_document_id: uploadedDocumentId,
        company_profile_id: profileType === 'company' ? profileId : null,
        personal_profile_id: profileType === 'personal' ? profileId : null,
        fields_mapping: fieldsMapping,
        compiled_file_path: compiledFilePath,
        compilation_metadata: {
          compiledAt: new Date().toISOString(),
          fieldsCount: Object.keys(fieldsMapping).length,
          originalFileName: docData.file_name
        }
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("✅ Compilation record saved");

    // Genera URL firmato
    const { data: signedUrlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(compiledFilePath, 3600);

    return {
      compiledDocument: compiledDoc,
      downloadUrl: signedUrlData.signedUrl,
      compiledText: compiledText
    };
  },

  // Helper: Ottieni valore nested da oggetto
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  },

  // Ottieni documenti utente
  async getUserDocuments(userId) {
    const { data, error } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Ottieni documenti compilati
  async getCompiledDocuments(userId) {
    const { data, error } = await supabase
      .from('compiled_documents')
      .select(`
        *,
        uploaded_document:uploaded_documents(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

