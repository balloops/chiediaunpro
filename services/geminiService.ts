import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

// Helper to check if AI is available
const isAIEnabled = () => !!apiKey && apiKey !== 'undefined' && apiKey !== '';

const getAI = () => {
  if (!isAIEnabled()) {
    throw new Error("API Key mancante");
  }
  return new GoogleGenAI({ apiKey: apiKey! });
};

export const geminiService = {
  // AI assist for generating a professional bio or pitch
  async suggestPitch(jobTitle: string, jobDescription: string, proSkills: string[]) {
    if (!isAIEnabled()) {
      return `Ciao! Ho letto il tuo annuncio per "${jobTitle}" e sono molto interessato. Ho le competenze giuste (${proSkills.join(', ')}) per aiutarti. Parliamone!`;
    }

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sono un professionista digitale con queste competenze: ${proSkills.join(', ')}. 
        Voglio rispondere a questa richiesta di lavoro: "${jobTitle}". Descrizione: "${jobDescription}".
        Scrivi un messaggio di presentazione professionale, persuasivo e breve in italiano per convincere il cliente ad affidarmi il lavoro.`,
      });
      return response.text;
    } catch (error) {
      console.warn("AI Error:", error);
      return `Ciao! Ho letto il tuo annuncio per "${jobTitle}" e sono molto interessato. Ho le competenze giuste per aiutarti.`;
    }
  },

  // AI assist for clients to refine their job description
  async refineJobDescription(description: string) {
    if (!isAIEnabled()) {
      // Se non c'è l'AI, restituisci la descrizione così com'è
      return description;
    }

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Affina questa descrizione di lavoro per un progetto digitale rendendola più tecnica e chiara per un professionista. 
        Descrizione originale: "${description}". Fornisci una versione migliorata in italiano, senza aggiungere commenti o premesse, solo il testo riscritto.`,
      });
      return response.text || description;
    } catch (error) {
      console.warn("AI Error:", error);
      return description;
    }
  }
};