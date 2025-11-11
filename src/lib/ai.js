// src/lib/ai.js
export async function callAI(prompt) {
    try {
      console.log("📤 Invio richiesta a Ollama...");
  
      // @ts-ignore
      const apiUrl = import.meta.env.VITE_CUSTOM_AI_URL || "http://localhost:11434/api/generate";
      console.log("🔗 URL API:", apiUrl);
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral",
          prompt: prompt,
          stream: true, // ⚡ necessario per gestire righe multiple
        }),
      });
  
      if (!response.ok) {
        const text = await response.text();
        console.error("❌ Errore HTTP:", response.status, text);
        throw new Error(`Errore risposta API: ${response.status}`);
      }
  
      // 🔁 Legge lo stream riga per riga
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        buffer += decoder.decode(value, { stream: true });
  
        // Dividi in righe complete
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
  
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.response) fullText += json.response;
            if (json.done) {
              console.log("✅ Generazione completata.");
              return fullText.trim();
            }
          } catch (err) {
            // ignora righe non JSON
          }
        }
      }
  
      console.log("📜 Testo generato:", fullText);
      return fullText.trim() || "⚠️ Nessuna risposta dal modello.";
    } catch (error) {
      console.error("💥 Errore nella chiamata a Ollama:", error);
      return "❌ Errore durante la generazione del documento. Controlla che Ollama sia attivo e il modello esistente.";
    }
  }
  