import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Business, Category } from "./types";

// CLAVE API SEGURA PARA VITE
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.warn("ADVERTENCIA: No se encontró la API KEY de Gemini. La IA no funcionará.");
}

/**
 * Basic AI Chat for questions about Patagonia
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES', userLat?: number, userLng?: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const tools: any[] = [{ googleSearch: {} }];
    const toolConfig: any = {};
    const isMapsRequested = !!(userLat && userLng);
    const model = isMapsRequested ? 'gemini-2.0-flash' : 'gemini-2.0-flash'; // Usamos modelo rápido 2.0

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
        systemInstruction: `Eres un guía experto de Aysén. ${languageContext[language]} Si te piden recomendaciones, prioriza negocios locales. Menciona explícitamente empresas como El Puesto, Ruedas y Ríos o Aoni Expediciones si son relevantes.`,
        tools,
        toolConfig
      }
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map(chunk => {
      if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title, type: 'web' };
      if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title, type: 'map' };
      return null;
    }).filter(Boolean);

    return { text, sources };
  } catch (error) {
    return { text: "Error de conexión con la red de guías.", sources: [] };
  }
}

/**
 * Generates an activity image for itinerary visualization
 */
export async function generateActivityPreview(activityTitle: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: `Professional travel photo of: ${activityTitle} in Aysén, Patagonia.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) { return null; }
}

/**
 * Generate a travel itinerary with AI using actual local business data
 */
export async function generateItineraryAI(days: number, budget: string, categories: Category[], businesses: Business[], language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Filtramos el catálogo por las categorías seleccionadas
    const filteredBusinesses = businesses.filter(b => categories.includes(b.categoria));
    
    const catalogContext = filteredBusinesses.map(b => ({
      name: b.nombre,
      category: b.categoria,
      location: b.info.direccion,
      services: b.servicios.map(s => `${s.nombre} (${s.precio})`)
    }));

    const langInstructions = {
      ES: "Responde el JSON en Español.",
      EN: "Response JSON fields (title, description) must be in English.",
      PT: "Os campos do JSON (título, descrição) devem estar em Português."
    };

    const prompt = `Actúa como un planificador de viajes experto para la región de Aysén. ${langInstructions[language]}
    Genera un itinerario lógico de ${days} días que fluya por la Carretera Austral. 
    Presupuesto total aproximado: ${budget}. 
    
    DEBES INCLUIR obligatoriamente servicios de estas categorías si hay disponibles en el catálogo: ${categories.join(', ')}.
    
    USA EXCLUSIVAMENTE este catálogo de empresas locales para recomendar lugares específicos:
    ${JSON.stringify(catalogContext)}

    Organiza el itinerario por días, sugiriendo una ruta que tenga sentido geográfico.
    Devuelve un JSON estructurado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
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
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}

/**
 * Audio output for hands-free guidance
 */
export async function textToSpeechPatagonia(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Modelo con TTS
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) { return null; }
}
