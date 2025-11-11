// src/api/base44Client.js
// Versione "locale" del client Base44 che usa Ollama

// Helper per creare un'entità mock
const createMockEntity = (entityName) => {
  const storageKey = `base44_${entityName}`;
  
  return {
    async list(orderBy = "-created_date") {
      const stored = localStorage.getItem(storageKey);
      const items = stored ? JSON.parse(stored) : [];
      return items;
    },
    
    async get(id) {
      const items = await this.list();
      return items.find(item => item.id === id) || null;
    },
    
    async create(data) {
      const items = await this.list();
      const newItem = {
        id: Date.now().toString(),
        ...data,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      items.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return newItem;
    },
    
    async update(id, data) {
      const items = await this.list();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`${entityName} with id ${id} not found`);
      
      items[index] = {
        ...items[index],
        ...data,
        updated_date: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(items));
      return items[index];
    },
    
    async delete(id) {
      const items = await this.list();
      const filtered = items.filter(item => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    },
    
    async filter(filters, limit) {
      let items = await this.list();
      // Implementazione semplice del filtro
      if (filters && Object.keys(filters).length > 0) {
        items = items.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            return item[key] === value;
          });
        });
      }
      if (limit) {
        items = items.slice(0, limit);
      }
      return items;
    }
  };
};

export const base44 = {
  // Simula la funzione invokeLLM di Base44
  async invokeLLM(prompt) {
    try {
      console.log("📤 Invio prompt a Ollama (mistral)...");

      // @ts-ignore
      const response = await fetch(import.meta.env.VITE_CUSTOM_AI_URL || "http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral", // puoi sostituirlo con "phi3" o altro
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore risposta API: ${response.status}`);
      }

      const data = await response.json();
      console.log("📨 Risposta Ollama:", data);

      // Mantiene la stessa struttura che usava Base44
      return {
        data: {
          result: data.response || data.output || "⚠️ Nessuna risposta dal modello.",
        },
        success: true,
      };
    } catch (error) {
      console.error("❌ Errore nella chiamata a Ollama:", error);
      return {
        data: { result: "Errore durante la generazione del documento." },
        success: false,
        error: error.message,
      };
    }
  },
  
  // Entità mock per il salvataggio locale
  entities: {
    Document: createMockEntity("Document"),
    CompanyProfile: createMockEntity("CompanyProfile"),
    PersonalDocumentProfile: createMockEntity("PersonalDocumentProfile"),
  },
  
  // Auth mock
  auth: {
    async me() {
      const stored = localStorage.getItem("base44_user");
      return stored ? JSON.parse(stored) : null;
    },
    
    async updateMe(data) {
      const user = await this.me();
      const updated = { ...user, ...data };
      localStorage.setItem("base44_user", JSON.stringify(updated));
      return updated;
    },
    
    logout() {
      localStorage.removeItem("base44_user");
      window.location.reload();
    },
    
    redirectToLogin() {
      console.log("Redirect to login (mock)");
      // Implementa il redirect al login se necessario
    }
  },
  
  // Integrations mock
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Mock: restituisce un URL locale
        return {
          file_url: URL.createObjectURL(file)
        };
      }
    }
  }
};
