import * as GoogleGenAI from "@google/genai";
import { StudyLevel, StructuredSummary } from "./types";

// We gebruiken hier de container-import om de export-fout te voorkomen
const genAI = new GoogleGenAI.GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `Je bent een gespecialiseerde onderwijsassistent voor het Vlaamse middelbaar onderwijs.
BELANGRIJKSTE REGEL: Gebruik EXCLUSIEF de onderstaande verstrekte tekst om studiemateriaal te genereren. Verzin geen extra informatie die niet in de tekst staat.
Gebruik altijd Nederlands. Houd rekening met het opgegeven niveau (1ste t/m 6de middelbaar) qua taalgebruik en complexiteit.`;

export const generateSummary = async (text: string, level: StudyLevel): Promise<StructuredSummary> => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION 
  });

  const prompt = `Maak een zeer overzichtelijke, gestructureerde samenvatting van de volgende tekst voor een leerling uit het ${level}. 
  Verdeel de samenvatting in logische hoofdstukken met titels. Geef voor elk hoofdstuk ook een lijst met belangrijke kernpunten.
  Geef het resultaat in JSON formaat.

  BRONTEKST:
  ${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
};
