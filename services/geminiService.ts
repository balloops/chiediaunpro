
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  // AI assist for generating a professional bio or pitch
  async suggestPitch(jobTitle: string, jobDescription: string, proSkills: string[]) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sono un professionista digitale con queste competenze: ${proSkills.join(', ')}. 
      Voglio rispondere a questa richiesta di lavoro: "${jobTitle}". Descrizione: "${jobDescription}".
      Scrivi un messaggio di presentazione professionale, persuasivo e breve in italiano per convincere il cliente ad affidarmi il lavoro.`,
    });
    return response.text;
  },

  // AI assist for clients to refine their job description
  async refineJobDescription(description: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Affina questa descrizione di lavoro per un progetto digitale rendendola più tecnica e chiara per un professionista. 
      Descrizione originale: "${description}". Fornisci una versione migliorata in italiano.`,
    });
    return response.text;
  }
};
