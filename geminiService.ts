import { GoogleGenAI, Type, Modality } from "@google/genai";
import { supabase } from "./supabaseClient";
import { Business, Category } from "./types";

// 1. CLAVE API PARA VITE
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

/**
 * Función auxiliar para manejar reintentos cuando se acaba la cuota (Error 429)
 */
async function safeGenerate(ai: GoogleGenAI, params: any, fallbackModel = 'gemini-2.5-flash') {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    // Si el error es 429 (Cuota excedida) o 404 (Modelo no encontrado), usamos el modelo seguro
    if (error.status === 429 || error.code === 429 || error.status === 404) {
      console.warn(`⚠️ Cuota agotada para ${params.model}. Usando fallback: ${fallbackModel}`);
      return await ai.models.generateContent({ ...params, model: fallbackModel });
    }
    throw error;
  }
}

/**
 * Chat Inteligente (Intenta 2.5 -> Fallback a 1.5)
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES', userLat?: number, userLng?: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Contexto de Supabase (Tus negocios)
    const { data: companies } = await supabase.from('companies').select('name, category, description').limit(30);
    const contextText = companies?.map((b: any) => `- ${b.name} (${b.category}): ${b.description}`).join('\n') || "";

    const tools: any[] = [{ googleSearch: {} }];
    const toolConfig: any = {};
    const isMapsRequested = !!(userLat && userLng);

    // Intentamos usar el modelo que quieres
    const preferredModel = isMapsRequested ? 'gemini-2.5-flash' : 'gemini-2.5-flash';

    if (isMapsRequested) {
      tools.push({ googleMaps: {} });
      toolConfig.retrievalConfig = { latLng: { latitude: userLat, longitude: userLng } };
    }

    const languageContext = {
      ES: "Responde en Español Chileno.",
      EN: "Respond in English.",
      PT: "Responda em Português."
    };

    const config = {
      model: preferredModel,
      contents: prompt,
      config: {
        systemInstruction: `Eres un guía experto de Aysén. ${languageContext[language]}
        INFORMACIÓN LOCAL (Prioridad):
        ${contextText}
        Si recomiendas algo, menciona si está en la lista local.`,
        tools,
        toolConfig
      }
    };

    // Usamos la función segura
    const response = await safeGenerate(ai, config, 'gemini-2.5-flash');

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => {
      if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title, type: 'web' };
      if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title, type: 'map' };
      return null;
    }).filter(Boolean);

    return { text, sources };

  } catch (error: any) {
    console.error("Chat Error:", error);
    const msg = error.message || JSON.stringify(error);
    if (msg.includes('429')) return { text: "⚠️ Mi cuota de energía IA se agotó por hoy. Intenta más tarde o actualiza el plan.", sources: [] };
    return { text: `Error del sistema: ${msg}`, sources: [] };
  }
}

/**
 * Generador de Imágenes (Sin fallback, si falla, falla)
 */
export async function generateActivityPreview(activityTitle: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: `Professional travel photo of: ${activityTitle} in Aysén, Patagonia.` }] },
      config: {
        // @ts-ignore
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) { return null; }
}

/**
 * 🚀 MODIFICADO: Planificador conectado a Supabase
 * Ya no recibe 'businesses' como argumento, los busca él mismo en la BD.
 */
export async function generateItineraryAI(days: number, budget: string, categories: Category[], businesses: Business[], language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // FILTER LOCAL BUSINESSES
    const filteredBusinesses = businesses.filter(b => categories.includes(b.categoria as Category));

    // 2. Crear contexto del catálogo
    const catalogContext = filteredBusinesses.map((b: any) => ({
      name: b.nombre || b.name,
      cat: b.categoria || b.category,
      loc: b.info?.direccion || b.description || "Región de Aysén"
    }));

    const prompt = `Planificador Aysén. Idioma: ${language}. Días: ${days}. Presupuesto: ${budget}.
    CATÁLOGO LOCAL (Prioridad): ${JSON.stringify(catalogContext)}
    Genera JSON válido (Array de objetos).`;

    const config = {
      model: 'gemini-2.5-flash', // Tu modelo solicitado
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              title: { type: Type.STRING },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    businessName: { type: Type.STRING }
                  },
                  required: ["time", "title", "description"]
                }
              }
            },
            required: ["day", "activities"]
          }
        }
      }
    };

    const response = await safeGenerate(ai, config, 'gemini-2.5-flash');
    return JSON.parse(response.text || "[]");

  } catch (error: any) {
    console.error("Planner Error:", error);
    if (error.status === 429 || error.message?.includes('429')) {
      // Fallback or User Notification
      // Return a basic empty structure or a specific error object we can handle in UI
      return null; // The UI will show "Error generating" but at least it won't crash hard if we handle null.
    }
    return null;
  }
}

/**
 * Audio TTS (Intenta Gemini -> Fallback a Navegador)
 */
export async function textToSpeechPatagonia(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

  } catch (error: any) {
    console.warn("TTS Quota exceeded or error. Using browser fallback.");
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
      return null;
    }
    return null;
  }
}
