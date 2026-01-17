import { GoogleGenAI, Type, Modality } from "@google/genai";
import { supabase } from "./supabaseClient";
import { Business, Category } from "./types";

// ENV VARIABLES
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || "GOOGLE"; // 'GOOGLE' | 'OPENROUTER'
const GOOGLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

console.log(`🤖 [AI SERVICE] Provider: ${AI_PROVIDER}`);

// OPENROUTER CONFIG
const OR_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
// Default for Chat (Fast & Good)
const OR_MODEL_CHAT = "google/gemini-2.0-flash-exp:free";
// Dedicated for Logic/JSON (Strict & Smart)
const OR_MODEL_LOGIC = "google/gemini-2.0-flash-exp:free";

/**
 * OpenRouter Fetch Helper
 */
async function callOpenRouter(messages: any[], model = OR_MODEL_CHAT, responseFormat?: any) {
  if (!OPENROUTER_API_KEY) throw new Error("Missing VITE_OPENROUTER_API_KEY");

  const body: any = {
    model: model,
    messages: messages,
    // DeepSeek prefers simpler parameters, Gemini likes these. Valid for both roughly.
    top_p: 1,
    temperature: 0.7,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const response = await fetch(OR_BASE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "EasyPatagonia",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    // Try to parse friendly error
    try {
      const jsonDate = JSON.parse(err);
      const msg = jsonDate.error?.message || err;
      throw new Error(`OpenRouter: ${msg}`);
    } catch (e) {
      throw new Error(`OpenRouter Error ${response.status}: ${err}`);
    }
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Chat Inteligente
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES', userLat?: number, userLng?: number) {
  try {
    // CONTEXT LOAD
    const { data: companies } = await supabase.from('companies').select('name, category, description').limit(30);
    const contextText = companies?.map((b: any) => `- ${b.name} (${b.category}): ${b.description}`).join('\n') || "";

    const languageContext = {
      ES: "Responde en Español Chileno.",
      EN: "Respond in English.",
      PT: "Responda em Português."
    };

    const systemInstruction = `Eres experto de PatagonIA, un guía inteligente de la Región de Aysén. ${languageContext[language]}
    IMPORTANTE: SÉ BREVE Y CONCISO. Máximo 2 párrafos. Ve al grano.
    INFORMACIÓN LOCAL (Prioridad):
    ${contextText}
    Si recomiendas algo, menciona si está en la lista local.`;

    // --- GOOGLE PROVIDER (Legacy/Backup) ---
    if (AI_PROVIDER === "GOOGLE") {
      if (!GOOGLE_API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");
      const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction }
      });
      return { text: response.text || "", sources: [] };
    }

    // --- OPENROUTER PROVIDER ---
    const messages = [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ];

    // Use default Chat model
    const text = await callOpenRouter(messages, OR_MODEL_CHAT);
    return { text: text || "No response", sources: [] };

  } catch (error: any) {
    console.error("Chat Error:", error);
    return { text: `Error: ${error.message || "Unknown error"}`, sources: [] };
  }
}

/**
 * Generador de Imágenes (Placeholder)
 */
export async function generateActivityPreview(activityTitle: string) {
  return null;
}

/**
 * Planificador (Optimized with Strict JSON Prompt)
 */
export async function generateItineraryAI(days: number, budget: string, categories: Category[], businesses: Business[], localities: string[] = [], language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    // FILTER BUSINESSES
    let filteredBusinesses = businesses.filter(b => categories.includes(b.categoria as Category));
    if (localities.length > 0) {
      filteredBusinesses = filteredBusinesses.filter(b => b.locality_name && localities.includes(b.locality_name));
    }

    const catalogContext = filteredBusinesses.map((b: any) => ({
      name: b.nombre || b.name,
      cat: b.categoria || b.category,
      loc: b.info?.direccion || b.description
    }));

    // STICT JSON PROMPT
    const cleanJsonPrompt = `
ACTÚA COMO: API Generadora de Itinerarios JSON para "Easy Patagonia".
TAREA: Crear un itinerario de viaje lógico basado en los datos proporcionados.
RESTRICCIÓN CRÍTICA: Tu salida debe ser EXCLUSIVAMENTE código JSON válido. Sin markdown (\`\`\`), sin explicaciones, sin saludos.

DATOS DE ENTRADA:
- Idioma: ${language}
- Días: ${days}
- Presupuesto: ${budget}
- Localidades: ${localities.join(', ') || "Cualquiera en Aysén"}
- Catálogo de Negocios Disponibles: ${JSON.stringify(catalogContext)}

FORMATO JSON REQUERIDO:
[
  {
    "day": 1,
    "title": "Título del día",
    "activities": [
      { 
        "time": "09:00", 
        "title": "Nombre de actividad", 
        "description": "Breve descripción", 
        "businessName": "Nombre EXACTO del negocio del catálogo si aplica (o null)" 
      }
    ]
  }
]
`;

    if (AI_PROVIDER === "GOOGLE") {
      const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: cleanJsonPrompt,
        config: { responseMimeType: "application/json" } // Google supports this natively
      });
      return JSON.parse(response.text || "[]");
    }

    // OPENROUTER - Using DeepSeek for Logic
    const messages = [
      { role: "system", content: "You are a rigid JSON generator. You output ONLY valid JSON arrays. No Markdown formatting." },
      { role: "user", content: cleanJsonPrompt }
    ];

    // Use Logic/JSON specific model
    const text = await callOpenRouter(messages, OR_MODEL_LOGIC);

    // Clean potential markdown code blocks provided by eager models
    let cleanJson = text?.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson || "[]");

  } catch (error) {
    console.error("Planner Error:", error);
    return null;
  }
}

/**
 * Audio TTS
 */
export async function textToSpeechPatagonia(text: string) {
  console.warn("TTS: Using Browser Fallback (OpenRouter/Standard)");
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  }
  return null;
}
