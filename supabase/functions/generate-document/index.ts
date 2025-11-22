// Setup type definitions for Supabase Edge Runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");

if (!MISTRAL_API_KEY) {
  console.error("❌ Missing MISTRAL_API_KEY in Supabase environment variables");
}

serve(async (req) => {
  try {
    const { type, answers } = await req.json();

    if (!type || !answers) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' or 'answers'" }),
        { status: 400 }
      );
    }

    // Prompt per Mistral
    const systemPrompt = `
Sei un generatore di documenti legali.
Genera il documento richiesto in HTML completo (<html>...</html>), senza commenti né testo extra.
`;

    const userPrompt = `
Tipo documento: ${type}
Risposte dell'utente:
${JSON.stringify(answers, null, 2)}

Genera il documento legale completo e formattato.
`;

    // Richiesta HTTP a Mistral
    const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest", // Usa lo stesso modello che usi nel frontend
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.2
      }),
    });

    const data = await mistralRes.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Mistral error:", data);
      return new Response(
        JSON.stringify({ error: "Mistral generation failed", raw: data }),
        { status: 500 }
      );
    }

    const generatedDocument = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        document: generatedDocument,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("❌ Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
