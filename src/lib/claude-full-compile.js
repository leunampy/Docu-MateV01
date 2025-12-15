// src/lib/claude-full-compile.js
// Claude Full Generation - Compila documento completo senza pattern matching

import { callAI } from './ai-client';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

/**
 * Compila documento usando Claude Full Generation
 * Claude legge documento intero e genera versione compilata
 */
export async function compileDocumentWithClaudeFull(documentText, profileData) {
  console.log('🤖 ========== CLAUDE FULL GENERATION ==========');
  console.log('📄 Documento length:', documentText.length);
  console.log('👤 Profilo:', Object.keys(profileData).length, 'campi');

  // Prepara dati profilo in formato leggibile
  const profileFormatted = Object.entries(profileData)
    .filter(([_, value]) => value && value !== '[DA COMPILARE]' && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // Prompt ottimizzato
  const prompt = `Sei un esperto nella compilazione di documenti amministrativi e legali italiani.

📄 DOCUMENTO ORIGINALE DA COMPILARE:

${documentText}

👤 DATI OPERATORE ECONOMICO:

${profileFormatted}

🎯 COMPITO:

1. Leggi TUTTO il documento
2. Identifica TUTTI i campi da compilare (pattern tipo [...], ___, etc)
3. Per OGNI campo:
   - Se riguarda "OPERATORE ECONOMICO" → COMPILA con dati profilo
   - Se riguarda "STAZIONE APPALTANTE" o "AMMINISTRAZIONE" → LASCIA VUOTO
   - Se è una data non specificata → usa data odierna
4. Genera documento COMPLETO compilato

⚠️ REGOLE CRITICHE:

- Sezioni "Stazione Appaltante" → NON compilare (lascia pattern vuoti)
- Sezioni "Operatore Economico" → Compila con dati profilo
- "Il sottoscritto [_____]" → Usa nome e cognome completo
- "P.IVA [___________]" → Usa partita_iva (11 cifre)
- "Codice Fiscale [___]" → Usa codice_fiscale
- "Via [_____] n. [__]" → Dividi indirizzo su pattern multipli
- Mantieni TUTTA la struttura, titoli, note, istruzioni
- Non aggiungere testo extra, solo compilare campi vuoti

📋 OUTPUT:

Genera il documento COMPLETO compilato in formato Markdown:
- Usa # per titoli principali (es: "Parte II:")
- Usa ## per sottotitoli (es: "A: Informazioni sull'operatore")
- Usa **testo** per grassetto
- Mantieni tutti i paragrafi, istruzioni, note
- Sostituisci SOLO i pattern [...], ___, etc con valori corretti

IMPORTANTE: 
- NON riassumere o abbreviare il documento
- Genera documento COMPLETO parola per parola
- SOLO sostituisci pattern vuoti con valori

INIZIA IL DOCUMENTO COMPILATO:

`;

  console.log('📤 Invio a AI...');
  console.log('📊 Prompt length:', prompt.length);

  const response = await callAI(
    prompt,
    {
      maxTokens: 32000, // Documento può essere lungo
      temperature: 0.1  // Molto deterministico
    }
  );

  console.log('✅ Documento compilato ricevuto');
  console.log('📊 Response length:', response.length);

  return response;
}

/**
 * Converte Markdown semplice in DOCX
 */
export function markdownToDocx(markdownText) {
  console.log('📝 Converting Markdown → DOCX...');

  const lines = markdownText.split('\n');
  const paragraphs = [];

  for (const line of lines) {
    if (!line.trim()) {
      // Riga vuota
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    if (line.startsWith('# ')) {
      // Heading 1
      paragraphs.push(new Paragraph({
        text: line.substring(2).trim(),
        heading: HeadingLevel.HEADING_1
      }));
    } else if (line.startsWith('## ')) {
      // Heading 2
      paragraphs.push(new Paragraph({
        text: line.substring(3).trim(),
        heading: HeadingLevel.HEADING_2
      }));
    } else if (line.startsWith('### ')) {
      // Heading 3
      paragraphs.push(new Paragraph({
        text: line.substring(4).trim(),
        heading: HeadingLevel.HEADING_3
      }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Lista puntata
      paragraphs.push(new Paragraph({
        text: line.substring(2).trim(),
        bullet: { level: 0 }
      }));
    } else {
      // Testo normale - parse **bold** e *italic*
      const runs = parseInlineMarkdown(line);
      paragraphs.push(new Paragraph({ children: runs }));
    }
  }

  console.log('✅ DOCX generated:', paragraphs.length, 'paragraphs');

  return new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });
}

/**
 * Parse **bold** e *italic* inline
 */
function parseInlineMarkdown(text) {
  const runs = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Check for **bold**
    if (text.substring(i, i + 2) === '**') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }
      // Find closing **
      const closeIndex = text.indexOf('**', i + 2);
      if (closeIndex !== -1) {
        const boldText = text.substring(i + 2, closeIndex);
        runs.push(new TextRun({ text: boldText, bold: true }));
        i = closeIndex + 2;
        continue;
      }
    }

    // Check for *italic*
    if (text[i] === '*' && text[i + 1] !== '*') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }
      const closeIndex = text.indexOf('*', i + 1);
      if (closeIndex !== -1) {
        const italicText = text.substring(i + 1, closeIndex);
        runs.push(new TextRun({ text: italicText, italics: true }));
        i = closeIndex + 1;
        continue;
      }
    }

    currentText += text[i];
    i++;
  }

  if (currentText) {
    runs.push(new TextRun({ text: currentText }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text: text })];
}


