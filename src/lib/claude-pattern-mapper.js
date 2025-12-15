// src/lib/claude-pattern-mapper.js
// Claude Pattern Mapper - Identifica mapping pattern → valori

import { callAI } from './ai-client';

/**
 * Claude identifica mapping pattern → valori
 * NON genera documento, solo mapping
 */
export async function mapPatternsWithClaude(documentText, patterns, profileData) {
  console.log('🗺️ ========== CLAUDE PATTERN MAPPING ==========');
  console.log('📄 Patterns:', patterns.length);
  
  // Limita a patterns rilevanti (dopo "Parte II")
  const parteIIIndex = documentText.indexOf('Parte II');
  const relevantPatterns = patterns.filter(p => 
    parteIIIndex < 0 || p.index > parteIIIndex
  ).slice(0, 50); // Max 50 pattern
  
  console.log('✅ Pattern rilevanti:', relevantPatterns.length);
  
  if (relevantPatterns.length === 0) {
    console.warn('⚠️ Nessun pattern rilevante trovato');
    return [];
  }
  
  // Profilo formattato
  const profileFormatted = Object.entries(profileData)
    .filter(([_, v]) => v && v !== '[DA COMPILARE]' && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  
  // Limita testo documento per prompt (primi 20K caratteri)
  const documentPreview = documentText.substring(0, 20000);
  
  const prompt = `Sei esperto compilazione documenti italiani.

📋 COMPITO:
Per ogni pattern trovato nel documento, dimmi:
1. Se va compilato (Operatore Economico SI, Stazione Appaltante NO)
2. Con quale valore dal profilo

⚠️ REGOLE:
- Pattern in sezione "Stazione Appaltante" → NON compilare (value: "")
- Pattern in sezione "Operatore Economico" → Compila
- Pattern consecutivi stesso campo → stesso valore
- Risposte BREVI e PRECISE

📄 DOCUMENTO (contesto):
${documentPreview}

🔍 PATTERN TROVATI (${relevantPatterns.length}):

${relevantPatterns.map((p, i) => `
Pattern ${i}:
- Testo: "${p.pattern}"
- Tipo: ${p.type}
- Prima: "${p.contextBefore.slice(-120)}"
- Dopo: "${p.contextAfter.slice(0, 120)}"
`).join('\n')}

👤 PROFILO:
${profileFormatted}

📋 RISPOSTA (JSON array):
[
  {
    "pattern_index": 0,
    "compile": true,
    "value": "valore esatto dal profilo o vuoto",
    "reason": "breve spiegazione (max 20 char)"
  }
]

IMPORTANTE:
- SOLO JSON, nessun markdown
- Compile false se Stazione Appaltante
- Value ESATTO dal profilo
- Reason BREVISSIMA

RISPOSTA:`;

  try {
    const response = await callAI(prompt, {
      maxTokens: 8000,
      temperature: 0.1
    });
    
    // Parse JSON
    const cleaned = response.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.log('Response preview:', response.substring(0, 200));
      return [];
    }
    
    const mappings = JSON.parse(jsonMatch[0]);
    console.log('✅ Mappings ricevuti:', mappings.length);
    
    // Mappa a formato finale
    const result = mappings.map(m => {
      const pattern = relevantPatterns[m.pattern_index];
      if (!pattern) {
        console.warn('⚠️ Pattern index non valido:', m.pattern_index);
        return null;
      }
      
      return {
        pattern: pattern,
        shouldCompile: m.compile === true,
        value: m.value || '',
        reason: m.reason || ''
      };
    }).filter(m => m !== null);
    
    console.log('✅ Mappings validi:', result.length);
    console.log('🗺️ ========================================');
    
    return result;
    
  } catch (error) {
    console.error('❌ Errore mapping Claude:', error);
    return [];
  }
}

