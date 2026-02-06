import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "../types";

export interface SaveSlot {
  id: string;
  date: number;
  summary: string;
  state: GameState;
}

const STORAGE_KEY = "lingoQuest_saves";

export const getSaves = async (): Promise<SaveSlot[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error reading saves", e);
    return [];
  }
};

export const saveGame = async (state: GameState): Promise<boolean> => {
  try {
    const saves = await getSaves();
    const storyId = `save_${Date.now()}`;
    const newSave: SaveSlot = {
      id: storyId,
      date: Date.now(),
      summary: `Lvl ${state.player.level} • ${state.theme} • ${new Date().toLocaleDateString()}`,
      state: state,
    };

    const newSaves = [newSave, ...saves];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSaves));
    return true;
  } catch (e) {
    console.error("Error saving game", e);
    return false;
  }
};

export const loadGame = async (id: string): Promise<GameState | null> => {
  try {
    const saves = await getSaves();
    const save = saves.find((s) => s.id === id);
    return save ? save.state : null;
  } catch (e) {
    console.error("Error loading game", e);
    return null;
  }
};

export const deleteSave = async (id: string): Promise<boolean> => {
  try {
    const saves = await getSaves();
    const newSaves = saves.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSaves));
    return true;
  } catch (e) {
    console.error("Error deleting save", e);
    return false;
  }
};
