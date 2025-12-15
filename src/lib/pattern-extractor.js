// src/lib/pattern-extractor.js
// Estrae TUTTI i pattern con contesto dettagliato

/**
 * Estrae TUTTI i pattern con contesto dettagliato
 */
export function extractPatternsWithContext(text) {
  console.log('🔍 ========== ESTRAZIONE PATTERN CON CONTESTO ==========');
  
  const patterns = [];
  
  // Tutti i possibili pattern
  const patternTypes = [
    { name: 'ellipsis', regex: /\[\.{3,}\]/g },
    { name: 'dots_unicode', regex: /\[…+\]/g },
    { name: 'underscores', regex: /_{5,}/g },  // Minimo 5 underscore
    { name: 'dots', regex: /\.{5,}/g },
    { name: 'brackets_empty', regex: /\[\s{2,}\]/g },
    { name: 'lines', regex: /__+/g }  // Linee
  ];
  
  for (const type of patternTypes) {
    const matches = [...text.matchAll(type.regex)];
    
    for (const match of matches) {
      const index = match.index;
      const pattern = match[0];
      
      // Contesto: 200 caratteri prima e dopo
      const contextBefore = text.substring(
        Math.max(0, index - 200),
        index
      ).replace(/\s+/g, ' ').trim();
      
      const contextAfter = text.substring(
        index + pattern.length,
        Math.min(text.length, index + pattern.length + 200)
      ).replace(/\s+/g, ' ').trim();
      
      // Identifica la "label" più vicina (testo prima del pattern)
      // Es: "Nome: _____" → label = "Nome:"
      let label = '';
      
      // Metodo 1: Cerca "Testo:" prima del pattern
      const labelMatch1 = contextBefore.match(/([A-Za-zÀ-ÿ\s\.,']{2,40}):?\s*$/);
      if (labelMatch1) {
        label = labelMatch1[1].trim();
      }
      
      // Metodo 2: Se non trovata, cerca ultima parola
      if (!label) {
        const words = contextBefore.trim().split(/\s+/);
        label = words[words.length - 1] || '';
      }
      
      // Metodo 3: Cerca keywords comuni
      if (!label) {
        const keywords = ['nome', 'cognome', 'indirizzo', 'via', 'cap', 'città', 'email', 'tel', 'pec', 'c.f', 'p.iva', 'codice fiscale', 'partita iva'];
        for (const kw of keywords) {
          if (contextBefore.toLowerCase().includes(kw)) {
            label = kw;
            break;
          }
        }
      }
      
      patterns.push({
        index,
        type: type.name,
        pattern,
        label,
        contextBefore,
        contextAfter,
        length: pattern.length
      });
    }
  }
  
  // Ordina per posizione
  patterns.sort((a, b) => a.index - b.index);
  
  console.log('✅ Pattern trovati:', patterns.length);
  
  // Log sample
  console.log('\n📋 Sample pattern (primi 10):');
  patterns.slice(0, 10).forEach((p, i) => {
    console.log(`${i}. Label: "${p.label}" | Pattern: ${p.pattern.substring(0, 20)} | Before: "${p.contextBefore.slice(-50)}"`);
  });
  
  console.log('🔍 ========================================\n');
  
  return patterns;
}

