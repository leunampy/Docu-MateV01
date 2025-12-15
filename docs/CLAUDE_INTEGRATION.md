# Integrazione Claude API (Anthropic) in DocuMate-AI

## 📋 Panoramica

DocuMate-AI ora utilizza **Claude Sonnet 4** (Anthropic) invece di OpenAI per l'analisi e compilazione di documenti amministrativi italiani.

## 🚀 Setup Iniziale

### 1. Installazione Dipendenze

Le dipendenze sono già installate:
```bash
npm install @anthropic-ai/sdk
```

### 2. Configurazione API Key

Crea il file `.env.local` nella root del progetto:

```bash
# .env.local
VITE_ANTHROPIC_API_KEY=sk-ant-la-tua-chiave-api-qui
```

**Come ottenere la chiave API:**
1. Vai su https://console.anthropic.com/
2. Crea un account o accedi
3. Vai su "API Keys"
4. Crea una nuova chiave
5. Copia la chiave (inizia con `sk-ant-`)
6. Incollala in `.env.local`

⚠️ **IMPORTANTE**: Non committare `.env.local` nel repository! È già nel `.gitignore`.

### 3. Test Connessione

Verifica che l'integrazione funzioni:

```bash
npm run test:claude
```

Lo script esegue 4 test:
- ✅ Connessione base
- ✅ Prompt semplice
- ✅ Risposta JSON
- ✅ Analisi documento italiano

## 📁 File Modificati/Creati

### File Creati (4)

1. **`src/lib/claude-client.js`**
   - Client Claude API completo
   - Rate limiting (50 req/min)
   - Retry con exponential backoff (3 tentativi)
   - Cost tracking e logging
   - Funzioni: `callClaude()`, `analyzeDocumentWithClaude()`, `testClaudeConnection()`

2. **`test-claude-connection.js`**
   - Script di test per verificare l'integrazione
   - 4 test completi
   - Usage: `node test-claude-connection.js`

3. **`.env.local`** (da creare manualmente)
   - Configurazione API key
   - Template: `VITE_ANTHROPIC_API_KEY=sk-ant-PLACEHOLDER`

4. **`docs/CLAUDE_INTEGRATION.md`** (questo file)
   - Documentazione completa

### File Modificati (3)

1. **`src/lib/ai.js`**
   - Aggiornato per usare `callClaude()` invece di Ollama
   - Mantiene backward compatibility con `callAI()`

2. **`src/pages/CompileDocument.jsx`**
   - Import: `analyzeDocumentWithClaude` da `@/lib/claude-client`
   - Sostituito: `analyzeDocumentWithAI` → `analyzeDocumentWithClaude`

3. **`package.json`**
   - Aggiunto script: `"test:claude": "node test-claude-connection.js"`

### File Verificati (1)

1. **`src/lib/aiVisionAnalysis.js`**
   - ✅ Già usa `callAI` da `./ai`
   - ✅ Funziona automaticamente con Claude (via backward compatibility)

## ⚙️ Configurazione

### Parametri Claude Client

In `src/lib/claude-client.js`:

```javascript
const CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 16000,
  temperature: 0.3,
  rateLimit: {
    requestsPerMinute: 50,
    intervalMs: 1200, // 1200ms = 50 req/min
  },
  retry: {
    maxAttempts: 3,
    delays: [1000, 2000, 4000], // Exponential backoff
  },
};
```

### Modificare i Parametri

Per cambiare modello o parametri, modifica `CONFIG` in `claude-client.js`:

```javascript
// Esempio: usare Claude Opus
model: 'claude-opus-20240229',

// Esempio: aumentare temperatura per più creatività
temperature: 0.7,

// Esempio: aumentare max tokens
maxTokens: 32000,
```

## 💰 Costi

### Pricing Claude Sonnet 4 (2025)

- **Input**: $3.00 per 1M tokens
- **Output**: $15.00 per 1M tokens

### Stima Costi per Documento

Un documento tipico richiede:
- **Input**: ~2,000-5,000 tokens (testo documento + pattern + profilo)
- **Output**: ~500-1,500 tokens (mapping JSON)

**Costo stimato per documento**: ~$0.06

Esempio:
- Input: 3,000 tokens = $0.009
- Output: 1,000 tokens = $0.015
- **Totale**: ~$0.024 per documento

⚠️ **Nota**: I costi sono tracciati nei log della console durante l'esecuzione.

## 🔧 Funzionalità

### Rate Limiting

