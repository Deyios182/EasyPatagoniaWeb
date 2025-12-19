import { GoogleGenAI, Type, Modality } from "@google/genai";
import { supabase } from "./supabaseClient"; // Necesario para dar contexto real
import { Business, Category } from "./types";

// 1. CLAVE API SEGURA PARA VITE
// process.env no funciona en Vite, usamos import.meta.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("ADVERTENCIA: No se encontró la API KEY de Gemini.");
}

/**
 * Chat IA con Modelos Avanzados (2.5 Flash)
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES', userLat?: number, userLng?: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // 2. RECUPERAR DATOS DE SUPABASE (Contexto Local)
    // Sin esto, la IA no sabrá sobre tus negocios específicos.
    const { data: businesses } = await supabase
      .from('businesses')
      .select('nombre, categoria, info, gps')
      .limit(30);

    const contextText = businesses?.map((b: any) => 
      `- ${b.nombre} (${b.categoria}): ${b.info?.descripcion || 'Sin descripción'}.`
    ).join('\n') || "";

    // Configuración de Herramientas
    const tools: any[] = [{ googleSearch: {} }];
    const toolConfig: any = {};
    const isMapsRequested = !!(userLat && userLng);
    
    // MODELO SOLICITADO
    const model = isMapsRequested ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';

    if (isMapsRequested) {
      tools.push({ googleMaps: {} });
      toolConfig.retrievalConfig = { latLng: { latitude: userLat, longitude: userLng } };
    }

    const languageContext = {
      ES: "Debes responder en Español Chileno.",
      EN: "You must respond in English.",
      PT: "Você deve responder em Português do Brasil."
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `
          Eres un guía experto de Aysén. ${languageContext[language]} 
          
          INFORMACIÓN LOCAL VERIFICADA (Prioridad Alta):
          ${contextText}

          Si te piden recomendaciones de alojamiento, comida o tours, SIEMPRE intenta encajar uno de la lista de arriba.
          Si usas Google Search, compleméntalo con la información local.
        `,
        tools,
        toolConfig
      }
    });

    const text = response.text || "";
    
    // Extracción de Fuentes (Grounding)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => {
      if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title, type: 'web' };
      if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title, type: 'map' };
      return null;
    }).filter(Boolean);

    return { text, sources };

  } catch (error: any) {
    // ERROR DETALLADO SOLICITADO
    console.error("AI Error:", error);
    return { 
      text: `Error de Sistema (${error.status || 'Desconocido'}): ${error.message || JSON.stringify(error)}. Revisa tu API Key o acceso al modelo.`, 
      sources: [] 
    };
  }
}

/**
 * Generador de Imágenes (Gemini 2.5 Image)
 */
export async function generateActivityPreview(activityTitle: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional travel photo of: ${activityTitle} in Aysén, Patagonia.` }] },
      config: { 
        // @ts-ignore - La librería a veces no tipa bien imageConfig en beta
        imageConfig: { aspectRatio: "16:9" } 
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) { 
    console.error("Image Error:", error);
    return null; 
  }
}

/**
 * Generador de Itinerarios (Gemini 3 Pro Preview)
 */
export async function generateItineraryAI(days: number, budget: string, categories: Category[], businesses: Business[], language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const filteredBusinesses = businesses.filter(b => categories.includes(b.categoria));
    
    const catalogContext = filteredBusinesses.map(b => ({
      name: b.nombre,
      category: b.categoria,
      location: b.info.direccion,
      services: b.servicios.map(s => `${s.nombre} (${s.precio})`)
    }));

    const langInstructions = {
      ES: "Responde el JSON en Español.",
      EN: "Response JSON fields must be in English.",
      PT: "Os campos do JSON devem estar em Português."
    };

    const prompt = `Actúa como un planificador de viajes experto para la región de Aysén. ${langInstructions[language]}
    Genera un itinerario lógico de ${days} días. Presupuesto: ${budget}. 
    
    USA EXCLUSIVAMENTE este catálogo local:
    ${JSON.stringify(catalogContext)}

    Devuelve un JSON estructurado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Modelo solicitado
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              title: { type: Type.STRING }, // Agregado title al root del día para evitar error de parseo en frontend
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    businessName: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ["time", "title", "description"]
                }
              }
            },
            required: ["day", "activities"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    // Devuelve null para que el frontend maneje la alerta
    return null; 
  }
}

/**
 * Texto a Voz (Gemini 2.5 Flash TTS)
 */
export async function textToSpeechPatagonia(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) { 
    console.error("TTS Error:", error);
    return null; 
  }
}
