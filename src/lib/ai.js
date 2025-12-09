// src/lib/ai.js
// Backward compatibility layer: callAI → callClaude
import { callClaude } from './claude-client';

/**
 * Chiamata AI generica (backward compatibility)
 * Ora usa Claude API invece di Ollama
 */
export async function callAI(prompt) {
  try {
    console.log("📤 Invio richiesta a Claude (via callAI)...");
    const response = await callClaude(prompt);
    return response;
  } catch (error) {
    console.error("💥 Errore nella chiamata a Claude:", error);
    return `❌ Errore durante la generazione: ${error.message}`;
  }
}
  