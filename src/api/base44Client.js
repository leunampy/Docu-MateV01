// src/api/base44Client.js
// Backward compatibility: re-export da ai-client

import { generateText } from '@/lib/ai-client';

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
  // Usa generateText da ai-client
  async invokeLLM(prompt) {
    return await generateText(prompt);
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
