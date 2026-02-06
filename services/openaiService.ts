import OpenAI from "openai";
import { StorySegment, Difficulty, Theme, WordTranslation } from "../types";

// Initialize the client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Client-side usage
});

const MODEL_NAME = "gpt-4o-mini";
const IMAGE_MODEL_NAME = "dall-e-3";

const STORY_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "story_segment",
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The story segment in English. About 2-3 sentences.",
        },
        translation: {
          type: "string",
          description: "Portuguese translation of the story segment.",
        },
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
          description: "The atmospheric mood/soundtrack for this scene.",
        },
        imageKeyword: {
          type: "string",
          description:
            "A detailed visual description of the scene based on the story content. Include setting, lighting, and key characters.",
        },
        choices: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The choice description in English.",
              },
              intent: {
                type: "string",
                description: "A short summary of what this choice leads to.",
              },
            },
            required: ["text", "intent"],
            additionalProperties: false,
          },
        },
        challenge: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "The question in Portuguese asking about English.",
            },
            options: { type: "array", items: { type: "string" } },
            correctIndex: {
              type: "integer",
              description: "Index of the correct answer (0-3).",
            },
            explanation: {
              type: "string",
              description:
                "Explanation of why the answer is correct in Portuguese.",
            },
            type: {
              type: "string",
              description:
                "Type of challenge: vocabulary, grammar, or comprehension.",
            },
          },
          required: [
            "question",
            "options",
            "correctIndex",
            "explanation",
            "type",
          ],
          additionalProperties: false,
        },
        xpReward: {
          type: "integer",
          description: "XP reward between 10 and 50.",
        },
        itemReward: {
          type: ["string", "null"],
          description:
            "Name of a special item found in this scene. Return null if no item found.",
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
      additionalProperties: false,
    },
    strict: true,
  },
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
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are an engaging storyteller and English teacher. Always return valid JSON. This is an epic 10-scene journey.",
        },
        { role: "user", content: prompt },
      ],
      response_format: STORY_SCHEMA,
    });

    const content = completion.choices[0].message.content;
    if (content) {
      return JSON.parse(content) as StorySegment;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("OpenAI Error:", error);
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
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are an engaging storyteller and English teacher. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: STORY_SCHEMA,
    });

    const content = completion.choices[0].message.content;
    if (content) {
      return JSON.parse(content) as StorySegment;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("OpenAI Error:", error);
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
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "You are an engaging storyteller. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: STORY_SCHEMA,
    });

    const content = completion.choices[0].message.content;
    if (content) {
      return JSON.parse(content) as StorySegment;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("OpenAI Error:", error);
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
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful English Tutor." },
        { role: "user", content: prompt },
      ],
    });

    return (
      completion.choices[0].message.content ||
      "Desculpe, não consegui entender sua dúvida."
    );
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

  const TRANSLATION_SCHEMA = {
    type: "json_schema" as const,
    json_schema: {
      name: "translation",
      schema: {
        type: "object",
        properties: {
          portuguese: { type: "string" },
          definition: { type: "string" },
          grammarClass: { type: "string" },
        },
        required: ["portuguese", "definition", "grammarClass"],
        additionalProperties: false,
      },
      strict: true,
    },
  };

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "Translator helper." },
        { role: "user", content: prompt },
      ],
      response_format: TRANSLATION_SCHEMA,
    });

    const content = completion.choices[0].message.content;
    if (content) return JSON.parse(content) as WordTranslation;
    throw new Error("No response");
  } catch (error) {
    return { portuguese: "Erro", definition: "Erro", grammarClass: "?" };
  }
};

export const generateSceneImage = async (
  description: string,
  characterImageBase64?: string | null,
): Promise<string | null> => {
  // DALL-E 3 doesn't support image input for variations/edits easily in the same way, so we'll focus on prompt engineering.
  let prompt = `Pixel art style, 32-bit retro game, scene: ${description}. Vibrant, high resolution, wide shot.`;
  if (characterImageBase64) {
    // We can't pass the base64, so we trust the description includes character details or we append generic "with protagonist"
    prompt += " Include the main character in the scene.";
  }

  try {
    const response = await openai.images.generate({
      model: IMAGE_MODEL_NAME,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    return `data:image/png;base64,${response.data[0].b64_json}`;
  } catch (error) {
    console.error("DALL-E Error:", error);
    return null;
  }
};

export const generateAvatar = async (
  description: string,
  referenceImageBase64?: string | null,
): Promise<string | null> => {
  // DALL-E 3 doesn't support image-to-image explicitly in standard API for style transfer easily without variation endpoint.
  // We will stick to text-to-image.
  const prompt = `Pixel art style, 32-bit retro rpg character portrait, close up, ${description}, white background. High quality.`;

  try {
    const response = await openai.images.generate({
      model: IMAGE_MODEL_NAME,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    return `data:image/png;base64,${response.data[0].b64_json}`;
  } catch (error) {
    console.error("DALL-E Avatar Error:", error);
    return null;
  }
};
