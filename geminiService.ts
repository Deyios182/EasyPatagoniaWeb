import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabaseClient";
import { Business, Category } from "./types";

// CLAVE API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Inicializamos la librería (Usamos la estable para que Vercel no falle)
const genAI = new GoogleGenerativeAI(API_KEY);

// ⚡️ MODELO A USAR:
// Si tienes acceso a la preview, cambia esto a "gemini-2.0-flash-exp"
// Por seguridad y estabilidad, lo dejo en el más rápido actual:
const MODEL_NAME = "gemini-1.5-flash"; 

/**
 * Chat Inteligente con Contexto (RAG)
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES', userLat?: number, userLng?: number) {
  try {
    // 1. Contexto RAG: Buscamos datos reales en Supabase
    const { data: businesses } = await supabase
      .from('businesses')
      .select('nombre, categoria, info, gps')
      .limit(30);

    const contextText = businesses?.map((b: any) => 
      `- ${b.nombre} (${b.categoria}): ${b.info?.descripcion || 'Sin descripción'}.`
    ).join('\n') || "";

    const languageContext = {
      ES: "Responde en Español Chileno.",
      EN: "Respond in English.",
      PT: "Responda em Português."
    };

    const systemPrompt = `
      Eres un guía experto de Aysén. ${languageContext[language]}
      Usa esta información local verificada para tus respuestas:
      ${contextText}
      
      Si te piden recomendaciones, prioriza los negocios de la lista.
    `;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Pasamos el prompt del sistema y el del usuario
    const result = await model.generateContent([systemPrompt, prompt]);
    const response = result.response;
    
    return { 
      text: response.text(), 
      sources: [] 
    };

  } catch (error) {
    console.error("AI Error:", error);
    return { text: "Estoy recalibrando mis sensores patagónicos. Intenta de nuevo.", sources: [] };
  }
}

/**
 * Generador de Itinerarios (JSON Mode)
 */
export async function generateItineraryAI(days: number, budget: string, categories: Category[], businesses: Business[], language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    const filteredBusinesses = businesses.filter(b => categories.includes(b.categoria));
    
    const catalogContext = filteredBusinesses.map(b => ({
      name: b.nombre,
      category: b.categoria,
      location: b.info.direccion
    }));

    const langInstructions = {
      ES: "JSON en Español.",
      EN: "JSON in English.",
      PT: "JSON em Português."
    };

    const prompt = `
      Planificador de viajes Aysén. ${langInstructions[language]}
      Días: ${days}. Presupuesto: ${budget}.
      
      LUGARES DISPONIBLES:
      ${JSON.stringify(catalogContext)}

      Responde SOLO con un JSON válido (Array de objetos).
      Formato:
      [
        {
          "day": 1,
          "title": "...",
          "activities": [
            { "time": "Mañana", "title": "...", "description": "..." }
          ]
        }
      ]
    `;

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" } // Forzamos JSON nativo
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Limpieza de seguridad
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Planner Error:", error);
    return null;
  }
}

/**
 * Texto a Voz (Fallback Híbrido)
 * Intenta usar la voz del navegador para garantizar que suene.
 * La API de audio de Gemini es compleja de implementar en frontend puro sin un proxy.
 */
export async function textToSpeechPatagonia(text: string): Promise<string | null> {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; 
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    
    // Devolvemos null porque el navegador maneja el audio, 
    // así el componente no espera un base64.
    return null; 
  }
  return null;
}

/**
 * Generador de Imágenes (Placeholder)
 * Esta función es necesaria para que ItineraryScreen no falle al compilar.
 */
export async function generateActivityPreview(activityTitle: string): Promise<string | null> {
  // Por ahora devolvemos null para evitar errores de API.
  // Las imágenes se cargarán desde el fallback de la UI.
  return null;
}
