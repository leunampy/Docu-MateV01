# 🔒 Security Fixes - Guida Completa

## 📋 INDICE

1. [Prompt per Cursor](#prompt-per-cursor)
2. [Azioni Manuali Supabase](#azioni-manuali-supabase)
3. [Configurazioni Ambiente](#configurazioni-ambiente)
4. [Verifica Post-Fix](#verifica-post-fix)

---

## 🤖 PROMPT PER CURSOR

Copia e incolla questi prompt uno alla volta in Cursor. Ogni prompt risolve un problema specifico.

---

### PROMPT 1: Fix XSS Vulnerability (CRITICO)

```
Devo risolvere una vulnerabilità XSS critica nell'applicazione.

PROBLEMA:
Il file src/components/compile/DocumentPreview.jsx usa dangerouslySetInnerHTML senza sanitizzazione, permettendo esecuzione di codice JavaScript malevolo da documenti caricati dagli utenti.

AZIONE RICHIESTA:
1. Installa la libreria DOMPurify:
   npm install dompurify
   npm install --save-dev @types/dompurify

2. Nel file src/components/compile/DocumentPreview.jsx:
   - Importa DOMPurify all'inizio del file
   - Trova TUTTE le occorrenze di dangerouslySetInnerHTML
   - Wrappa il contenuto HTML con DOMPurify.sanitize()
   - Configura DOMPurify per permettere solo tag sicuri (p, br, strong, em, span, div)

3. Applica lo stesso fix in TUTTI i file che usano dangerouslySetInnerHTML:
   - src/components/document-generator/DocumentResult.jsx
   - src/pages/CompileDocument.jsx
   - Qualsiasi altro file che usi dangerouslySetInnerHTML

ESEMPIO DI FIX:
Prima:
dangerouslySetInnerHTML={{ __html: extractedText }}

Dopo:
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(extractedText, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'div', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class', 'style']
  })
}}

Trova e fixa TUTTI i casi nel codebase.
```

---

### PROMPT 2: Validazione File Upload (CRITICO)

```
Devo implementare validazione sicura per il file upload.

PROBLEMA:
Il file src/api/compileApi.js e src/api/documentsApi.js non validano:
- Dimensione file (possibile upload di file enormi)
- MIME type reale (solo estensione filename)
- Path traversal nel nome file
- Tipi di file permessi

AZIONE RICHIESTA:
1. Crea un nuovo file src/lib/file-validation.js con queste funzioni:

```javascript
export const FILE_VALIDATION = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ],
  ALLOWED_EXTENSIONS: ['pdf', 'docx', 'doc'],
};

export class FileValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FileValidationError';
  }
}

