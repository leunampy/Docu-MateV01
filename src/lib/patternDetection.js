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
  [PATTERN_TYPES.BRACKETS_EMPTY]: /\[\s*\]/g
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
  
  console.log(`  📊 Totale pattern trovati: ${allPatterns.length}`);
  console.log("🔍 ========================================\n");
  
  return allPatterns;
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









