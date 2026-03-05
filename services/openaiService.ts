import { StorySegment, Difficulty, Theme, WordTranslation } from "../types";
import { getApiUrl } from "./config";

// The frontend no longer initializes the OpenAI client directly.
// All calls are proxied through the backend to protect API keys.

const MODEL_NAME = "gpt-4o-mini";

// Random creative elements to ensure story variety
const SETTINGS = [
  "a crumbling ancient tower",
  "a bustling underground market",
  "a frozen lake",
  "a hidden garden behind a waterfall",
  "a sky city on floating islands",
  "a sunken ship graveyard",
  "a haunted library",
  "a volcanic forge",
  "a desert oasis at night",
  "a crystal cave deep underground",
  "a cursed swamp",
  "a clockwork fortress",
  "a moonlit rooftop",
  "a carnival of illusions",
  "a battlefield after the war",
  "a sacred temple in the clouds",
  "a pirate harbor at dawn",
  "an enchanted forest clearing",
  "a ruined cathedral",
  "a dragon's lair",
];

const PROTAGONIST_TRAITS = [
  "a clever thief with a heart of gold",
  "a shy healer discovering their power",
  "a retired warrior seeking redemption",
  "a curious inventor",
  "a lost traveler from another world",
  "a mischievous bard",
  "a noble knight questioning their oath",
  "street orphan with hidden talent",
  "a scholar decoding ancient runes",
  "a rebel leader in disguise",
  "a bounty hunter with a secret past",
  "a shapeshifter learning to control their gift",
];

const PLOT_HOOKS = [
  "a mysterious letter arrives",
  "a strange creature appears",
  "an old enemy returns",
  "a magical artifact is discovered",
  "a portal opens unexpectedly",
  "a betrayal is revealed",
  "a prophecy begins to unfold",
  "a natural disaster strikes",
  "a festival turns chaotic",
  "a forbidden spell is cast",
  "a long-lost friend sends a signal",
  "an ancient seal breaks",
];

const pickRandom = (arr: string[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const getCreativeSeed = () => {
  return `Creative Direction (use as inspiration, be creative and original):
  - Setting: ${pickRandom(SETTINGS)}
  - Protagonist trait: ${pickRandom(PROTAGONIST_TRAITS)}
  - Plot hook: ${pickRandom(PLOT_HOOKS)}
  - Random seed: ${Math.random().toString(36).substring(2, 8)}`;
};

const STORY_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "story_segment",
    schema: {
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
          required: [
            "question",
            "options",
            "correctIndex",
            "explanation",
            "type",
          ],
        },
        xpReward: { type: "integer" },
        itemReward: { type: ["string", "null"] },
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
    Theme: ${theme}, Difficulty: ${difficulty}. Step 1 of 10.
    ${getCreativeSeed()}
  `;

  const response = await fetch(getApiUrl("/api/ai/openai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "You are an engaging storyteller and English teacher. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: STORY_SCHEMA,
      temperature: 1.3,
    }),
  });

  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as StorySegment;
};

export const generateNextSegment = async (
  previousContent: string,
  userChoice: string,
  difficulty: Difficulty,
  currentStep: number,
): Promise<StorySegment> => {
  const isFinale = currentStep >= 10;
  const prompt = `
    Interactive story. Step: ${currentStep} of 10. Previous: "${previousContent}". Choice: "${userChoice}". Difficulty: ${difficulty}.
    ${isFinale ? "CRITICAL: Final scene. Conclude satisfyingly. No choices." : ""}
    ${getCreativeSeed()}
  `;

  const response = await fetch(getApiUrl("/api/ai/openai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "You are an engaging storyteller and English teacher. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: STORY_SCHEMA,
      temperature: 1.3,
    }),
  });

  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as StorySegment;
};

export const generateSurvivalSegment = async (
  theme: Theme,
  difficulty: Difficulty,
  round: number,
): Promise<StorySegment> => {
  const prompt = `
    Mode: SURVIVAL MODE (Round ${round}). Theme: ${theme}. Difficulty: ${difficulty}.
    ${getCreativeSeed()}
  `;

  const response = await fetch(getApiUrl("/api/ai/openai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "You are an engaging storyteller. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: STORY_SCHEMA,
    }),
  });

  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as StorySegment;
};

export const askTutor = async (
  segment: StorySegment,
  userQuestion: string,
): Promise<string> => {
  const prompt = `
    Helper English Tutor. Story: "${segment.content}". User Question: "${userQuestion}".
    Answer in Portuguese (max 2 sentences, hints only).
  `;

  const response = await fetch(getApiUrl("/api/ai/openai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a helpful English Tutor." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) return "Ocorreu um erro ao consultar o tutor.";
  const data = await response.json();
  return data.choices[0].message.content || "Sem resposta do tutor.";
};

export const translateWord = async (
  word: string,
  context: string,
): Promise<WordTranslation> => {
  const prompt = `Translate "${word}" based on context: "${context}".`;
  const SCHEMA = {
    type: "json_schema",
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
      },
      strict: true,
    },
  };

  const response = await fetch(getApiUrl("/api/ai/openai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "Translator helper." },
        { role: "user", content: prompt },
      ],
      response_format: SCHEMA,
    }),
  });

  if (!response.ok)
    return { portuguese: "Erro", definition: "Erro", grammarClass: "?" };
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as WordTranslation;
};

export const generateSceneImage = async (
  description: string,
  characterImageBase64?: string | null,
): Promise<string | null> => {
  let prompt = `Pixel art style, 32-bit retro game, scene: ${description}. Vibrant, wide shot.`;
  if (characterImageBase64) prompt += " Include the main character.";

  try {
    const response = await fetch(getApiUrl("/api/ai/openai/images"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (error) {
    return null;
  }
};

export const generateAvatar = async (
  description: string,
  referenceImageBase64?: string | null,
): Promise<string | null> => {
  const prompt = `Pixel art style, 32-bit retro rpg character portrait, close up, ${description}, white background.`;
  try {
    const response = await fetch(getApiUrl("/api/ai/openai/images"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (error) {
    return null;
  }
};

export const generateSpeech = async (
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "onyx",
): Promise<string | null> => {
  try {
    const response = await fetch(getApiUrl("/api/ai/openai/speech"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text, voice }),
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};
