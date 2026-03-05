import { StorySegment, Difficulty, Theme } from "../types";
import { getApiUrl } from "./config";

// The frontend no longer initializes the Gemini client directly.
// All calls are proxied through the backend to protect API keys.

export interface WordTranslation {
  portuguese: string;
  definition: string;
  grammarClass: string;
}

const STORY_SCHEMA = {
  type: "object",
  properties: {
    content: { type: "string" },
    translation: { type: "string" },
    mood: {
      type: "string",
      enum: [
        "peaceful",
        "suspense",
        "combat",
        "magical",
        "creepy",
        "cyberpunk",
      ],
    },
    imageKeyword: { type: "string" },
    choices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          intent: { type: "string" },
        },
        required: ["text", "intent"],
      },
    },
    challenge: {
      type: "object",
      properties: {
        question: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        correctIndex: { type: "integer" },
        explanation: { type: "string" },
        type: { type: "string" },
      },
      required: ["question", "options", "correctIndex", "explanation", "type"],
    },
    xpReward: { type: "integer" },
    itemReward: { type: "string", nullable: true },
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

export const generateStoryStart = async (
  theme: Theme,
  difficulty: Difficulty,
): Promise<StorySegment> => {
  const prompt = `
    Dungeon Master for English learning. Theme: ${theme}, Difficulty: ${difficulty}. Opening scene (1 of 10).
  `;

  const response = await fetch(getApiUrl("/api/ai/gemini/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: STORY_SCHEMA,
      },
    }),
  });

  if (!response.ok) throw new Error("Gemini request failed");
  const data = await response.json();
  return JSON.parse(data.text) as StorySegment;
};

export const generateNextSegment = async (
  previousContent: string,
  userChoice: string,
  difficulty: Difficulty,
  currentStep: number,
): Promise<StorySegment> => {
  const isFinale = currentStep >= 10;
  const prompt = `
    Step: ${currentStep} of 10. Previous: "${previousContent}". Choice: "${userChoice}".
    ${isFinale ? "CRITICAL: Final scene. satisfied resolution. Empty choices array." : ""}
  `;

  const response = await fetch(getApiUrl("/api/ai/gemini/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: STORY_SCHEMA,
      },
    }),
  });

  if (!response.ok) throw new Error("Gemini request failed");
  const data = await response.json();
  return JSON.parse(data.text) as StorySegment;
};

export const generateSurvivalSegment = async (
  theme: Theme,
  difficulty: Difficulty,
  round: number,
): Promise<StorySegment> => {
  const prompt = `SURVIVAL MODE (Round ${round}). Theme: ${theme}. Difficulty: ${difficulty}.`;

  const response = await fetch(getApiUrl("/api/ai/gemini/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: STORY_SCHEMA,
      },
    }),
  });

  if (!response.ok) throw new Error("Gemini request failed");
  const data = await response.json();
  return JSON.parse(data.text) as StorySegment;
};

export const askTutor = async (
  segment: StorySegment,
  userQuestion: string,
): Promise<string> => {
  const prompt = `English Tutor. Story: "${segment.content}". User Question: "${userQuestion}". Portuguese (max 2 sentences, hints only).`;

  const response = await fetch(getApiUrl("/api/ai/gemini/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: prompt }),
  });

  if (!response.ok) return "Erro ao consultar o tutor.";
  const data = await response.json();
  return data.text || "Sem resposta.";
};

export const translateWord = async (
  word: string,
  context: string,
): Promise<WordTranslation> => {
  const prompt = `Translate "${word}" based on context: "${context}".`;
  const SCHEMA = {
    type: "object",
    properties: {
      portuguese: { type: "string" },
      definition: { type: "string" },
      grammarClass: { type: "string" },
    },
    required: ["portuguese", "definition", "grammarClass"],
  };

  const response = await fetch(getApiUrl("/api/ai/gemini/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
      },
    }),
  });

  if (!response.ok)
    return { portuguese: "Erro", definition: "Erro", grammarClass: "?" };
  const data = await response.json();
  return JSON.parse(data.text) as WordTranslation;
};

export const generateSceneImage = async (
  description: string,
  characterImageBase64?: string | null,
): Promise<string | null> => {
  // Note: Gemini Image generation through proxy remains similar but calls specialized endpoint if implemented.
  // For now, redirecting to OpenAI image generation as it's more stable in this project's context.
  // Or implementing a generic one if needed.
  return null; // Simplified for now as OpenAI is default.
};

export const generateAvatar = async (
  description: string,
  referenceImageBase64?: string | null,
): Promise<string | null> => {
  return null; // Simplified for now.
};
