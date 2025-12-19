import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabaseClient";
import { Business, Category } from "./types";

// CLAVE API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Inicializamos la librería
const genAI = new GoogleGenerativeAI(API_KEY);

// 🔥 MODELO SOLICITADO: GEMINI 2.5 FLASH
const MODEL_NAME = "gemini-2.5-flash";

/**
 * Chat Inteligente (Usando Gemini 2.5 Flash)
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES', userLat?: number, userLng?: number) {
  try {
    // Apuntamos directo al modelo 2.5
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 1. Contexto RAG desde Supabase
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

    const result = await model.generateContent([systemPrompt, prompt]);
    return { text: result.response.text(), sources: [] };

  } catch (error) {
    console.error("AI Error:", error);
    return { text: "Error conectando con Gemini 2.5. Revisa la consola.", sources: [] };
  }
}

/**
 * Generador de Itinerarios (Gemini 2.5 Flash)
 */
export async function generateItineraryAI(days: number, budget: string, categories: Category[], businesses: Business[], language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    // Configuración específica para JSON con el modelo 2.5
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" }
    });
    
    // Filtro de negocios
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
      Planificador experto Aysén. ${langInstructions[language]}
      Días: ${days}. Presupuesto: ${budget}.
      
      CATÁLOGO LOCAL:
      ${JSON.stringify(catalogContext)}

      Genera itinerario lógico. Responde SOLO con JSON válido (Array).
      Estructura:
      [
        {
          "day": 1,
          "title": "...",
          "activities": [
            { "time": "Mañana", "title": "...", "description": "...", "businessName": "NombreLocal" }
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Planner Error (2.5):", error);
    return null;
  }
}

/**
 * Texto a Voz (Nativo del Navegador)
 * Usamos el nativo para asegurar que funcione en el deploy sin configurar APIs de audio complejas.
 */
export async function textToSpeechPatagonia(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; 
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    return null; 
  }
  return null;
}

/**
 * Generador de Imágenes de Actividad
 * Intentamos usar el modelo 2.5 para esto también si está disponible.
 */
export async function generateActivityPreview(activityTitle: string) {
  try {
     // Intentamos llamar al modelo 2.5, si falla devolvemos null y la app usa imagen por defecto
     const model = genAI.getGenerativeModel({ model: MODEL_NAME }); 
     // Nota: La generación de imágenes requiere métodos específicos que la librería estándar a veces separa.
     // Para evitar romper el build, retornamos null por ahora, pero la función existe.
     return null;
  } catch (e) {
     return null;
  }
}
