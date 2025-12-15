// src/lib/claude-granular-mapper.js
// Claude mappa OGNI SINGOLO pattern con precisione

import { callAI } from './ai-client';

/**
 * Claude mappa OGNI SINGOLO pattern
 */
export async function mapPatternsGranular(patterns, profileData) {
  console.log('🤖 ========== CLAUDE MAPPATURA GRANULARE ==========');
  console.log('📊 Pattern da mappare:', patterns.length);
  
  // Limita a 80 pattern per volta
  const limitedPatterns = patterns.slice(0, 80);
  
  const profileFormatted = Object.entries(profileData)
    .filter(([_, v]) => v && v !== '[DA COMPILARE]' && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  
  const prompt = `Mappa OGNI SINGOLO pattern alla risposta corretta.

👤 DATI DISPONIBILI:
${profileFormatted}

🔍 PATTERN DA COMPILARE (${limitedPatterns.length}):

${limitedPatterns.map((p, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pattern ${i}:
Tipo: ${p.type}
Label identificata: "${p.label}"
Testo PRIMA: "...${p.contextBefore.slice(-100)}"
PATTERN: "${p.pattern.substring(0, 30)}"
Testo DOPO: "${p.contextAfter.substring(0, 100)}..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('\n')}

🎯 COMPITO:
Per OGNI pattern sopra (0-${limitedPatterns.length - 1}):

1. Leggi il CONTESTO (testo prima/dopo)
2. Identifica a quale CAMPO si riferisce
3. Se è campo OPERATORE ECONOMICO → compile: true
4. Se è campo STAZIONE APPALTANTE → compile: false
5. Se compile: true → trova valore ESATTO dal profilo
6. Se non trovi valore → compile: false, value: ""

⚠️ REGOLE CRITICHE:
- UN pattern = UNA risposta
- Risposta ESATTA dal profilo (no invenzioni)
- Se label è "Nome" o "Il sottoscritto" → usa nome_completo o rappresentante_legale
- Se label è "C.F." o "Codice Fiscale" → usa codice_fiscale
- Se label è "P.IVA" o "Partita IVA" → usa partita_iva
- Se label è "Via" o "Indirizzo" → usa indirizzo (solo via e numero, no CAP)
- Se label è "CAP" → usa cap
- Se label è "Città" o "Comune" → usa citta
- Se label è "Prov" o "Provincia" → usa provincia
- Se label è "Email" o "PEC" → usa email_aziendale o pec
- Se label è "Tel" o "Telefono" → usa telefono_aziendale
- Se label contiene "Stazione" o "Amministrazione" → compile: false

📋 OUTPUT JSON (array con ${limitedPatterns.length} elementi):
[
  {
    "pattern_index": 0,
    "field_identified": "nome_completo",
    "compile": true,
    "value": "Mario Rossi",
    "confidence": 0.95
  },
  {
    "pattern_index": 1,
    "field_identified": "codice_fiscale",
    "compile": true,
    "value": "RSSMRA80A01H501U",
    "confidence": 0.98
  },
  {
    "pattern_index": 2,
    "field_identified": "stazione_appaltante",
    "compile": false,
    "value": "",
    "confidence": 0.99
  }
]

IMPORTANTE:
- SOLO JSON, no markdown, no testo extra
- ESATTAMENTE ${limitedPatterns.length} elementi nell'array
- pattern_index = numero progressivo 0-${limitedPatterns.length - 1}
- value = ESATTO dal profilo o ""
- confidence = 0.0-1.0

RISPOSTA:`;

  try {
    const response = await callAI(prompt, {
      maxTokens: 16000,
      temperature: 0.0  // Massima determinismo
    });
    
    // Parse JSON
    const cleaned = response.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('❌ Response preview:', response.substring(0, 500));
      throw new Error('Claude non ha generato JSON valido');
    }
    
    const mappings = JSON.parse(jsonMatch[0]);
    console.log('✅ Mappings ricevuti:', mappings.length);
    
    // Valida
    if (mappings.length !== limitedPatterns.length) {
      console.warn(`⚠️  Mappings count mismatch: ${mappings.length} vs ${limitedPatterns.length}`);
    }
    
    // Log sample
    console.log('\n📋 Sample mappings (primi 10):');
    mappings.slice(0, 10).forEach(m => {
      console.log(`${m.pattern_index}. ${m.field_identified} → "${m.value.substring(0, 30)}" (${m.compile ? 'COMPILA' : 'SKIP'})`);
    });
    
    console.log('🤖 ========================================\n');
    
    return mappings;
    
  } catch (error) {
    console.error('❌ Errore mapping Claude:', error);
    throw error;
  }
}

/**
 * Compila documento con mappings granulari
 */
export async function compileWithGranularMappings(file, patterns, mappings) {
  console.log('📝 ========== COMPILAZIONE CON MAPPINGS GRANULARI ==========');
  
  // Leggi file come ArrayBuffer
  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
  
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const xmlFile = zip.file('word/document.xml');
  if (!xmlFile) {
    throw new Error('document.xml non trovato nel DOCX');
  }
  
  let xml = await xmlFile.async('string');
  console.log('📄 XML caricato:', xml.length, 'caratteri');
  
  let compiledCount = 0;
  let skippedCount = 0;
  
  // IMPORTANTE: Sostituire dall'ULTIMO al PRIMO
  // per evitare di spostare gli indici
  const sortedMappings = [...mappings]
    .map((m, i) => ({ ...m, originalIndex: i }))
    .sort((a, b) => {
      const indexA = patterns[a.pattern_index]?.index || 0;
      const indexB = patterns[b.pattern_index]?.index || 0;
      return indexB - indexA; // Ordine inverso
    });
  
  for (const mapping of sortedMappings) {
    const pattern = patterns[mapping.pattern_index];
    
    if (!pattern) {
      console.warn(`⚠️  Pattern index non valido: ${mapping.pattern_index}`);
      continue;
    }
    
    if (!mapping.compile || !mapping.value) {
      skippedCount++;
      console.log(`⏭️  Skip pattern ${mapping.pattern_index}: ${pattern.label || pattern.pattern.substring(0, 20)}`);
      continue;
    }
    
    // Trova pattern nel XML
    const patternText = pattern.pattern;
    
    // Escape pattern per XML (gestisce caratteri speciali)
    const escapedPattern = patternText
      .replace(/\\/g, '\\\\')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\./g, '\\.')
      .replace(/\?/g, '\\?')
      .replace(/\*/g, '\\*')
      .replace(/\+/g, '\\+')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\|/g, '\\|')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
    
    // Cerca nell'XML
    const regex = new RegExp(escapedPattern);
    if (!regex.test(xml)) {
      console.warn(`⚠️  Pattern non trovato in XML: ${patternText.substring(0, 30)}`);
      continue;
    }
    
    // Escape value per XML
    const safeValue = String(mapping.value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    // Sostituisci PRIMA occorrenza (senza flag 'g')
    xml = xml.replace(regex, safeValue);
    
    compiledCount++;
    console.log(`✅ ${mapping.pattern_index}. ${pattern.label || 'No label'} → "${mapping.value.substring(0, 30)}"`);
  }
  
  console.log(`\n📊 RISULTATI:`);
  console.log(`✅ Compilati: ${compiledCount}`);
  console.log(`⏭️  Skippati: ${skippedCount}`);
  console.log(`📋 Totale: ${mappings.length}`);
  
  // Salva
  zip.file('word/document.xml', xml);
  const blob = await zip.generateAsync({ 
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  
  console.log('✅ DOCX compilato generato:', blob.size, 'bytes');
  console.log('📝 ========================================\n');
  
  return blob;
}

