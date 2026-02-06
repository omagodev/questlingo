import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StorySegment, Difficulty, Theme } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.0-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

// Define the response schema for strict JSON output
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    content: {
      type: Type.STRING,
      description: "The story segment in English. About 2-3 sentences.",
    },
    translation: {
      type: Type.STRING,
      description: "Portuguese translation of the story segment.",
    },
    mood: {
      type: Type.STRING,
      enum: [
        "peaceful",
        "suspense",
        "combat",
        "magical",
        "creepy",
        "cyberpunk",
      ],
      description: "The atmospheric mood/soundtrack for this scene.",
    },
    imageKeyword: {
      type: Type.STRING,
      description:
        "A detailed visual description of the scene based on the story content. Include setting, lighting, and key characters.",
    },
    choices: {
      type: Type.ARRAY,
      description:
        "Two distinct actions the player can take. If this is the final scene (Step 10), return an empty array.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: "The choice description in English.",
          },
          intent: {
            type: Type.STRING,
            description: "A short summary of what this choice leads to.",
          },
        },
        required: ["text", "intent"],
      },
    },
    challenge: {
      type: Type.OBJECT,
      description: "A micro-learning challenge related to the story context.",
      properties: {
        question: {
          type: Type.STRING,
          description: "The question in Portuguese asking about English.",
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "4 possible answers.",
        },
        correctIndex: {
          type: Type.INTEGER,
          description: "Index of the correct answer (0-3).",
        },
        explanation: {
          type: Type.STRING,
          description:
            "Explanation of why the answer is correct in Portuguese.",
        },
        type: {
          type: Type.STRING,
          description:
            "Type of challenge: vocabulary, grammar, or comprehension.",
        },
      },
      required: ["question", "options", "correctIndex", "explanation", "type"],
    },
    xpReward: {
      type: Type.INTEGER,
      description: "XP reward between 10 and 50.",
    },
    itemReward: {
      type: Type.STRING,
      description:
        "Name of a special item found in this scene. Return null if no item found.",
      nullable: true,
    },
  },
  required: [
    "content",
    "translation",
    "choices",
    "challenge",
    "xpReward",
    "imageKeyword",
    "itemReward",
    "mood",
  ],
};

export interface WordTranslation {
  portuguese: string;
  definition: string;
  grammarClass: string;
}

const translationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    portuguese: {
      type: Type.STRING,
      description: "Portuguese translation of the word.",
    },
    definition: {
      type: Type.STRING,
      description: "Brief definition and context explanation in Portuguese.",
    },
    grammarClass: {
      type: Type.STRING,
      description: "Grammar class (Substantivo, Verbo, Adjetivo, etc).",
    },
  },
  required: ["portuguese", "definition", "grammarClass"],
};

export const generateStoryStart = async (
  theme: Theme,
  difficulty: Difficulty,
): Promise<StorySegment> => {
  const prompt = `
    You are a Dungeon Master for a gamified English learning app.
    The user speaks Portuguese and wants to learn English.
    
    Theme: ${theme}
    Difficulty Level: ${difficulty}
    
    Create the opening scene (Step 1 of 10) of the story. 
    Keep the English simple if Beginner, or more complex if Advanced.
    Include a multiple-choice challenge.
    Select a 'mood' that fits the atmosphere.
    Provide a detailed 'imageKeyword' describing the scene visually.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
        systemInstruction:
          "You are an engaging storyteller and English teacher. Always return valid JSON. This is an epic 10-scene journey.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as StorySegment;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateNextSegment = async (
  previousContent: string,
  userChoice: string,
  difficulty: Difficulty,
  currentStep: number,
): Promise<StorySegment> => {
  const isFinale = currentStep >= 10;
  const prompt = `
    Context: Interactive story.
    Step: ${currentStep} of 10.
    Previous Scene: "${previousContent}"
    User Choice: "${userChoice}"
    Difficulty: ${difficulty}

    Generate segment ${currentStep}.
    ${isFinale ? "CRITICAL: This is the FINAL scene (Step 10). Conclude the story with an epic and satisfying resolution. DO NOT offer any choices (return empty choices array)." : "Proceed with the narrative."}
    Create a NEW challenge relevant to this segment.
    Select a 'mood' and provide an 'imageKeyword'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as StorySegment;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateSurvivalSegment = async (
  theme: Theme,
  difficulty: Difficulty,
  round: number,
): Promise<StorySegment> => {
  const prompt = `
    Mode: SURVIVAL MODE (Round ${round})
    Theme: ${theme}
    Difficulty: ${difficulty}
    The user is fighting for survival.
    Requirements:
    1. 'content': A short, urgent situation description in English.
    2. 'challenge': A hard English question.
    3. 'choices': Must contain EXACTLY ONE choice: { "text": "Next Wave / Próxima Onda", "intent": "next_wave" }.
    6. 'mood': Must be 'combat' or 'suspense'.
    7. 'imageKeyword': Detailed visual description.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as StorySegment;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const askTutor = async (
  segment: StorySegment,
  userQuestion: string,
): Promise<string> => {
  const prompt = `
    You are a helpful English Tutor.
    Story segment: "${segment.content}".
    User Question: "${userQuestion}"
    Answer in Portuguese (short, max 2 sentences). Give hints, not the direct answer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Desculpe, não consegui entender sua dúvida.";
  } catch (error) {
    console.error("Tutor Error:", error);
    return "Ocorreu um erro ao consultar o tutor.";
  }
};

export const translateWord = async (
  word: string,
  context: string,
): Promise<WordTranslation> => {
  const prompt = `Translate "${word}" to Portuguese based on context: "${context}".`;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: translationSchema,
      },
    });
    if (response.text) return JSON.parse(response.text) as WordTranslation;
    throw new Error("No response");
  } catch (error) {
    return { portuguese: "Erro", definition: "Erro", grammarClass: "?" };
  }
};

export const generateSceneImage = async (
  description: string,
  characterImageBase64?: string | null,
): Promise<string | null> => {
  const parts: any[] = [];
  if (characterImageBase64) {
    const matches = characterImageBase64.match(/^data:(.*);base64,(.*)$/);
    if (matches)
      parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
  }

  let prompt = `pixel art style, 32-bit retro game, scene: ${description}, vibrant, high resolution`;
  if (characterImageBase64)
    prompt = `Reference character as protagonist in scene: ${description}. Pixel art 32-bit style.`;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData)
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const generateAvatar = async (
  description: string,
  referenceImageBase64?: string | null,
): Promise<string | null> => {
  const parts: any[] = [];
  if (referenceImageBase64) {
    const matches = referenceImageBase64.match(/^data:(.*);base64,(.*)$/);
    if (matches)
      parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
  }
  let finalPrompt = `pixel art style, 32-bit retro rpg character portrait, close up, ${description}, white background`;
  if (referenceImageBase64)
    finalPrompt = `Transform reference into: ${finalPrompt}`;
  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData)
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};
