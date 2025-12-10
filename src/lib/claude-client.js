// src/lib/claude-client.js
// Claude API Client per DocuMate-AI
// Configurazione: Claude Sonnet 4, rate limiting, retry, cost tracking

import Anthropic from '@anthropic-ai/sdk';

const CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 16000,
  temperature: 0.3,
  // @ts-ignore Vite env injection
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
  rateLimit: { requestsPerMinute: 50, intervalMs: 1200 },
  retry: { maxAttempts: 3, delays: [1000, 2000, 4000] },
};

let lastRequestTime = 0;
const waitForRateLimit = async () => {
  const now = Date.now();
  const delta = now - lastRequestTime;
  if (delta < CONFIG.rateLimit.intervalMs) {
    const waitMs = CONFIG.rateLimit.intervalMs - delta;
    console.log(`⏳ Rate limit: attesa ${waitMs}ms...`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  lastRequestTime = Date.now();
};

const retryWithBackoff = async (fn, attempt = 1) => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= CONFIG.retry.maxAttempts) throw error;
    const delay = CONFIG.retry.delays[attempt - 1] || 4000;
    console.log(`🔄 Retry ${attempt}/${CONFIG.retry.maxAttempts} dopo ${delay}ms...`);
    await new Promise((r) => setTimeout(r, delay));
    return retryWithBackoff(fn, attempt + 1);
  }
};

const calculateCost = (inputTokens, outputTokens) => {
  const inputCostPer1M = 3.0;
  const outputCostPer1M = 15.0;
  const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;
  const total = inputCost + outputCost;
  return {
    inputTokens,
    outputTokens,
    inputCost: inputCost.toFixed(6),
    outputCost: outputCost.toFixed(6),
    totalCost: total.toFixed(6),
    totalCostUSD: `$${total.toFixed(4)}`,
  };
};

let anthropicClient = null;
const getClient = () => {
  if (!anthropicClient) {
    if (!CONFIG.apiKey) throw new Error('VITE_ANTHROPIC_API_KEY non configurata');
    anthropicClient = new Anthropic({
      apiKey: CONFIG.apiKey,
      dangerouslyAllowBrowser: CONFIG.dangerouslyAllowBrowser,
    });
    console.log('🤖 Claude client inizializzato');
  }
  return anthropicClient;
};

export const callClaude = async (prompt, opts = {}) => {
  const {
    systemPrompt = null,
    model = CONFIG.model,
    maxTokens = CONFIG.maxTokens,
    temperature = CONFIG.temperature,
  } = opts;

  await waitForRateLimit();

  const result = await retryWithBackoff(async () => {
    const client = getClient();
    const messages = [{ role: 'user', content: prompt }];
    const requestParams = { model, max_tokens: maxTokens, temperature, messages };
    if (systemPrompt) requestParams.system = systemPrompt;

    const apiResponse = await client.messages.create(requestParams);

    let text = '';
    if (apiResponse.content?.length) {
      const textBlock = apiResponse.content.find((b) => b.type === 'text');
      if (textBlock) text = textBlock.text;
    }

    const usage = apiResponse.usage || {};
    const cost = calculateCost(usage.input_tokens || 0, usage.output_tokens || 0);
    console.log('📊 USAGE', usage, '💰', cost.totalCostUSD);

    return { text, usage, cost, response: apiResponse };
  });

  return result.text;
};

export const analyzeDocumentWithClaude = async (text, patterns, profileData) => {
  const availableData = Object.entries(profileData)
    .filter(([_, value]) => value && value !== '[DA COMPILARE]' && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const patternsSummary = patterns
    .slice(0, 50)
    .map(
      (p, i) =>
        `${i + 1}. Pattern: "${p.pattern}" (${p.type})
       Context Before: "${p.contextBefore.substring(Math.max(0, p.contextBefore.length - 80))}"
       Context After: "${p.contextAfter.substring(0, 80)}"`
    )
    .join('\n\n');

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
    const response = await callClaude(prompt, { systemPrompt, temperature: 0.2 });
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('❌ Errore analisi Claude:', err);
    return [];
  }
};

export const testClaudeConnection = async () => {
  try {
    if (!CONFIG.apiKey) throw new Error('VITE_ANTHROPIC_API_KEY non configurata');
    const response = await callClaude('Rispondi solo con "OK" se ricevi questo messaggio.', {
      maxTokens: 10,
      temperature: 0,
    });
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
