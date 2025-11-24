// src/lib/fieldMatcher.js
// Funzioni per matching intelligente tra campi documento e dati disponibili

import { callAI } from './ai';

/**
 * Analizza un documento con AI per identificare campi e suggerire mapping
 * @param {string} extractedText - Testo estratto dal documento
 * @param {Object} availableData - Dati disponibili (company profile, user profile, etc.)
 * @returns {Promise<Array<Object>>} Array di campi identificati con suggerimenti
 */
export async function analyzeDocumentWithAI(extractedText, availableData) {
  try {
    const prompt = `Analizza questo documento e identifica tutti i campi da compilare.

DOCUMENTO:
${extractedText.substring(0, 5000)}${extractedText.length > 5000 ? '...' : ''}

DATI DISPONIBILI:
${JSON.stringify(availableData, null, 2)}

Restituisci SOLO un JSON valido con questo formato esatto:
{
  "fields": [
    {
      "id": "field_1",
      "label": "Ragione Sociale",
      "position": { "page": 1, "line": 5 },
      "suggestedMapping": "ragione_sociale",
      "confidence": 0.95,
      "description": "Nome dell'azienda"
    }
  ]
}

IMPORTANTE:
- Restituisci SOLO il JSON, senza testo aggiuntivo
- Usa nomi di campo standard italiani (ragione_sociale, codice_fiscale, partita_iva, indirizzo, citta, cap, provincia, etc.)
- La confidence deve essere un numero tra 0 e 1
- Se non sei sicuro di un mapping, usa confidence < 0.7`;

    const response = await callAI(prompt);
    
    // Estrai JSON dalla risposta (potrebbe avere testo prima/dopo)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Risposta AI non valida: nessun JSON trovato');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.fields || !Array.isArray(parsed.fields)) {
      throw new Error('Risposta AI non valida: formato fields mancante');
    }
    
    return parsed.fields;
  } catch (error) {
    console.error('Errore analisi AI:', error);
    // Fallback: ritorna array vuoto, l'utente dovrà mappare manualmente
    return [];
  }
}

/**
 * Suggerisce mapping automatici tra campi identificati e dati disponibili
 * @param {Array<Object>} fields - Campi identificati nel documento
 * @param {Object} companyProfile - Profilo aziendale selezionato
 * @param {Object} userProfile - Profilo utente (opzionale)
 * @returns {Array<Object>} Array di mapping suggeriti
 */
export function suggestFieldMappings(fields, companyProfile, userProfile = null) {
  const mappings = [];
  
  // Mappa standardizzata dei campi comuni
  const fieldMappingRules = {
    // Azienda
    'ragione sociale': 'ragione_sociale',
    'ragione_sociale': 'ragione_sociale',
    'nome azienda': 'ragione_sociale',
    'denominazione': 'ragione_sociale',
    'codice fiscale': 'codice_fiscale',
    'codice_fiscale': 'codice_fiscale',
    'cf': 'codice_fiscale',
    'partita iva': 'partita_iva',
    'partita_iva': 'partita_iva',
    'p.iva': 'partita_iva',
    'piva': 'partita_iva',
    'indirizzo': 'indirizzo',
    'sede': 'indirizzo',
    'via': 'indirizzo',
    'citta': 'citta',
    'città': 'citta',
    'comune': 'citta',
    'cap': 'cap',
    'provincia': 'provincia',
    'telefono': 'telefono',
    'tel': 'telefono',
    'phone': 'telefono',
    'email': 'email',
    'e-mail': 'email',
    'pec': 'pec',
    'p.ec': 'pec',
    'iban': 'iban',
    'iban aziendale': 'iban',
    'rappresentante legale': 'rappresentante_legale',
    'legale rappresentante': 'rappresentante_legale',
    'amministratore': 'rappresentante_legale',
    
    // Utente
    'nome': 'nome',
    'cognome': 'cognome',
    'nome completo': 'nome',
    'data nascita': 'data_nascita',
    'luogo nascita': 'luogo_nascita',
    'residenza': 'residenza_indirizzo',
  };
  
  fields.forEach(field => {
    const fieldLabel = (field.label || '').toLowerCase().trim();
    const fieldId = field.id;
    
    // Cerca match esatto o parziale
    let suggestedKey = null;
    let confidence = 0.5;
    
    // Match esatto
    if (fieldMappingRules[fieldLabel]) {
      suggestedKey = fieldMappingRules[fieldLabel];
      confidence = 0.9;
    } else {
      // Match parziale
      for (const [pattern, key] of Object.entries(fieldMappingRules)) {
        if (fieldLabel.includes(pattern) || pattern.includes(fieldLabel)) {
          suggestedKey = key;
          confidence = 0.7;
          break;
        }
      }
    }
    
    // Se c'è un suggerimento dall'AI, usalo
    if (field.suggestedMapping) {
      suggestedKey = field.suggestedMapping;
      confidence = field.confidence || 0.8;
    }
    
    // Verifica che il dato esista nel profilo
    let value = null;
    if (suggestedKey) {
      if (companyProfile && companyProfile[suggestedKey]) {
        value = companyProfile[suggestedKey];
      } else if (userProfile && userProfile[suggestedKey]) {
        value = userProfile[suggestedKey];
      } else {
        // Dato non trovato, riduci confidence
        confidence = Math.max(0.3, confidence - 0.3);
      }
    }
    
    mappings.push({
      fieldId: fieldId,
      fieldLabel: field.label || fieldId,
      suggestedKey: suggestedKey,
      value: value,
      confidence: confidence,
      required: false, // Sarà determinato dalla validazione
    });
  });
  
  return mappings;
}

