/**
 * Pattern Detection Engine - Riconosce TUTTI i tipi di pattern
 */

export const PATTERN_TYPES = {
  ELLIPSIS: 'ellipsis',
  UNDERSCORE: 'underscore',
  DOTS: 'dots',
  SPACES: 'spaces',
  BRACKETS_EMPTY: 'brackets_empty'
};

export const PATTERN_REGEX = {
  [PATTERN_TYPES.ELLIPSIS]: /\[…+\]/g,
  [PATTERN_TYPES.UNDERSCORE]: /_{5,}/g,
  [PATTERN_TYPES.DOTS]: /\[\.{5,}\]/g,
  [PATTERN_TYPES.SPACES]: /\[\s{5,}\]/g,
  [PATTERN_TYPES.BRACKETS_EMPTY]: /\[\s*\]/g,
  // Pattern aggiuntivi per Domande Partecipazione
  'underscores_spaced': /\s_{3,}\s/g,
  'dashes': /-{3,}/g,
  'parentheses_dots': /\(\.{3,}\)/g,
  'dots_standalone': /\.{3,}/g
};

/**
 * Trova TUTTI i pattern nel documento
 */
export const detectAllPatterns = (text) => {
  console.log("🔍 ========== MULTI-PATTERN DETECTION ==========");
  
  const allPatterns = [];
  
  Object.entries(PATTERN_REGEX).forEach(([type, regex]) => {
    const matches = [...text.matchAll(regex)];
    console.log(`  ${type}: ${matches.length} trovati`);
    
    matches.forEach(match => {
      allPatterns.push({
        type,
        pattern: match[0],
        index: match.index,
        contextBefore: text.substring(Math.max(0, match.index - 150), match.index),
        contextAfter: text.substring(match.index + match[0].length, Math.min(text.length, match.index + match[0].length + 150))
      });
    });
  });
  
  // Ordina per posizione nel documento
  allPatterns.sort((a, b) => a.index - b.index);
  
  let parteIIIndex = text.indexOf("Parte II: Informazioni sull'operatore economico");
  if (parteIIIndex === -1) {
    console.warn('⚠️ "Parte II: Informazioni sull\'operatore economico" non trovata, fallback generico');
    const alt1 = text.indexOf('Parte II:');
    const alt2 = text.indexOf('PARTE II');
    parteIIIndex = alt1 !== -1 ? alt1 : alt2;
  }

  let parteIIIIndex = text.indexOf('Parte III');
  if (parteIIIIndex === -1) parteIIIIndex = text.indexOf('PARTE III');

  let parteIVIndex = text.indexOf('Parte IV');
  if (parteIVIndex === -1) parteIVIndex = text.indexOf('PARTE IV');

  const skipKeywords = [
    'istruzioni per',
    'le informazioni richieste',
    'saranno acquisite automaticamente',
    'massimo numero',
    'header',
    'footer',
    'indice',
    'sommario'
  ];

  const validPatterns = allPatterns.filter((p) => {
    if (parteIIIndex > 0 && p.index < parteIIIndex) {
      console.log('⏭️  Skip pattern prima di Parte II:', p.pattern);
      return false;
    }

    const context = (p.contextBefore + p.contextAfter).toLowerCase();
    if (skipKeywords.some((keyword) => context.includes(keyword))) {
      console.log('⏭️  Skip pattern in sezione istruzioni/header:', p.pattern);
      return false;
    }

    return true;
  });

  console.log(`  📊 Totale pattern trovati: ${allPatterns.length}`);
  console.log(`  ✅ Pattern validi (dopo Parte II): ${validPatterns.length}`);
  console.log(`  ⏭️  Pattern skippati: ${allPatterns.length - validPatterns.length}`);
  console.log('  Indici se trovati -> Parte II:', parteIIIndex, 'Parte III:', parteIIIIndex, 'Parte IV:', parteIVIndex);
  console.log("🔍 ========================================\n");
  
  return validPatterns;
};

/**
 * Estrae label da contesto
 */
export const extractLabelFromContext = (contextBefore) => {
  // Estrai ultima riga non vuota
  const lines = contextBefore.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.length > 0 && !line.match(/^[^\w]*$/)) {
      return line.replace(/[:：]/g, '').trim();
    }
  }
  return '';
};










