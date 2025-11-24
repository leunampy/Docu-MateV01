// src/lib/documentProcessor.js
// Funzioni per estrazione testo, OCR, identificazione campi e compilazione documenti

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

/**
 * Estrae il testo da un PDF originale (non scansionato)
 * @param {File} file - File PDF
 * @returns {Promise<string>} Testo estratto
 */
export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    return data.text || '';
  } catch (error) {
    console.error('Errore estrazione testo PDF:', error);
    throw new Error('Impossibile estrarre testo dal PDF. Il file potrebbe essere corrotto o scansionato.');
  }
}

/**
 * Estrae il testo da un PDF scansionato usando OCR
 * @param {File} file - File PDF scansionato
 * @param {Function} onProgress - Callback per progress (0-100)
 * @returns {Promise<string>} Testo estratto con OCR
 */
export async function extractTextWithOCR(file, onProgress = null) {
  try {
    const worker = await createWorker('ita+eng'); // Italiano e Inglese
    
    // Converti PDF in immagine (prima pagina per ora)
    // Nota: per PDF multi-pagina, serve convertire ogni pagina
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    let fullText = '';
    
    for (let i = 0; i < pages.length; i++) {
      if (onProgress) {
        onProgress(Math.round(((i + 1) / pages.length) * 100));
      }
      
      // Per ora estraiamo solo il testo se disponibile
      // OCR completo richiederebbe conversione PDF->immagine
      // Questo è un placeholder - in produzione servirebbe pdf2pic o simile
      const pageText = await worker.recognize(arrayBuffer);
      fullText += pageText.data.text + '\n';
    }
    
    await worker.terminate();
    return fullText.trim();
  } catch (error) {
    console.error('Errore OCR:', error);
    throw new Error('Impossibile eseguire OCR sul documento. Riprova con un file più chiaro.');
  }
}

/**
 * Estrae il testo da un file Word (.docx)
 * @param {File} file - File Word
 * @returns {Promise<string>} Testo estratto
 */
export async function extractTextFromWord(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Estrai solo il testo (senza placeholder)
    const fullText = doc.getFullText();
    return fullText || '';
  } catch (error) {
    console.error('Errore estrazione testo Word:', error);
    throw new Error('Impossibile estrarre testo dal documento Word. Il file potrebbe essere corrotto.');
  }
}

/**
 * Identifica i campi da compilare nel testo estratto
 * Cerca: placeholder [CAMPO], {{campo}}, <campo>, righe con underscore ____
 * @param {string} text - Testo estratto dal documento
 * @returns {Array<Object>} Array di campi trovati
 */
