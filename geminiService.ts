
import { GoogleGenAI, Type } from "@google/genai";
import { StudyLevel, TestType, MindmapNode, GlossaryItem, Flashcard, Question, TestResult, StructuredSummary } from "./types";

// Always use process.env.API_KEY directly in the constructor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Je bent een gespecialiseerde onderwijsassistent voor het Vlaamse middelbaar onderwijs. 
BELANGRIJKSTE REGEL: Gebruik EXCLUSIEF de onderstaande verstrekte tekst om studiemateriaal te genereren. Verzin geen extra informatie die niet in de tekst staat.
Gebruik altijd Nederlands. Houd rekening met het opgegeven niveau (1ste t/m 6de middelbaar) qua taalgebruik en complexiteit.`;

export const generateSummary = async (text: string, level: StudyLevel): Promise<StructuredSummary> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Maak een zeer overzichtelijke, gestructureerde samenvatting van de volgende tekst voor een leerling uit het ${level}. 
    Verdeel de samenvatting in logische hoofdstukken met titels. Geef voor elk hoofdstuk ook een lijst met belangrijke kernpunten.
    Bedenk voor elk hoofdstuk ook een beschrijving voor een educatieve illustratie die het onderwerp visueel verduidelijkt.
    Geef het resultaat in JSON formaat.
    
    BRONTEKST:
    ${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING, description: "Een prompt voor een AI-beeldgenerator om een educatieve, heldere illustratie te maken van dit specifieke onderdeel." }
              },
              required: ["title", "content", "keyPoints", "imagePrompt"]
            }
          },
          conclusion: { type: Type.STRING }
        },
        required: ["title", "introduction", "sections", "conclusion"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch {
    throw new Error("Kon geen gestructureerde samenvatting genereren.");
  }
};

export const generateIllustration = async (prompt: string): Promise<string | null> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A clean, professional educational illustration or diagram for a school textbook about: ${prompt}. Minimalist style, clear labels if necessary, bright and engaging colors, no text if possible, white background.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateGlossary = async (text: string, level: StudyLevel): Promise<GlossaryItem[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Maak een begrippenlijst van de belangrijkste termen uit de BRONTEKST voor het ${level}. Geef voor elke term een duidelijke definitie gebaseerd op de context van de tekst. Geef het resultaat in JSON formaat.\n\nBRONTEKST:\n${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING }
          },
          required: ["term", "definition"]
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

export const generateFlashcards = async (text: string, level: StudyLevel): Promise<Flashcard[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genereer 10 effectieve steekkaarten gebaseerd op de BRONTEKST voor het ${level}. Elke kaart moet een relevante vraag of term aan de voorzijde hebben en een antwoord of uitleg aan de achterzijde, gebaseerd op de tekst. Geef het resultaat in JSON formaat.\n\nBRONTEKST:\n${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

export const generateMindmapData = async (text: string, level: StudyLevel): Promise<MindmapNode> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genereer een hiërarchische structuur voor een mindmap over de BRONTEKST voor het ${level}. De structuur moet de hoofdthema's en subthema's uit de tekst weergeven. Geef een geneste JSON terug.\n\nBRONTEKST:\n${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } } }
              }
            }
          }
        },
        required: ["name"]
      }
    }
  });
  try {
    return JSON.parse(response.text || "{}");
  } catch {
    return { name: "Root" };
  }
};

export const generateTest = async (text: string, level: StudyLevel, type: TestType): Promise<Question[]> => {
  const prompt = type === TestType.MULTIPLE_CHOICE 
    ? `Genereer een meerkeuzetoets met 5 vragen over de BRONTEKST voor het ${level}. Gebruik enkel feiten uit de tekst. Voeg voor elke vraag 4 opties toe.`
    : `Genereer een toets met 5 open vragen over de BRONTEKST voor het ${level}. Vragen moeten peilen naar begrip van de tekst.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${prompt} Geef het resultaat in JSON formaat.\n\nBRONTEKST:\n${text}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING }
          },
          required: ["id", "question", "correctAnswer"]
        }
      }
    }
  });
  try {
    const questions = JSON.parse(response.text || "[]");
    return questions.map((q: any) => ({ ...q, type }));
  } catch {
    return [];
  }
};

export const gradeTest = async (
  originalText: string, 
  questions: Question[], 
  userAnswers: Record<string, string>, 
  level: StudyLevel
): Promise<TestResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Verbeter de volgende test voor een leerling van het ${level} op basis van de originele tekst.
    
    ORIGINELE TEKST: ${originalText}
    
    VRAGEN EN CORRECTE ANTWOORDEN: ${JSON.stringify(questions)}
    
    ANTWOORDEN VAN DE LEERLING: ${JSON.stringify(userAnswers)}
    
    Geef een score op ${questions.length}, algemene feedback en gedetailleerde feedback per vraag in JSON formaat. Leg bij fouten uit wat het juiste antwoord was op basis van de tekst.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          maxScore: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          gradedQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                userAnswer: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                correctAnswer: { type: Type.STRING },
                feedback: { type: Type.STRING }
              }
            }
          }
        },
        required: ["score", "maxScore", "feedback", "gradedQuestions"]
      }
    }
  });
  try {
    return JSON.parse(response.text || "{}");
  } catch {
    return { score: 0, maxScore: 0, feedback: "Fout bij verbeteren", gradedQuestions: [] };
  }
};
