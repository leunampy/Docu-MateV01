// test-claude-connection.js
// Script di test per verificare l'integrazione Claude API
// Usage: node test-claude-connection.js

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carica variabili d'ambiente da .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

// Se non è nelle env, prova a leggere da .env.local
if (!API_KEY) {
  try {
    const envFile = readFileSync(join(__dirname, '.env.local'), 'utf-8');
    const match = envFile.match(/VITE_ANTHROPIC_API_KEY=(.+)/);
    if (match) {
      API_KEY = match[1].trim();
    }
  } catch (err) {
    // File non trovato, continuerà con undefined
  }
}

if (!API_KEY || API_KEY === 'sk-ant-PLACEHOLDER') {
  console.error('❌ ERRORE: VITE_ANTHROPIC_API_KEY non configurata o ancora placeholder');
  console.error('   Configura la chiave in .env.local');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: API_KEY,
});

// Test 1: Connessione base
async function testConnection() {
  console.log('\n🧪 TEST 1: Connessione base');
  console.log('='.repeat(50));
  
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Rispondi solo con "OK"' }],
    });
    
    const text = response.content[0].text;
    console.log('✅ Connessione riuscita');
    console.log(`📄 Risposta: "${text}"`);
    return true;
  } catch (error) {
    console.error('❌ Connessione fallita:', error.message);
    return false;
  }
}

// Test 2: Prompt semplice
async function testSimplePrompt() {
  console.log('\n🧪 TEST 2: Prompt semplice');
  console.log('='.repeat(50));
  
  try {
    const prompt = 'Dimmi il nome della capitale d\'Italia in una sola parola.';
    console.log(`📝 Prompt: "${prompt}"`);
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 20,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const text = response.content[0].text;
    const usage = response.usage;
    
    console.log('✅ Risposta ricevuta');
    console.log(`📄 Risposta: "${text}"`);
    console.log(`📊 Input tokens: ${usage.input_tokens}`);
    console.log(`📊 Output tokens: ${usage.output_tokens}`);
    return true;
  } catch (error) {
    console.error('❌ Test fallito:', error.message);
    return false;
  }
}

// Test 3: JSON response
async function testJSONResponse() {
  console.log('\n🧪 TEST 3: Risposta JSON');
  console.log('='.repeat(50));
  
  try {
    const prompt = `Genera un JSON con questo formato:
{
  "nome": "stringa",
  "eta": numero
}

Usa dati di esempio.`;
    
    console.log(`📝 Prompt: "${prompt.substring(0, 50)}..."`);
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const text = response.content[0].text;
    console.log('✅ Risposta ricevuta');
    console.log(`📄 Risposta:\n${text}`);
    
    // Prova a parsare JSON
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON valido parsato:', parsed);
      return true;
    } else {
      console.warn('⚠️ Nessun JSON valido trovato nella risposta');
      return false;
    }
  } catch (error) {
    console.error('❌ Test fallito:', error.message);
    return false;
  }
}

// Test 4: Documento italiano (simulazione)
async function testItalianDocument() {
  console.log('\n🧪 TEST 4: Analisi documento italiano');
  console.log('='.repeat(50));
  
  try {
    const prompt = `Sei un esperto nella compilazione di documenti amministrativi italiani.

DOCUMENTO ESTRATTO:
Il sottoscritto [_____] nato il [_____] a [_____], in qualità di [_____] dell'impresa [_____] con Partita IVA [_____].

DATI PROFILO DISPONIBILI:
ragione_sociale: Acme S.r.l.
partita_iva: IT12345678901
rappresentante_legale: Mario Rossi

COMPITO:
Identifica i pattern [_____] e mappa ai campi del profilo.

RISPOSTA (JSON array):
[
  {
    "pattern_index": 0,
    "section": "Dati Richiedente",
    "label": "Il sottoscritto",
    "profile_field": "rappresentante_legale",
    "should_compile": true,
    "value": "Mario Rossi",
    "confidence": 0.95
  }
]

SOLO JSON, nessun markdown.`;
    
    console.log(`📝 Prompt length: ${prompt.length} caratteri`);
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const text = response.content[0].text;
    const usage = response.usage;
    
    console.log('✅ Risposta ricevuta');
    console.log(`📄 Risposta:\n${text.substring(0, 200)}...`);
    console.log(`📊 Input tokens: ${usage.input_tokens}`);
    console.log(`📊 Output tokens: ${usage.output_tokens}`);
    
    // Prova a parsare JSON
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ JSON valido parsato: ${parsed.length} elementi`);
      console.log(`📋 Primo elemento:`, parsed[0]);
      return true;
    } else {
      console.warn('⚠️ Nessun JSON array valido trovato');
      return false;
    }
  } catch (error) {
    console.error('❌ Test fallito:', error.message);
    return false;
  }
}

// Esegui tutti i test
async function runAllTests() {
  console.log('🚀 ========== TEST CLAUDE API INTEGRATION ==========');
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log('='.repeat(50));
  
  const results = {
    connection: await testConnection(),
    simplePrompt: await testSimplePrompt(),
    jsonResponse: await testJSONResponse(),
    italianDocument: await testItalianDocument(),
  };
  
  console.log('\n📊 ========== RISULTATI FINALI ==========');
  console.log('='.repeat(50));
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  console.log('='.repeat(50));
  if (allPassed) {
    console.log('🎉 TUTTI I TEST SONO PASSATI!');
    console.log('✅ Integrazione Claude API funzionante');
  } else {
    console.log('⚠️ Alcuni test sono falliti. Controlla gli errori sopra.');
  }
  console.log('='.repeat(50));
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('💥 Errore fatale:', error);
  process.exit(1);
});