export function identifyFields(text) {
  const fields = [];
  const lines = text.split('\n');
  
  // Pattern per identificare campi
  const patterns = [
    /\[([A-Z_]+)\]/g,           // [CAMPO]
    /\{\{([a-zA-Z_]+)\}\}/g,    // {{campo}}
    /<([a-zA-Z_]+)>/g,          // <campo>
    /_{3,}/g,                    // ____ (underscore multipli)
  ];
  
  lines.forEach((line, lineIndex) => {
    // Pattern 1: [CAMPO]
    let match;
    while ((match = patterns[0].exec(line)) !== null) {
      fields.push({
        id: `field_${fields.length + 1}`,
        label: match[1].replace(/_/g, ' '),
        placeholder: match[0],
        type: 'bracket',
        position: { line: lineIndex + 1, column: match.index },
        originalText: line.trim(),
      });
    }
    
    // Pattern 2: {{campo}}
    patterns[0].lastIndex = 0; // Reset
    while ((match = patterns[1].exec(line)) !== null) {
      fields.push({
        id: `field_${fields.length + 1}`,
        label: match[1].replace(/_/g, ' '),
        placeholder: match[0],
        type: 'double_brace',
        position: { line: lineIndex + 1, column: match.index },
        originalText: line.trim(),
      });
    }
    
    // Pattern 3: <campo>
    patterns[1].lastIndex = 0;
    while ((match = patterns[2].exec(line)) !== null) {
      fields.push({
        id: `field_${fields.length + 1}`,
        label: match[1].replace(/_/g, ' '),
        placeholder: match[0],
        type: 'angle_bracket',
        position: { line: lineIndex + 1, column: match.index },
        originalText: line.trim(),
      });
    }
    
    // Pattern 4: Righe con underscore (considera come campo se la riga contiene solo underscore e spazi)
    if (/^[\s_]+$/.test(line) && line.trim().length >= 3) {
      fields.push({
        id: `field_${fields.length + 1}`,
        label: `Campo riga ${lineIndex + 1}`,
        placeholder: line.trim(),
        type: 'underscore',
        position: { line: lineIndex + 1, column: 0 },
        originalText: line.trim(),
      });
    }
  });
  
  // Rimuovi duplicati basati su posizione
  const uniqueFields = [];
  const seen = new Set();
  
  fields.forEach(field => {
    const key = `${field.position.line}-${field.position.column}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFields.push(field);
    }
  });
  
  return uniqueFields;
}

/**
 * Compila un PDF sostituendo i campi con i dati forniti
 * @param {Uint8Array} pdfBytes - Bytes del PDF originale
 * @param {Array<Object>} fieldMappings - Array di {fieldId, value}
 * @param {Object} data - Dati da inserire
 * @returns {Promise<Uint8Array>} PDF compilato
 */
export async function compilePDF(pdfBytes, fieldMappings, data) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    
    // Crea una mappa per accesso rapido
    const mappingMap = {};
    fieldMappings.forEach(m => {
      mappingMap[m.fieldId] = m.value || data[m.fieldId] || '';
    });
    
    // Per ogni campo identificato, inserisci il testo
    // Nota: pdf-lib non supporta direttamente la ricerca e sostituzione di testo
    // Dobbiamo sovrascrivere il testo nelle posizioni note
    // Questo è un approccio semplificato - in produzione servirebbe una libreria più avanzata
    
    pages.forEach((page, pageIndex) => {
      // Per ora, aggiungiamo il testo in fondo alla pagina come esempio
      // In produzione, servirebbe calcolare le coordinate esatte
      const { width, height } = page.getSize();
      
      // Questo è un placeholder - la vera implementazione richiederebbe
      // parsing del PDF per trovare le coordinate esatte dei campi
      Object.entries(mappingMap).forEach(([fieldId, value], index) => {
        if (value) {
          page.drawText(String(value), {
            x: 50,
            y: height - 50 - (index * 20),
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      });
    });
    
    const compiledBytes = await pdfDoc.save();
    return compiledBytes;
  } catch (error) {
    console.error('Errore compilazione PDF:', error);
    throw new Error('Impossibile compilare il PDF. Verifica che il file non sia protetto.');
  }
}

/**
 * Compila un documento Word sostituendo i placeholder con i dati
 * @param {Uint8Array} docxBytes - Bytes del documento Word originale
 * @param {Array<Object>} fieldMappings - Array di {fieldId, value}
 * @param {Object} data - Dati da inserire
 * @returns {Promise<Uint8Array>} Documento Word compilato
 */
export async function compileWord(docxBytes, fieldMappings, data) {
  try {
    const zip = new PizZip(docxBytes);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Prepara i dati per docxtemplater
    const templateData = {};
    fieldMappings.forEach(m => {
      const value = m.value || data[m.fieldId] || '';
      // Rimuovi underscore e formatta come chiave valida
      const key = m.fieldId.replace(/field_/g, '').replace(/\s+/g, '_').toLowerCase();
      templateData[key] = value;
    });
    
    // Sostituisci anche i placeholder diretti se presenti
    Object.entries(data).forEach(([key, value]) => {
      if (!templateData[key]) {
        templateData[key] = value;
      }
    });
    
    // Renderizza il documento
    doc.render(templateData);
    
    // Genera il documento compilato
    const buffer = doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE',
    });
    
    return buffer;
  } catch (error) {
    console.error('Errore compilazione Word:', error);
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map(e => e.properties.explanation)
        .join('\n');
      throw new Error(`Errore nel template Word: ${errorMessages}`);
    }
    throw new Error('Impossibile compilare il documento Word. Verifica il formato del file.');
  }
}

/**
 * Determina se un PDF è scansionato (immagine) o contiene testo
 * @param {File} file - File PDF
 * @returns {Promise<boolean>} true se è scansionato, false se contiene testo
 */
export async function isPDFScanned(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    
    // Se il testo estratto è molto breve rispetto alle pagine, probabilmente è scansionato
    const textLength = data.text ? data.text.trim().length : 0;
    const pageCount = data.numpages || 1;
    
    // Soglia: meno di 50 caratteri per pagina = probabilmente scansionato
    return textLength < (pageCount * 50);
  } catch (error) {
    console.error('Errore verifica PDF scansionato:', error);
    // In caso di errore, assumiamo che sia scansionato per sicurezza
    return true;
  }
}

/**
 * Estrae testo da un file (PDF o Word) automaticamente
 * @param {File} file - File da processare
 * @param {Function} onProgress - Callback per progress
 * @returns {Promise<{text: string, isScanned: boolean}>}
 */
export async function extractTextFromFile(file, onProgress = null) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    // Verifica se è scansionato
    const scanned = await isPDFScanned(file);
    
    if (scanned) {
      if (onProgress) onProgress(10);
      const text = await extractTextWithOCR(file, (progress) => {
        if (onProgress) onProgress(10 + Math.round(progress * 0.8));
      });
      if (onProgress) onProgress(100);
      return { text, isScanned: true };
    } else {
      if (onProgress) onProgress(50);
      const text = await extractTextFromPDF(file);
      if (onProgress) onProgress(100);
      return { text, isScanned: false };
    }
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    if (onProgress) onProgress(50);
    const text = await extractTextFromWord(file);
    if (onProgress) onProgress(100);
    return { text, isScanned: false };
  } else {
    throw new Error('Formato file non supportato. Supportati: PDF, DOCX');
  }
}