export function validateFile(file) {
  // 1. Valida che file esista
  if (!file) {
    throw new FileValidationError('Nessun file fornito');
  }

  // 2. Valida dimensione
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    const maxSizeMB = FILE_VALIDATION.MAX_SIZE / (1024 * 1024);
    throw new FileValidationError(`File troppo grande. Massimo ${maxSizeMB}MB consentiti.`);
  }

  if (file.size === 0) {
    throw new FileValidationError('Il file è vuoto');
  }

  // 3. Valida MIME type
  if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new FileValidationError(
      `Tipo file non supportato. Formati consentiti: PDF, DOCX, DOC`
    );
  }

  // 4. Valida estensione
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    throw new FileValidationError(
      `Estensione file non valida. Estensioni consentite: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  // 5. Valida nome file per path traversal
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    throw new FileValidationError('Nome file non valido');
  }

  return true;
}

export function sanitizeFilename(filename) {
  // Rimuove caratteri pericolosi, mantiene solo alfanumerici, punti, trattini, underscore
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function generateSecureFilename(userId, originalFilename) {
  const extension = originalFilename.split('.').pop()?.toLowerCase();
  const sanitized = sanitizeFilename(originalFilename.replace(`.${extension}`, ''));
  const timestamp = Date.now();
  const random = crypto.randomUUID();
  return `${userId}/${timestamp}_${random}.${extension}`;
}
```

2. Modifica src/api/compileApi.js:
   - Importa validateFile e generateSecureFilename
   - Aggiungi validazione all'inizio della funzione uploadDocument
   - Usa generateSecureFilename invece di concatenazione manuale

3. Modifica src/api/documentsApi.js:
   - Applica le stesse validazioni nella funzione uploadDocument

4. Modifica i componenti che gestiscono upload:
   - src/pages/CompileDocument.jsx
   - Cattura FileValidationError e mostra messaggio user-friendly

ESEMPIO:
```javascript
// In compileApi.js
import { validateFile, generateSecureFilename } from '../lib/file-validation';

export async function uploadDocument(file, userId, onProgress = null) {
  try {
    // Validazione
    validateFile(file);

    // Genera nome sicuro
    const fileName = generateSecureFilename(userId, file.name);

    // ... resto upload
  } catch (error) {
    if (error.name === 'FileValidationError') {
      throw error; // Rilancia per UI
    }
    console.error('Upload error:', error);
    throw new Error('Errore durante l\'upload del file');
  }
}
```

Implementa la validazione in TUTTI i punti di upload.
```

---

### PROMPT 3: Environment Variables Validation (CRITICO)

```
Devo implementare validazione delle variabili d'ambiente all'avvio dell'applicazione.

PROBLEMA:
L'app parte anche senza environment variables critiche, causando errori runtime.

AZIONE RICHIESTA:
1. Crea nuovo file src/lib/env-validation.js:

```javascript
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const OPTIONAL_ENV_VARS = [
  'VITE_CEREBRAS_API_KEY', // Opzionale se usi solo Edge Functions
];

export class EnvValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value || value === '' || value === 'undefined') {
      missing.push(varName);
    }
  });

  // Check optional variables
  OPTIONAL_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value || value === '' || value === 'undefined') {
      warnings.push(varName);
    }
  });

  // Log warnings
  if (warnings.length > 0) {
    console.warn(
      `⚠️  Warning: Optional environment variables not set:\n${warnings.map(v => `  - ${v}`).join('\n')}`
    );
  }

  // Throw error for missing required vars
  if (missing.length > 0) {
    const errorMsg = `❌ Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`;

    if (import.meta.env.MODE === 'production') {
      throw new EnvValidationError(errorMsg);
    } else {
      console.error(errorMsg);
      // In development, show alert
      alert(errorMsg);
    }
  }

  console.log('✅ Environment variables validated successfully');
}

export function getEnvVar(name, defaultValue = null) {
  const value = import.meta.env[name];
  if (!value && defaultValue === null) {
    throw new EnvValidationError(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue;
}
```

2. Modifica src/main.jsx:
   - Importa validateEnv all'inizio
   - Chiama validateEnv() PRIMA di ReactDOM.createRoot
   - Wrappa tutto in try-catch per gestire errori

ESEMPIO:
```javascript
// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { validateEnv } from './lib/env-validation';

// Validate environment variables before starting the app
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  document.body.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui; max-width: 600px; margin: 2rem auto;">
      <h1 style="color: #dc2626;">⚠️ Configuration Error</h1>
      <pre style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">${error.message}</pre>
      <p>Please contact the administrator or check your environment configuration.</p>
    </div>
  `;
  throw error;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

3. Aggiorna src/api/supabaseClient.js per usare getEnvVar:
```javascript
import { getEnvVar } from '../lib/env-validation';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
```

Implementa la validazione e aggiorna tutti i file che accedono a import.meta.env.
```

---

### PROMPT 4: Spostare Config in Variabili d'Ambiente (CRITICO)

```
Devo centralizzare tutta la configurazione hardcoded in un file config.

PROBLEMA:
Valori come bucket names, URL API, limiti sono hardcoded nel codice, rendendo impossibile cambiarli senza re-deploy.

AZIONE RICHIESTA:
1. Crea file src/config/index.js:

```javascript
export const CONFIG = {
  storage: {
    compiledDocumentsBucket: import.meta.env.VITE_STORAGE_BUCKET_COMPILED || 'compiled-documents',
    uploadedDocumentsBucket: import.meta.env.VITE_STORAGE_BUCKET_UPLOADS || 'documents',
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '52428800'), // 50MB default
  },

  ai: {
    cerebrasUrl: import.meta.env.VITE_CEREBRAS_URL || 'https://api.cerebras.ai/v1/chat/completions',
    maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '8000'),
    temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '0.3'),
  },

  rateLimit: {
    guestMonthlyLimit: parseInt(import.meta.env.VITE_RATE_LIMIT_GUEST || '5'),
    userMonthlyLimit: parseInt(import.meta.env.VITE_RATE_LIMIT_USER || '10'),
    premiumMonthlyLimit: parseInt(import.meta.env.VITE_RATE_LIMIT_PREMIUM || '999999'),
  },

  app: {
    environment: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
  },

  features: {
    aiCompilation: import.meta.env.VITE_FEATURE_AI_COMPILATION !== 'false',
    manualMapping: import.meta.env.VITE_FEATURE_MANUAL_MAPPING === 'true',
    advancedOcr: import.meta.env.VITE_FEATURE_ADVANCED_OCR === 'true',
  },
};

// Freeze per prevenire modifiche runtime
Object.freeze(CONFIG);
```

2. Trova e sostituisci tutti i valori hardcoded:
   - src/api/compileApi.js: STORAGE_BUCKET → CONFIG.storage.compiledDocumentsBucket
   - src/api/documentsApi.js: STORAGE_BUCKET → CONFIG.storage.uploadedDocumentsBucket
   - src/lib/ai-client.js: CONFIG object → import da config/index.js
   - src/lib/guest-tracking.js: MONTHLY_LIMIT_* → CONFIG.rateLimit.*

3. Aggiungi al file .env.example:
```
# Storage Configuration
VITE_STORAGE_BUCKET_COMPILED=compiled-documents
VITE_STORAGE_BUCKET_UPLOADS=documents
VITE_MAX_FILE_SIZE=52428800

# AI Configuration
VITE_CEREBRAS_URL=https://api.cerebras.ai/v1/chat/completions
VITE_AI_MAX_TOKENS=8000
VITE_AI_TEMPERATURE=0.3

# Rate Limiting
VITE_RATE_LIMIT_GUEST=5
VITE_RATE_LIMIT_USER=10
VITE_RATE_LIMIT_PREMIUM=999999

# Feature Flags
VITE_FEATURE_AI_COMPILATION=true
VITE_FEATURE_MANUAL_MAPPING=false
VITE_FEATURE_ADVANCED_OCR=false
```

Trova TUTTI i valori hardcoded nel codebase e spostali in CONFIG.
```

---

### PROMPT 5: Rimuovere Console.log Sensibili (CRITICO)

```
Devo rimuovere tutti i console.log che loggano dati sensibili e implementare un logger configurabile.

PROBLEMA:
Ci sono 439 occorrenze di console.log che loggano:
- User IDs
- File paths
- Document content
- Profile data
Questi dati sono visibili nelle dev tools del browser in produzione.

AZIONE RICHIESTA:
1. Crea file src/lib/logger.js:

```javascript
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

const currentLevel = LOG_LEVELS[import.meta.env.VITE_LOG_LEVEL?.toUpperCase()] ??
  (import.meta.env.MODE === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG);

export const logger = {
  debug: (...args) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log('[INFO]', ...args);
    }
  },

  warn: (...args) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
    }

    // In production, invia a error tracking (Sentry, etc.)
    if (import.meta.env.MODE === 'production') {
      // TODO: Integrate Sentry
      // Sentry.captureException(args[0]);
    }
  },
};

// Utility per redact dati sensibili
export function redactSensitiveData(obj) {
  const sensitive = ['password', 'token', 'apiKey', 'secret', 'codice_fiscale', 'partita_iva'];

  if (typeof obj !== 'object' || obj === null) return obj;

  const redacted = { ...obj };

  for (const key in redacted) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      redacted[key] = '***REDACTED***';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}
```

2. Sostituisci TUTTI i console.log nel codebase:
   - console.log(...) → logger.debug(...)
   - console.error(...) → logger.error(...)
   - console.warn(...) → logger.warn(...)

3. Per log che contengono dati utente, usa redactSensitiveData:
```javascript
// Prima:
console.log("User profile:", userProfile);

// Dopo:
import { logger, redactSensitiveData } from './lib/logger';
logger.debug("User profile:", redactSensitiveData(userProfile));
```

4. Aggiungi a .env.example:
```
# Logging (DEBUG, INFO, WARN, ERROR, NONE)
VITE_LOG_LEVEL=ERROR
```

5. In .env.development:
```
VITE_LOG_LEVEL=DEBUG
```

6. In .env.production:
```
VITE_LOG_LEVEL=ERROR
```

Sostituisci OGNI console.log/warn/error nel codebase (usa Find & Replace).
```

---

### PROMPT 6: Fix Race Conditions (ALTO)

```
Devo prevenire race conditions nella compilazione documenti.

PROBLEMA:
src/pages/CompileDocument.jsx - la funzione handleCompile può essere chiamata più volte se l'utente clicca velocemente, causando compilazioni duplicate e costi AI doppi.

AZIONE RICHIESTA:
1. Modifica src/pages/CompileDocument.jsx:

Trova la funzione handleCompile e aggiungi un ref per prevenire chiamate concorrenti:

```javascript
import { useState, useRef } from 'react';

export default function CompileDocument() {
  const [isCompiling, setIsCompiling] = useState(false);
  const compilingRef = useRef(false); // Aggiungi questo

  const handleCompile = async () => {
    // Previeni chiamate concorrenti
    if (compilingRef.current) {
      logger.warn('Compilazione già in corso, richiesta ignorata');
      toast.warning('Compilazione già in corso');
      return;
    }

    compilingRef.current = true;
    setIsCompiling(true);

    try {
      // ... logica compilazione esistente
    } catch (error) {
      logger.error('Compilation error:', error);
      // ... gestione errore
    } finally {
      setIsCompiling(false);
      compilingRef.current = false;
    }
  };

  // ... resto componente
}
```

2. Applica lo stesso pattern a:
   - handleGenerate in src/components/document-generator/QuestionnaireForm.jsx
   - handleUpload in src/pages/CompileDocument.jsx
   - Qualsiasi altra funzione async che può essere chiamata multiple volte

3. Disabilita i pulsanti durante l'operazione:
```javascript
<Button
  onClick={handleCompile}
  disabled={isCompiling || compilingRef.current}
>
  {isCompiling ? 'Compilazione in corso...' : 'Compila Documento'}
</Button>
```

Trova TUTTE le funzioni async critiche e previeni race conditions.
```

---

### PROMPT 7: Gestione Promise Rejections (ALTO)

```
Devo gestire correttamente errori parziali nelle operazioni batch.

PROBLEMA:
src/pages/CompileDocument.jsx usa Promise.all per leggere file multipli. Se un file fallisce, tutto fallisce, perdendo i file letti con successo.

AZIONE RICHIESTA:
1. Trova TUTTE le occorrenze di Promise.all nel codebase

2. Per operazioni su file multipli, sostituisci con Promise.allSettled:

Prima:
```javascript
const fileContents = await Promise.all(
  uploadedFiles.map(async (file) => {
    const content = await readFileContent(file);
    return { name: file.name, content };
  })
);
```

Dopo:
```javascript
const results = await Promise.allSettled(
  uploadedFiles.map(async (file) => {
    try {
      const content = await readFileContent(file);
      return {
        status: 'fulfilled',
        name: file.name,
        content,
        type: file.type
      };
    } catch (err) {
      logger.error(`Failed to read file ${file.name}:`, err);
      return {
        status: 'rejected',
        name: file.name,
        error: err.message
      };
    }
  })
);

// Filtra successi
const successfulReads = results
  .filter(r => r.status === 'fulfilled' && r.value)
  .map(r => r.value);

// Log fallimenti
const failures = results
  .filter(r => r.status === 'rejected')
  .map(r => r.reason?.name || 'unknown');

if (failures.length > 0) {
  logger.warn(`Failed to read ${failures.length} file(s):`, failures);
  toast.warning(`${failures.length} file non leggibili, continuando con gli altri`);
}

if (successfulReads.length === 0) {
  throw new Error('Impossibile leggere nessun file');
}

const fileContents = successfulReads;
```

3. Applica lo stesso pattern in:
   - src/api/documentsApi.js (batch operations)
   - src/pages/CompileDocument.jsx (file processing)
   - Qualsiasi altro uso di Promise.all

Sostituisci TUTTE le Promise.all con gestione robusta degli errori.
```

---

### PROMPT 8: Security Headers (ALTO)

```
Devo aggiungere security headers alla configurazione Vercel.

PROBLEMA:
vercel.json manca header di sicurezza critici (CSP, X-Frame-Options, HSTS, etc.)

AZIONE RICHIESTA:
1. Modifica vercel.json sostituendo la sezione headers con:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=(), payment=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.cerebras.ai; frame-ancestors 'none';"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/index.html",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

2. NOTA: Il CSP header sopra usa 'unsafe-inline' e 'unsafe-eval' perché Vite in produzione potrebbe richiederli. Dopo aver deployato, testa l'app e rimuovi questi flag se possibile per maggiore sicurezza.

3. Crea un file docs/SECURITY_HEADERS.md per documentare ogni header:
```markdown
# Security Headers Explanation

## X-Frame-Options: DENY
Previene clickjacking impedendo l'embedding della app in iframe.

## X-Content-Type-Options: nosniff
Previene MIME type sniffing attacks.

## X-XSS-Protection: 1; mode=block
Attiva protezione XSS del browser (legacy, ma backward compatible).

## Referrer-Policy: strict-origin-when-cross-origin
Controlla quante informazioni referer vengono inviate.

## Permissions-Policy
Disabilita API pericolose (geolocation, camera, microphone).

## Strict-Transport-Security (HSTS)
Forza HTTPS per 2 anni, include subdomains, permette preload.

## Content-Security-Policy (CSP)
Definisce sorgenti trusted per contenuti. Review periodicamente.
```

Implementa tutti gli header di sicurezza.
```

---

### PROMPT 9: Database Indexes (ALTO)

```
Devo aggiungere indexes al database per ottimizzare query comuni.

PROBLEMA:
Le query su company_profiles e uploaded_documents con filtri e ordinamenti sono lente perché mancano composite indexes.

AZIONE RICHIESTA:
1. Crea file supabase/migrations/20260102000000_add_performance_indexes.sql:

```sql
-- Migration: Add composite indexes for performance
-- Created: 2026-01-02
-- Description: Aggiunge indexes per ottimizzare query comuni

-- Company profiles: query comune "lista aziende utente ordinate per data"
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_created
  ON company_profiles(user_id, created_at DESC);

-- Uploaded documents: filtering by status and ordering
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_user_status
  ON uploaded_documents(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uploaded_docs_created
  ON uploaded_documents(created_at DESC)
  WHERE status = 'uploaded';

-- Compiled documents: join optimization
CREATE INDEX IF NOT EXISTS idx_compiled_docs_user_company
  ON compiled_documents(user_id, company_profile_id, created_at DESC);

-- User profiles: lookup ottimizzato
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON user_profiles(user_id);

-- Document generations: rate limiting queries
-- Nota: questa tabella potrebbe non esistere ancora, aggiungi se esiste
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'document_generations'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_doc_generations_user_month
      ON document_generations(user_id, month);

    CREATE INDEX IF NOT EXISTS idx_doc_generations_guest_month
      ON document_generations(guest_id, month);
  END IF;
END
$$;

-- Commento per tracking
COMMENT ON INDEX idx_company_profiles_user_created IS
  'Ottimizza query: SELECT * FROM company_profiles WHERE user_id = ? ORDER BY created_at DESC';

COMMENT ON INDEX idx_uploaded_docs_user_status IS
  'Ottimizza query: SELECT * FROM uploaded_documents WHERE user_id = ? AND status = ? ORDER BY created_at DESC';
```

2. Applica la migration a Supabase (vedi sezione Azioni Manuali)

3. Dopo aver applicato la migration, testa le query:
```sql
-- Testa performance
EXPLAIN ANALYZE
SELECT * FROM company_profiles
WHERE user_id = 'your-test-user-id'
ORDER BY created_at DESC
LIMIT 10;

-- Dovresti vedere "Index Scan using idx_company_profiles_user_created"
```

Crea la migration e preparati ad applicarla manualmente su Supabase.
```

---

### PROMPT 10: Error Boundary e Gestione Errori Globale (MEDIO)

```
Devo implementare Error Boundary React e gestione errori globale.

PROBLEMA:
Se un componente React crasha, l'intera app si blocca con schermata bianca.

AZIONE RICHIESTA:
1. Crea file src/components/ErrorBoundary.jsx:

```javascript
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { logger } from '../lib/logger';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo
    });

    // In production, invia a Sentry
    if (import.meta.env.MODE === 'production') {
      // TODO: Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                Qualcosa è andato storto
              </h1>
            </div>

            <p className="text-gray-600 mb-4">
              L'applicazione ha riscontrato un errore imprevisto.
              Il nostro team è stato notificato.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Dettagli tecnici (solo in development)
                </summary>
                <pre className="whitespace-pre-wrap text-xs text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReset} className="flex-1">
                Torna alla Home
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                Ricarica Pagina
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

2. Modifica src/main.jsx per wrappare l'app:

```javascript
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

3. Aggiungi gestione errori window-level in src/main.jsx:

```javascript
// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise,
  });

  event.preventDefault(); // Previeni console error
});
```

Implementa Error Boundary e gestione errori globale.
```

---

## 🔧 AZIONI MANUALI SUPABASE

Queste azioni DEVI farle tu manualmente dalla dashboard Supabase.

---

### AZIONE 1: Configurare Storage Policies (CRITICO)

1. Vai su **Supabase Dashboard** → Il tuo progetto → **Storage**

2. Seleziona bucket **`documents`** (o `compiled-documents`), vai su **Policies**

3. **IMPORTANTE**: Verifica che il bucket NON sia pubblico:
   - Se vedi "Public bucket", clicca **Make private**

4. Crea queste RLS Policies per bucket `documents`:

**Policy 1: Users can upload own files**
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Users can view own files**
```sql
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3: Users can delete own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

5. Ripeti per bucket **`compiled-documents`** con le stesse policies

---

### AZIONE 2: Modificare Codice per Usare Signed URLs (CRITICO)

Dopo aver fatto le policies, devi modificare il codice:

1. Apri `src/api/compileApi.js`

2. Trova la funzione che usa `getPublicUrl`:
```javascript
const { data: urlData } = supabase.storage
  .from(STORAGE_BUCKET)
  .getPublicUrl(filePath);
```

3. Sostituisci con signed URL:
```javascript
const { data: signedUrlData, error: signedError } = await supabase.storage
  .from(STORAGE_BUCKET)
  .createSignedUrl(filePath, 3600); // Expires in 1 hour

if (signedError) {
  throw new Error(`Errore creazione signed URL: ${signedError.message}`);
}

const fileUrl = signedUrlData.signedUrl;
```

4. Ripeti per TUTTE le occorrenze di `getPublicUrl` nel codebase

---

### AZIONE 3: Configurare Backup Automatici (CRITICO)

1. Vai su **Supabase Dashboard** → Il tuo progetto → **Database** → **Backups**

2. Verifica che **Point-in-Time Recovery (PITR)** sia abilitato:
   - Se sei su piano Free, hai backup giornalieri (7 giorni retention)
   - Se sei su piano Pro, abilita PITR per recovery point-in-time

3. **Storage Backup**:
   - Vai su **Storage** → **Settings**
   - Verifica che backup siano abilitati
   - Configura retention policy (almeno 7 giorni)

4. **Crea procedura backup manuale** (opzionale ma raccomandato):
   - Installa Supabase CLI: `npm install -g supabase`
   - Crea script `scripts/backup-database.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup database schema
supabase db dump -f $BACKUP_DIR/schema_$DATE.sql --schema public

# Backup storage (se hai storage locale)
supabase storage export compiled-documents $BACKUP_DIR/storage_compiled_$DATE/
supabase storage export documents $BACKUP_DIR/storage_documents_$DATE/

echo "✅ Backup completato: $BACKUP_DIR"
```

5. Documenta la procedura di restore in `docs/DISASTER_RECOVERY.md`

---

### AZIONE 4: Creare Edge Function per AI (CRITICO)

**Perché**: Le API keys Cerebras NON devono stare nel client.

1. Vai su **Supabase Dashboard** → Il tuo progetto → **Edge Functions**

2. Clicca **Create a new function** → Nome: `ai-analyze`

3. Copia questo codice:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CEREBRAS_API_KEY = Deno.env.get("CEREBRAS_API_KEY");
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Verifica autenticazione
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { prompt, temperature = 0.1, maxTokens = 4096 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Chiamata Cerebras
    const response = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-70b',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cerebras API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ result }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

4. Vai su **Edge Functions Settings** → **Secrets**

5. Aggiungi secret:
   - Nome: `CEREBRAS_API_KEY`
   - Valore: `la-tua-chiave-cerebras`

6. Deploy la function

7. **Modifica il codice client** `src/lib/ai-client.js`:

```javascript
export const callAI = async (prompt, opts = {}) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Non autenticato');
  }

  const response = await supabase.functions.invoke('ai-analyze', {
    body: {
      prompt,
      temperature: opts.temperature || 0.1,
      maxTokens: opts.maxTokens || 4096,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Errore AI');
  }

  return response.data.result;
};
```

8. **RIMUOVI** `VITE_CEREBRAS_API_KEY` da `.env` (non serve più)

---

### AZIONE 5: Applicare Migrations Database (ALTO)

1. Installa Supabase CLI (se non l'hai):
```bash
npm install -g supabase
```

2. Login:
```bash
supabase login
```

3. Collega il progetto:
```bash
supabase link --project-ref tuo-project-ref
```
(Trovi project-ref in Dashboard → Settings → General → Reference ID)

4. Applica migration degli indexes:
```bash
supabase db push
```

Questo applicherà il file `supabase/migrations/20260102000000_add_performance_indexes.sql`

5. Verifica che gli indexes siano stati creati:
   - Vai su **Database** → **Tables** → `company_profiles`
   - Click tab **Indexes**
   - Dovresti vedere `idx_company_profiles_user_created`

---

### AZIONE 6: Rate Limiting a Livello Database (OPZIONALE)

Se vuoi rate limiting robusto:

1. Crea tabella per tracking:
```sql
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action, window_start DESC);
```

2. Crea function per check rate limit:
```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer DEFAULT 3600
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  -- Calcola inizio window
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  -- Conta azioni in finestra
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND window_start > v_window_start;

  -- Verifica limite
  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  -- Incrementa contatore
  INSERT INTO rate_limits (user_id, action, count, window_start)
  VALUES (p_user_id, p_action, 1, now())
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;

  RETURN true;
END;
$$;
```

3. Usa nella Edge Function:
```typescript
// Prima di processare richiesta
const { data: canProceed } = await supabaseAdmin
  .rpc('check_rate_limit', {
    p_user_id: user.id,
    p_action: 'ai_compile',
    p_limit: 10,
    p_window_seconds: 3600, // 1 ora
  });

if (!canProceed) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    { status: 429 }
  );
}
```

---

### AZIONE 7: Configurare Monitoring (RACCOMANDATO)

1. **Supabase Logs**:
   - Vai su **Logs** → **Database**
   - Monitora query lente (> 1 secondo)
   - Vai su **Logs** → **Edge Functions**
   - Monitora errori

2. **Uptime Monitoring** (esterno):
   - Usa servizio gratuito: https://uptimerobot.com
   - Crea monitor HTTP(S) su `https://tuo-dominio.vercel.app`
   - Imposta check ogni 5 minuti
   - Aggiungi notifica email

3. **Sentry** (per errori frontend):
   - Crea account gratuito: https://sentry.io
   - Installa SDK:
```bash
npm install @sentry/react
```
   - Configura in `src/main.jsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.MODE === 'production',
  tracesSampleRate: 0.1,
});
```

---

## 📝 CONFIGURAZIONI AMBIENTE

### File .env.example (completo)

Crea/aggiorna `.env.example`:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Storage Configuration
VITE_STORAGE_BUCKET_COMPILED=compiled-documents
VITE_STORAGE_BUCKET_UPLOADS=documents
VITE_MAX_FILE_SIZE=52428800

# AI Configuration (opzionale se usi Edge Functions)
# VITE_CEREBRAS_API_KEY=csk-xxx

# Rate Limiting
VITE_RATE_LIMIT_GUEST=5
VITE_RATE_LIMIT_USER=10
VITE_RATE_LIMIT_PREMIUM=999999

# Logging (DEBUG, INFO, WARN, ERROR, NONE)
VITE_LOG_LEVEL=DEBUG

# Feature Flags
VITE_FEATURE_AI_COMPILATION=true
VITE_FEATURE_MANUAL_MAPPING=false
VITE_FEATURE_ADVANCED_OCR=false

# Monitoring (Optional)
# VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# App Info
VITE_APP_VERSION=1.0.0
```

### File .env.production

Crea `.env.production` per Vercel:

```bash
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_ANON_KEY=tua-anon-key

VITE_STORAGE_BUCKET_COMPILED=compiled-documents
VITE_STORAGE_BUCKET_UPLOADS=documents
VITE_MAX_FILE_SIZE=52428800

VITE_RATE_LIMIT_GUEST=5
VITE_RATE_LIMIT_USER=10
VITE_RATE_LIMIT_PREMIUM=999999

# CRITICAL: Production logging
VITE_LOG_LEVEL=ERROR

VITE_FEATURE_AI_COMPILATION=true
VITE_FEATURE_MANUAL_MAPPING=false

VITE_SENTRY_DSN=tua-sentry-dsn

VITE_APP_VERSION=1.0.0
```

### Impostare su Vercel

1. Vai su **Vercel Dashboard** → Il tuo progetto → **Settings** → **Environment Variables**

2. Aggiungi TUTTE le variabili del file `.env.production`

3. **IMPORTANTE**: Imposta ogni variabile su environment `Production`

---

## ✅ VERIFICA POST-FIX

Dopo aver applicato tutti i fix, verifica:

### Checklist Sicurezza

- [ ] XSS: Tutti i `dangerouslySetInnerHTML` usano `DOMPurify.sanitize()`
- [ ] API Keys: `VITE_CEREBRAS_API_KEY` rimossa, chiamate via Edge Function
- [ ] File Upload: Validazione dimensione, MIME type, estensione implementata
- [ ] Storage: Bucket privati con RLS policies, signed URLs usati
- [ ] Environment: Validazione all'avvio implementata
- [ ] Logging: Tutti `console.log` sostituiti con `logger.*`
- [ ] Headers: Security headers configurati in `vercel.json`
- [ ] Backup: Backup automatici Supabase configurati
- [ ] Monitoring: Uptime monitoring configurato

### Checklist Funzionalità

- [ ] Upload documenti funziona
- [ ] Generazione AI funziona (tramite Edge Function)
- [ ] Compilazione documenti funziona
- [ ] Download PDF/DOCX funziona
- [ ] Profili salvano/caricano correttamente
- [ ] Autenticazione funziona
- [ ] Rate limiting blocca correttamente dopo il limite

### Test in Locale

```bash
# 1. Installa dipendenze
npm install

# 2. Applica migrations Supabase
supabase db push

# 3. Testa in development
npm run dev

# 4. Verifica console browser - nessun errore
# 5. Testa upload file > 50MB - deve bloccare
# 6. Testa upload file .exe mascherato - deve bloccare
# 7. Testa compilazione documento - deve funzionare
# 8. Verifica logs - solo ERROR in production

# 9. Build production
npm run build

# 10. Preview production build
npm run preview

# 11. Verifica che funzioni tutto
```

### Test in Production

Dopo deploy Vercel:

1. **Security Headers Check**:
   - Vai su https://securityheaders.com
   - Inserisci il tuo URL Vercel
   - Dovresti avere almeno rating **A**

2. **SSL Check**:
   - Vai su https://www.ssllabs.com/ssltest/
   - Testa il tuo dominio
   - Dovresti avere rating **A+**

3. **Performance Check**:
   - Vai su https://pagespeed.web.dev
   - Testa il tuo URL
   - Verifica punteggio > 80

4. **Functional Test**:
   - Crea account
   - Carica documento
   - Compila documento
   - Scarica risultato
   - Verifica tutto funzioni

---

## 📊 ORDINE DI ESECUZIONE RACCOMANDATO

### Giorno 1 (4-6 ore)
1. ✅ PROMPT 1: Fix XSS
2. ✅ PROMPT 2: Validazione File Upload
3. ✅ PROMPT 3: Environment Validation
4. ✅ AZIONE 1: Storage Policies Supabase
5. ✅ AZIONE 2: Signed URLs

### Giorno 2 (4-6 ore)
6. ✅ PROMPT 4: Centralizzare Config
7. ✅ PROMPT 5: Rimuovere Console.log
8. ✅ AZIONE 4: Edge Function AI
9. ✅ PROMPT 8: Security Headers

### Giorno 3 (3-4 ore)
10. ✅ PROMPT 6: Fix Race Conditions
11. ✅ PROMPT 7: Promise Rejections
12. ✅ PROMPT 9: Database Indexes
13. ✅ AZIONE 5: Applicare Migrations

### Giorno 4 (2-3 ore)
14. ✅ PROMPT 10: Error Boundary
15. ✅ AZIONE 3: Backup Supabase
16. ✅ AZIONE 7: Monitoring
17. ✅ Test completo + Deploy

---

## 🆘 TROUBLESHOOTING

### Problema: DOMPurify non funziona
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### Problema: Edge Function dà 401
- Verifica che `Authorization` header sia passato
- Controlla che Supabase client usi header corretto
- Verifica secret `CEREBRAS_API_KEY` sia settato

### Problema: Signed URLs danno 403
- Verifica RLS policies su storage
- Controlla che folder name sia `{user_id}/filename`
- Verifica che utente sia autenticato

### Problema: Migrations falliscono
```bash
# Reset database (ATTENZIONE: cancella dati)
supabase db reset

# Riapplica migrations
supabase db push
```

### Problema: Build Vercel fallisce
- Verifica tutte environment variables siano settate
- Controlla che non ci siano import circolari
- Verifica `package.json` non abbia errori

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla logs Supabase Dashboard
2. Controlla console browser (F12)
3. Controlla Vercel deployment logs
4. Cerca errore specifico nel codice

**Buon fixing! 🚀**