Il client gestisce automaticamente il rate limiting:
- **50 richieste/minuto** (configurabile)
- Queue automatica con attesa tra richieste
- Logging con emoji: `⏳ Rate limit: attesa Xms...`

### Retry Logic

Retry automatico con exponential backoff:
- **3 tentativi** massimi
- Delays: 1s, 2s, 4s
- Logging: `🔄 Retry X/3 dopo Xms...`

### Cost Tracking

Ogni chiamata mostra:
```
📊 ========== USAGE & COST ==========
📥 Input tokens: 3245
📤 Output tokens: 1234
💰 Costo input: $0.009735
💰 Costo output: $0.018510
💰 Totale: $0.0282
=====================================
```

### Logging

Tutti i log usano emoji per facilitare il debug:
- 🤖 = Operazioni AI/Claude
- ✅ = Successo
- ❌ = Errore
- 📊 = Statistiche/Costi
- 💰 = Costi
- ⏳ = Attesa/Rate limit
- 🔄 = Retry

## 🐛 Troubleshooting

### Errore: "VITE_ANTHROPIC_API_KEY non configurata"

**Soluzione:**
1. Verifica che `.env.local` esista nella root
2. Verifica che contenga: `VITE_ANTHROPIC_API_KEY=sk-ant-...`
3. Riavvia il server dev: `npm run dev`

### Errore: "API key invalid"

**Soluzione:**
1. Verifica che la chiave sia corretta (inizia con `sk-ant-`)
2. Verifica che la chiave sia attiva su https://console.anthropic.com/
3. Controlla i crediti disponibili

### Errore: "Rate limit exceeded"

**Soluzione:**
- Il client gestisce automaticamente il rate limiting
- Se persiste, aumenta `intervalMs` in `CONFIG.rateLimit`

### Errore: "Model not found"

**Soluzione:**
- Verifica che il modello `claude-sonnet-4-20250514` sia disponibile
- Controlla https://docs.anthropic.com/claude/docs/models-overview per modelli disponibili
- Aggiorna `CONFIG.model` se necessario

### JSON non valido nella risposta

**Soluzione:**
- Il client pulisce automaticamente markdown (```json)
- Se persiste, verifica il prompt in `analyzeDocumentWithClaude()`
- Aumenta `maxTokens` se la risposta è troncata

## 📝 Esempi d'Uso

### Chiamata Base

```javascript
import { callClaude } from '@/lib/claude-client';

const response = await callClaude('Dimmi la capitale d\'Italia');
console.log(response); // "Roma"
```

### Analisi Documento

```javascript
import { analyzeDocumentWithClaude } from '@/lib/claude-client';

const mappings = await analyzeDocumentWithClaude(
  extractedText,
  patterns,
  profileData
);
// Restituisce array di mapping per compilazione
```

### Test Connessione

```javascript
import { testClaudeConnection } from '@/lib/claude-client';

const result = await testClaudeConnection();
if (result.success) {
  console.log('✅ Claude funzionante!');
}
```

## 🔄 Backward Compatibility

Il codice esistente continua a funzionare:

```javascript
// Funziona ancora (usa Claude sotto il cofano)
import { callAI } from '@/lib/ai';
const response = await callAI('prompt');
```

## 📚 Risorse

- **Documentazione Anthropic**: https://docs.anthropic.com/
- **Console API**: https://console.anthropic.com/
- **Modelli disponibili**: https://docs.anthropic.com/claude/docs/models-overview
- **Pricing**: https://www.anthropic.com/pricing

## ✅ Checklist Post-Integrazione

- [x] Installato `@anthropic-ai/sdk`
- [x] Creato `src/lib/claude-client.js`
- [x] Aggiornato `src/lib/ai.js`
- [x] Aggiornato `src/pages/CompileDocument.jsx`
- [x] Verificato `src/lib/aiVisionAnalysis.js`
- [x] Creato `test-claude-connection.js`
- [x] Aggiunto script `test:claude` in `package.json`
- [ ] **Configurare `VITE_ANTHROPIC_API_KEY` in `.env.local`**
- [ ] **Eseguire `npm run test:claude` per verificare**
- [ ] **Testare compilazione documento reale**

## 🎯 Next Steps

1. **Configura API Key**: Aggiungi la tua chiave in `.env.local`
2. **Test**: Esegui `npm run test:claude`
3. **Test Reale**: Compila un documento di prova
4. **Monitora Costi**: Controlla i log per i costi per documento
5. **Ottimizza**: Aggiusta `temperature` e `maxTokens` se necessario

---

**Ultimo aggiornamento**: 2025-01-XX
**Versione Claude**: Sonnet 4 (20250514)









