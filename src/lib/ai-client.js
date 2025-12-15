// src/lib/ai-client.js
// Client AI con solo Ollama (locale + produzione)

const CONFIG = {
  // URL Ollama - in produzione userà l'URL del server Fly.io
  ollamaUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434/api/generate',
  localModel: 'llama3.2:latest',
  maxTokens: 16000,
  temperature: 0.3,
};

const callOllama = async (prompt, opts = {}) => {
  const { systemPrompt = null, temperature = CONFIG.temperature, maxTokens = CONFIG.maxTokens } = opts;
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  try {
    console.log('🤖 Chiamata Ollama...');
    const response = await fetch(CONFIG.ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CONFIG.localModel,
        prompt: fullPrompt,
        stream: false,
        options: { temperature, num_predict: maxTokens },
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json();
    console.log('✅ Risposta ricevuta');
    return data.response || '';
  } catch (error) {
    console.error('❌ Errore Ollama:', error);
    throw new Error(`Ollama non disponibile: ${error.message}`);
  }
};

export const callAI = async (prompt, opts = {}) => {
  return await callOllama(prompt, opts);
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
    return { success: true, provider: 'ollama', response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