/**
 * Valida i mapping per assicurarsi che tutti i campi required siano compilati
 * @param {Array<Object>} mappings - Array di mapping
 * @param {Array<string>} requiredFields - Array di fieldId required (opzionale)
 * @returns {Object} { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
export function validateMappings(mappings, requiredFields = []) {
  const errors = [];
  const warnings = [];
  
  // Verifica campi required
  requiredFields.forEach(fieldId => {
    const mapping = mappings.find(m => m.fieldId === fieldId);
    if (!mapping || !mapping.value || mapping.value.trim() === '') {
      errors.push(`Campo richiesto "${mapping?.fieldLabel || fieldId}" non compilato`);
    }
  });
  
  // Verifica mapping con bassa confidence
  mappings.forEach(mapping => {
    if (mapping.confidence < 0.5 && !mapping.value) {
      warnings.push(`Mapping per "${mapping.fieldLabel}" ha bassa confidence (${Math.round(mapping.confidence * 100)}%). Verifica manualmente.`);
    }
    
    if (mapping.suggestedKey && !mapping.value) {
      warnings.push(`Campo "${mapping.fieldLabel}" mappato a "${mapping.suggestedKey}" ma il dato non è disponibile nel profilo selezionato.`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Combina analisi AI e suggerimenti automatici
 * @param {string} extractedText - Testo estratto
 * @param {Array<Object>} identifiedFields - Campi identificati localmente
 * @param {Object} companyProfile - Profilo aziendale
 * @param {Object} userProfile - Profilo utente (opzionale)
 * @returns {Promise<Array<Object>>} Mapping completi con suggerimenti
 */
export async function getCompleteFieldMappings(
  extractedText,
  identifiedFields,
  companyProfile,
  userProfile = null
) {
  // Combina dati disponibili
  const availableData = {
    company: companyProfile || {},
    user: userProfile || {},
  };
  
  // Analisi AI (opzionale, può fallire)
  let aiFields = [];
  try {
    aiFields = await analyzeDocumentWithAI(extractedText, availableData);
  } catch (error) {
    console.warn('Analisi AI fallita, uso solo identificazione locale:', error);
  }
  
  // Combina campi identificati localmente con quelli dell'AI
  const allFields = [...identifiedFields];
  
  // Aggiungi campi dall'AI che non sono già presenti
  aiFields.forEach(aiField => {
    const exists = allFields.some(f => 
      f.label?.toLowerCase() === aiField.label?.toLowerCase() ||
      f.id === aiField.id
    );
    if (!exists) {
      allFields.push({
        id: aiField.id,
        label: aiField.label,
        placeholder: aiField.label,
        type: 'ai_detected',
        position: aiField.position || { line: 0, column: 0 },
        suggestedMapping: aiField.suggestedMapping,
        confidence: aiField.confidence,
      });
    }
  });
  
  // Genera suggerimenti
  const mappings = suggestFieldMappings(allFields, companyProfile, userProfile);
  
  return mappings;
}

/**
 * Formatta un valore per l'inserimento nel documento
 * @param {*} value - Valore da formattare
 * @param {string} fieldType - Tipo di campo (opzionale)
 * @returns {string} Valore formattato
 */
export function formatFieldValue(value, fieldType = null) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Formattazione specifica per tipo
  if (fieldType === 'date' && value instanceof Date) {
    return value.toLocaleDateString('it-IT');
  }
  
  if (fieldType === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }
  
  if (fieldType === 'number' && typeof value === 'number') {
    return value.toString();
  }
  
  // Default: stringa
  return String(value).trim();
}

