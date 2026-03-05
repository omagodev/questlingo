import { GameState } from "../types";
import { getApiUrl } from "./config";

export interface SaveSlot {
  id: string;
  date: number;
  summary: string; // e.g. "Level 3 - Fantasy"
  state: GameState;
}

export const getSaves = async (): Promise<SaveSlot[]> => {
  try {
    const response = await fetch(getApiUrl("/api/stories"));
    if (!response.ok) throw new Error("Failed to fetch saves");
    return await response.json();
  } catch (e) {
    console.error("Error reading saves", e);
    return [];
  }
};

export const saveGame = async (state: GameState): Promise<string | null> => {
  try {
    const response = await fetch(getApiUrl("/api/stories"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });

    if (!response.ok) throw new Error("Failed to save game");
    const data = await response.json();
    return data.id; // Returns the storyId generated or kept by backend
  } catch (e) {
    console.error("Error saving game", e);
    return null;
  }
};

export const loadGame = async (id: string): Promise<GameState | null> => {
  try {
    const response = await fetch(getApiUrl(`/api/stories/${id}`));
    if (!response.ok) throw new Error("Failed to load game");
    const data = await response.json();
    return data.state;
  } catch (e) {
    console.error("Error loading game", e);
    return null;
  }
};

// Deprecated or can be implemented via API DELETE endpoint if needed
export const deleteSave = async (id: string) => {
  // TODO: Implement DELETE /api/stories/:id
  console.warn("Delete not implemented in API yet");
};
