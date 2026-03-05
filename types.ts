export enum Difficulty {
  BEGINNER = "Iniciante",
  INTERMEDIATE = "Intermediário",
  ADVANCED = "Avançado",
}

export enum Theme {
  FANTASY = "Fantasia Medieval",
  SCIFI = "Ficção Científica",
  MYSTERY = "Mistério Noir",
  SURVIVAL = "Sobrevivência Zumbi",
}

export enum GameMode {
  STORY = "História",
  SURVIVAL = "Sobrevivência",
}

export type ChallengeFormat =
  | "multiple_choice"
  | "fill_blank"
  | "word_order"
  | "translation"
  | "bubble_pop";

export interface Challenge {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type: "vocabulary" | "grammar" | "comprehension";
  challengeFormat?: ChallengeFormat;
  // fill_blank & translation
  answer?: string;
  // word_order
  scrambledWords?: string[];
  sentence?: string;
  // bubble_pop
  bubbleCategory?: string;
  correctBubbles?: string[];
  wrongBubbles?: string[];
}

export interface StoryChoice {
  text: string;
  intent: string; // Internal hint for the AI about what this choice implies
}

export type SceneMood =
  | "peaceful"
  | "suspense"
  | "combat"
  | "magical"
  | "creepy"
  | "cyberpunk";

export interface StorySegment {
  content: string; // English text
  translation: string; // Portuguese help text
  choices: StoryChoice[];
  challenge: Challenge; // The challenge required to unlock the NEXT segment
  xpReward: number;
  itemReward?: string | null; // Optional item reward
  imageKeyword: string; // Keyword to generate an image
  imageUrl?: string | null; // Base64 image data persisted
  audioUrl?: string | null; // Base64 audio data persisted
  mood: SceneMood; // The atmospheric mood of the scene
}

export interface PlayerState {
  name: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
  health: number;
  maxHealth: number;
  inventory: string[];
}

export interface UserProfile {
  name: string;
  avatarUrl: string | null;
}

export interface AudioSettings {
  voiceURI: string | null; // ID of the specific browser voice
  speechRate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
  useAIVoice: boolean; // OpenAI TTS
  aiVoice: string; // OpenAI voice selection (onyx, alloy, etc)
}

export interface WordTranslation {
  portuguese: string;
  definition: string;
  grammarClass: string;
}

export interface GameState {
  id?: string;
  isPlaying: boolean;
  isLoading: boolean;
  mode: GameMode;
  history: StorySegment[];
  currentSegment: StorySegment | null;
  player: PlayerState;
  theme: Theme;
  difficulty: Difficulty;
  isChallengeActive: boolean;
  challengeSolved: boolean;
  gameOver: boolean;
  settings: AudioSettings; // Global settings
}
