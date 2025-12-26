import { callAI } from './ai';

/**
 * Analizza documento con AI Vision per context-awareness
 */
export const analyzeDocumentWithAI = async (extractedText, patterns, profileData) => {
  console.log("🤖 ========== AI VISION ANALYSIS ==========");
  
  const availableData = Object.entries(profileData)
    .filter(([_, value]) => value && value !== '[DA COMPILARE]' && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  const patternsSummary = patterns.slice(0, 50).map((p, i) => 
    `${i + 1}. Pattern: "${p.pattern}" (${p.type})
       Context Before: "${p.contextBefore.substring(Math.max(0, p.contextBefore.length - 80))}"
       Context After: "${p.contextAfter.substring(0, 80)}"`
  ).join('\n\n');
  
  const prompt = `Sei un esperto nella compilazione di documenti amministrativi e legali italiani.

DOCUMENTO ESTRATTO (primi 5000 caratteri):
${extractedText.substring(0, 5000)}

PATTERN DA COMPILARE (primi 50):
${patternsSummary}

DATI PROFILO DISPONIBILI:
${availableData}

COMPITO:
Analizza il documento e crea un mapping PRECISO per compilare i pattern.

Per OGNI pattern:
1. Determina il tipo di sezione (es: "Dati Richiedente", "Operatore Economico", "Stazione Appaltante")
2. Identifica l'etichetta semantica del campo
3. Mappa al campo profilo corrispondente
4. Determina se il pattern va compilato o lasciato vuoto
5. Indica il valore corretto da inserire

REGOLE CRITICHE:
- Se il pattern è in una sezione "Stazione Appaltante" o "Amministrazione", NON compilare
- Se il pattern è in una sezione "Operatore Economico" o "Richiedente", compila
- "Il sottoscritto ___" → nome_completo (nome + cognome)
- "nato il ___ a ___" → data_nascita + luogo_nascita
- "in qualità di ___" → ruolo (es: Rappresentante Legale)
- "dell'impresa ___" → ragione_sociale
- Pattern consecutivi per stesso campo (es: indirizzo su più righe) → stesso valore

RISPOSTA (JSON array, MAX 50 elementi):
[
  {
    "pattern_index": 0,
    "section": "Dati Richiedente",
    "label": "Il sottoscritto",
    "profile_field": "nome_completo",
    "should_compile": true,
    "value": "Manuel Liberati",
    "confidence": 0.95
  }
]

SOLO JSON, nessun markdown, nessun testo aggiuntivo.`;

  try {
    console.log(`🤖 Chiamata AI con ${patterns.length} pattern...`);
    const response = await callAI(prompt);
    
    // Parse response
    let cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("❌ AI non ha restituito JSON valido");
      return [];
    }
    
    const mappings = JSON.parse(jsonMatch[0]);
    console.log(`✅ AI ha identificato ${mappings.length} mapping`);
    
    return mappings;
    
  } catch (err) {
    console.error("❌ Errore AI analysis:", err);
    return [];
  }
};






























