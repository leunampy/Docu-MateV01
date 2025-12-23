// src/lib/ai-client.js
// Client AI con Cerebras (Llama 3.1 70B)

const CONFIG = {
  cerebrasUrl: 'https://api.cerebras.ai/v1/chat/completions',
  apiKey: import.meta.env.VITE_CEREBRAS_API_KEY,
  model: 'llama3.1-70b',
  maxTokens: 8000,
  temperature: 0.3,
};

const callCerebras = async (prompt, opts = {}) => {
  const { systemPrompt = null, temperature = CONFIG.temperature, maxTokens = CONFIG.maxTokens } = opts;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    console.log('🤖 Chiamata Cerebras...');
    const response = await fetch(CONFIG.cerebrasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cerebras error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Risposta ricevuta');
    return data.choices[0].message.content || '';
  } catch (error) {
    console.error('❌ Errore Cerebras:', error);
    throw new Error(`AI non disponibile: ${error.message}`);
  }
};

export const callAI = async (prompt, opts = {}) => {
  return await callCerebras(prompt, opts);
};

export const analyzeDocumentWithAI = async (text, patterns, profileData) => {
  const availableData = Object.entries(profileData)
    .filter(([_, value]) => value && value !== '[DA COMPILARE]' && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const optimizedText = text.substring(0, 15000).replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  const relevantPatterns = patterns
    .filter((p) => {
      const context = (p.contextBefore + p.contextAfter).toLowerCase();
      if (context.includes('stazione appaltante') || context.includes('amministrazione aggiudicatrice') || context.includes('ente aggiudicatore')) {
        return false;
      }
      return context.includes('operatore economico') || context.includes('il sottoscritto') || context.includes('partecipante') || context.includes('concorrente');
    })
    .slice(0, 30);

  const systemPrompt = `Sei un esperto nella compilazione di documenti amministrativi e legali italiani. Il tuo compito è analizzare documenti e creare mapping precisi per compilare i pattern identificati.`;

  const prompt = `Sei un esperto nella compilazione di documenti amministrativi italiani.

🎯 REGOLE CRITICHE:
1. SEZIONI DA NON COMPILARE: Stazione Appaltante, Amministrazione aggiudicatrice, Ente aggiudicatore
2. SEZIONI DA COMPILARE: Operatore Economico, Il sottoscritto, Partecipante/Concorrente

📄 DOCUMENTO: ${optimizedText}

🔍 PATTERN (${relevantPatterns.length}):
${relevantPatterns.map((p, i) => `${i}. "${p.pattern}" Before:"${p.contextBefore.slice(-100)}" After:"${p.contextAfter.slice(0, 100)}"`).join('\n')}

👤 DATI PROFILO:
${availableData}

Rispondi SOLO con JSON array:
[{"pattern_index":0,"reasoning":"...","section":"...","label":"...","profile_field":"...","should_compile":true,"value":"...","confidence":0.98}]`;

  try {
    const response = await callAI(prompt, { systemPrompt, temperature: 0.1, maxTokens: 8000 });
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('❌ Errore analisi AI:', err);
    return [];
  }
};

export const generateText = async (prompt) => {
  try {
    const text = await callAI(prompt);
    return { data: { result: text }, success: true };
  } catch (error) {
    return { data: { result: 'Errore durante la generazione.' }, success: false, error: error.message };
  }
};

export const testAIConnection = async () => {
  try {
    const response = await callAI('Rispondi solo con "OK"', { maxTokens: 10, temperature: 0 });
    return { success: true, provider: 'cerebras', response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
