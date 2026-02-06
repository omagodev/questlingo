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

export interface Challenge {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type: "vocabulary" | "grammar" | "comprehension";
}

export interface StoryChoice {
  text: string;
  intent: string;
}

export type SceneMood =
  | "peaceful"
  | "suspense"
  | "combat"
  | "magical"
  | "creepy"
  | "cyberpunk";

export interface StorySegment {
  content: string;
  translation: string;
  choices: StoryChoice[];
  challenge: Challenge;
  xpReward: number;
  itemReward?: string | null;
  imageKeyword: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  mood: SceneMood;
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
  voiceURI: string | null;
  speechRate: number;
  pitch: number;
  useAIVoice: boolean;
  aiVoice: string;
}

export interface WordTranslation {
  portuguese: string;
  definition: string;
  grammarClass: string;
}

export interface GameState {
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
  settings: AudioSettings;
}
