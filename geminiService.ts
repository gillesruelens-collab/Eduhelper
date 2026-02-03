import * as GoogleGenAI from "@google/genai";
import { StudyLevel, StructuredSummary } from "./types";

// We halen de klasse direct uit de volledige import-container
const genAI = new (GoogleGenAI as any).GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `Je bent een gespecialiseerde onderwijsassistent voor het Vlaamse middelbaar onderwijs. Gebruik alleen de verstrekte tekst.`;

export const generateSummary = async (text: string, level: StudyLevel): Promise<StructuredSummary> => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION 
  });

  const prompt = `Maak een samenvatting voor ${level} in JSON van: ${text}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
};
