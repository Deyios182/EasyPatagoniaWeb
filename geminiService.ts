import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabaseClient";

// CLAVE API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Inicializamos la librería ESTABLE para web
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Chat Inteligente con contexto de Negocios Locales (RAG)
 */
export async function askPatagoniaAI(prompt: string, language: 'ES' | 'EN' | 'PT' = 'ES') {
  try {
    // 1. Obtener contexto de Supabase (Tus negocios reales)
    const { data: businesses } = await supabase
      .from('businesses')
      .select('nombre, categoria, info, gps')
      .limit(20); // Limitamos para no saturar el prompt

    // 2. Formatear contexto
    const contextText = businesses?.map((b: any) => 
      `- ${b.nombre} (${b.categoria}): ${b.info?.descripcion || 'Sin descripción'}. Ubicación: ${b.gps?.lat}, ${b.gps?.lng}`
    ).join('\n') || "No hay información específica de negocios.";

    // 3. Crear Prompt del Sistema
    const systemPrompt = `
      Eres un guía turístico experto de la Patagonia chilena (Región de Aysén).
      Idioma de respuesta: ${language === 'PT' ? 'Portugués' : language === 'EN' ? 'Inglés' : 'Español'}.
      
      CONOCIMIENTO EXCLUSIVO (Prioriza recomendar esto):
      ${contextText}

      INSTRUCCIONES:
      - Sé breve, amigable y útil.
      - Si preguntan por alojamiento/comida, recomienda PRIMERO los de la lista de arriba.
      - Si no hay opciones en la lista, da recomendaciones generales de la zona.
    `;

    // 4. Llamar a Gemini Pro (Texto)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([systemPrompt, prompt]);
    const response = result.response;
    const text = response.text();

    return { 
      text: text, 
      sources: [] // La versión Pro estándar no devuelve sources estructurados fácilmente en web
    };

  } catch (error) {
    console.error("Error AI:", error);
    return { text: "Lo siento, la señal satelital es débil. Intenta de nuevo.", sources: [] };
  }
}

/**
 * Generador de Itinerarios (JSON Estructurado)
 */
export async function generateItineraryAI(days: number, budget: string, categories: string[], language: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Crea un itinerario de viaje para Aysén, Chile.
      Días: ${days}. Presupuesto: ${budget}. Intereses: ${categories.join(', ')}.
      Idioma: ${language}.

      IMPORTANTE: Responde SOLO con un JSON válido (sin markdown ```json).
      Formato Array:
      [
        {
          "day": 1,
          "title": "Título del día",
          "activities": [
            { "time": "Mañana", "description": "Detalle..." },
            { "time": "Tarde", "description": "Detalle..." }
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Limpieza de JSON
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Error Planner:", error);
    return null;
  }
}

/**
 * Texto a Voz (Simulado o Nativo del Navegador)
 * Nota: La API de audio de Gemini requiere configuraciones complejas de backend.
 * Para que funcione YA en tu web, usaremos la síntesis nativa del navegador que es GRATIS y rápida.
 */
export async function textToSpeechPatagonia(text: string): Promise<string | null> {
  // Opción A: Usar la API del navegador (SpeechSynthesis)
  // Como tu componente espera un base64 (PCM), esto es un truco:
  // Devolvemos NULL para que el componente sepa que no hay audio binario,
  // pero ejecutamos el audio aquí mismo.
  
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CL'; // Español de Chile
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    return null; // El audio ya se está reproduciendo
  }
  
  return null;
}
