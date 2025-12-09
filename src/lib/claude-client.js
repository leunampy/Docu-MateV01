// src/lib/claude-client.js
// Claude API Client per DocuMate-AI
// Configurazione: Claude Sonnet 4, rate limiting, retry, cost tracking

import Anthropic from '@anthropic-ai/sdk';

// ⚙️ CONFIGURAZIONE
const CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 16000,
  temperature: 0.3,
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Necessario per Vite/browser
  rateLimit: {
    requestsPerMinute: 50,
    intervalMs: 1200, // 1200ms = 50 req/min
  },
  retry: {
    maxAttempts: 3,
    delays: [1000, 2000, 4000], // Exponential backoff: 1s, 2s, 4s
  },
};

// 📊 Rate Limiting: Queue per gestire richieste
let lastRequestTime = 0;
const requestQueue = [];

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < CONFIG.rateLimit.intervalMs) {
    const waitTime = CONFIG.rateLimit.intervalMs - timeSinceLastRequest;
    console.log(`⏳ Rate limit: attesa ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// 🔄 Retry con exponential backoff
const retryWithBackoff = async (fn, attempt = 1) => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= CONFIG.retry.maxAttempts) {
      console.error(`❌ Retry fallito dopo ${attempt} tentativi:`, error);
      throw error;
    }
    
    const delay = CONFIG.retry.delays[attempt - 1] || 4000;
    console.log(`🔄 Retry ${attempt}/${CONFIG.retry.maxAttempts} dopo ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, attempt + 1);
  }
};

// 💰 Calcolo costo stimato (Claude Sonnet 4 pricing)
const calculateCost = (inputTokens, outputTokens) => {
  // Claude Sonnet 4 pricing (aggiornato al 2025):
  // Input: $3.00 per 1M tokens
  // Output: $15.00 per 1M tokens
  const inputCostPer1M = 3.0;
  const outputCostPer1M = 15.0;
  
  const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;
  const totalCost = inputCost + outputCost;
  
  return {
    inputTokens,
    outputTokens,
    inputCost: inputCost.toFixed(6),
    outputCost: outputCost.toFixed(6),
    totalCost: totalCost.toFixed(6),
    totalCostUSD: `$${totalCost.toFixed(4)}`,
  };
};

// 🤖 Inizializza client Anthropic
let anthropicClient = null;

const getClient = () => {
  if (!anthropicClient) {
    if (!CONFIG.apiKey) {
      throw new Error('❌ VITE_ANTHROPIC_API_KEY non configurata in .env.local');
    }
    
    anthropicClient = new Anthropic({
      apiKey: CONFIG.apiKey,
      dangerouslyAllowBrowser: CONFIG.dangerouslyAllowBrowser,
    });
    
    console.log('🤖 Claude client inizializzato');
  }
  
  return anthropicClient;
};

// 📤 Chiamata principale a Claude
export const callClaude = async (prompt, opts = {}) => {
  const {
    systemPrompt = null,
    model = CONFIG.model,
    maxTokens = CONFIG.maxTokens,
    temperature = CONFIG.temperature,
  } = opts;
  
  console.log('🤖 ========== CHIAMATA CLAUDE ==========');
  console.log(`📝 Prompt length: ${prompt.length} caratteri`);
  console.log(`⚙️ Model: ${model}`);
  console.log(`⚙️ Max tokens: ${maxTokens}`);
  console.log(`⚙️ Temperature: ${temperature}`);
  
  // Rate limiting
  await waitForRateLimit();
  
  // Retry con exponential backoff
  const response = await retryWithBackoff(async () => {
    const client = getClient();
    
    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];
    
    const requestParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
    };
    
    if (systemPrompt) {
      requestParams.system = systemPrompt;
    }
    
    console.log('📤 Invio richiesta a Claude...');
    const startTime = Date.now();
    
    const apiResponse = await client.messages.create(requestParams);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Risposta ricevuta in ${duration}ms`);
    
    // Estrai testo dalla risposta
    let text = '';
    if (apiResponse.content && apiResponse.content.length > 0) {
      const textBlock = apiResponse.content.find(block => block.type === 'text');
      if (textBlock) {
        text = textBlock.text;
      }
    }
    
    // Cost tracking
    const usage = apiResponse.usage || {};
    const cost = calculateCost(
      usage.input_tokens || 0,
      usage.output_tokens || 0
    );
    
    console.log('📊 ========== USAGE & COST ==========');
    console.log(`📥 Input tokens: ${cost.inputTokens}`);
    console.log(`📤 Output tokens: ${cost.outputTokens}`);
    console.log(`💰 Costo input: $${cost.inputCost}`);
    console.log(`💰 Costo output: $${cost.outputCost}`);
    console.log(`💰 Totale: ${cost.totalCostUSD}`);
    console.log('=====================================');
    
    return {
      text,
      usage,
      cost,
      response: apiResponse,
    };
  });
  
  console.log('✅ ========== CHIAMATA COMPLETATA ==========');
  return response.text;
};

// 🔍 Analisi documento con Claude (specializzato per documenti italiani)
export const analyzeDocumentWithClaude = async (text, patterns, profileData) => {
  console.log('🤖 ========== ANALISI DOCUMENTO CON CLAUDE ==========');
  console.log(`📄 Testo documento: ${text.length} caratteri`);
  console.log(`🔍 Pattern da analizzare: ${patterns.length}`);
  
  const availableData = Object.entries(profileData)
    .filter(([_, value]) => value && value !== '[DA COMPILARE]' && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  const patternsSummary = patterns.slice(0, 50).map((p, i) => 
    `${i + 1}. Pattern: "${p.pattern}" (${p.type})
       Context Before: "${p.contextBefore.substring(Math.max(0, p.contextBefore.length - 80))}"
       Context After: "${p.contextAfter.substring(0, 80)}"`
  ).join('\n\n');
  
  const systemPrompt = `Sei un esperto nella compilazione di documenti amministrativi e legali italiani.
Il tuo compito è analizzare documenti e creare mapping precisi per compilare i pattern identificati.`;
  
  const prompt = `Sei un esperto nella compilazione di documenti amministrativi e legali italiani.

DOCUMENTO ESTRATTO (primi 5000 caratteri):
${text.substring(0, 5000)}

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
    console.log(`🤖 Chiamata Claude con ${patterns.length} pattern...`);
    const response = await callClaude(prompt, {
      systemPrompt,
      temperature: 0.2, // Più deterministico per analisi strutturate
    });
    
    // Parse response
    let cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ Claude non ha restituito JSON valido');
      console.error('📄 Response:', cleanResponse.substring(0, 500));
      return [];
    }
    
    const mappings = JSON.parse(jsonMatch[0]);
    console.log(`✅ Claude ha identificato ${mappings.length} mapping`);
    
    return mappings;
    
  } catch (err) {
    console.error('❌ Errore analisi Claude:', err);
    return [];
  }
};

// 🧪 Test connessione Claude
export const testClaudeConnection = async () => {
  console.log('🧪 ========== TEST CONNESSIONE CLAUDE ==========');
  
  try {
    if (!CONFIG.apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY non configurata');
    }
    
    const testPrompt = 'Rispondi solo con "OK" se ricevi questo messaggio.';
    const response = await callClaude(testPrompt, {
      maxTokens: 10,
      temperature: 0,
    });
    
    console.log('✅ Test connessione riuscito');
    console.log('📄 Risposta:', response);
    
    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error('❌ Test connessione fallito:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

