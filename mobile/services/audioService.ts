import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { AudioSettings, SceneMood, Theme } from "../types";

let themeMusic: Audio.Sound | null = null;
let currentTheme: Theme | null = null;
let ambienceSound: Audio.Sound | null = null;
let currentMood: SceneMood | null = null;
let musicVolume: number = 0.3;
let ambienceVolume: number = 0.2;

// Thematic Background Music (Melodic)
const THEME_MUSIC_URLS: Record<string, string> = {
  [Theme.FANTASY]:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Medieval/Epic
  [Theme.SCIFI]:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", // Synthwave/Space
  [Theme.MYSTERY]:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", // Noir/Jazz
  [Theme.SURVIVAL]:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", // Dark/Industrial
};

// Atmospheric Ambience (Textures)
const AMBIENCE_URLS: Record<string, string> = {
  peaceful: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", // Nature/Ambience
  fantasy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  combat: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  suspense: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  creepy: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  magical: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  cyberpunk: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
};

export const initAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (e) {
    console.error("Audio init error:", e);
  }
};

export const playSfx = async (type: string) => {
  // In a real mobile app, we would load local assets
  // e.g. const { sound } = await Audio.Sound.createAsync(require('../assets/click.mp3'));
  // await sound.playAsync();
  console.log("SFX:", type);
};

export const stopAudio = async () => {
  if (themeMusic) {
    await themeMusic.stopAsync();
    await themeMusic.unloadAsync();
    themeMusic = null;
    currentTheme = null;
  }
  if (ambienceSound) {
    await ambienceSound.stopAsync();
    await ambienceSound.unloadAsync();
    ambienceSound = null;
    currentMood = null;
  }
};

export const stopAmbience = stopAudio;

export const setThemeMusic = async (theme: Theme) => {
  if (currentTheme === theme) return;

  if (themeMusic) {
    await themeMusic.stopAsync();
    await themeMusic.unloadAsync();
  }

  currentTheme = theme;
  console.log("Setting Theme Music:", theme);
  const url = THEME_MUSIC_URLS[theme];

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, isLooping: true, volume: musicVolume },
    );
    themeMusic = sound;
  } catch (e) {
    console.error("Failed to load theme music:", e);
  }
};

export const setAmbience = async (mood: SceneMood) => {
  if (currentMood === mood) return;

  if (ambienceSound) {
    await ambienceSound.stopAsync();
    await ambienceSound.unloadAsync();
  }

  currentMood = mood;
  console.log("Setting Ambience Mood:", mood);
  const url = AMBIENCE_URLS[mood] || AMBIENCE_URLS.peaceful;

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, isLooping: true, volume: ambienceVolume },
    );
    ambienceSound = sound;
  } catch (e) {
    console.error("Failed to load ambience:", e);
  }
};

export const setMusicVolume = async (vol: number) => {
  musicVolume = vol;
  ambienceVolume = vol * 0.7; // Keep ambience slightly quieter than music
  if (themeMusic) {
    await themeMusic.setVolumeAsync(vol);
  }
  if (ambienceSound) {
    await ambienceSound.setVolumeAsync(ambienceVolume);
  }
};

import { generateSpeech } from "./aiService";

export const speakText = async (
  text: string,
  settings?: AudioSettings,
  overrideRate?: number,
  onEnd?: () => void,
) => {
  try {
    const isAlreadySpeaking = await isSpeaking();
    if (isAlreadySpeaking) {
      await stopSpeech();
    }

    // DUCKING START
    if (themeMusic) {
      await themeMusic.setVolumeAsync(0.05);
    }
    if (ambienceSound) {
      await ambienceSound.setVolumeAsync(0.02);
    }

    const wrapEnd = async () => {
      if (themeMusic) {
        await themeMusic.setVolumeAsync(musicVolume);
      }
      if (ambienceSound) {
        await ambienceSound.setVolumeAsync(ambienceVolume);
      }
      if (onEnd) onEnd();
    };

    if (settings?.useAIVoice) {
      // 1. Check if we already have a prefetched/pre-generated audio URL
      let audioUri = (settings as any).prefetchedAudio || null;

      if (!audioUri) {
        const audioBase64 = await generateSpeech(text, settings.aiVoice);
        if (audioBase64) {
          audioUri = audioBase64;
        }
      }

      if (audioUri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, volume: 1.0 },
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
            wrapEnd();
          }
        });
        return;
      }
    }

    Speech.speak(text, {
      language: "en-US",
      rate: overrideRate || settings?.speechRate || 1.0,
      pitch: settings?.pitch || 1.0,
      onDone: () => {
        wrapEnd();
      },
      onError: () => {
        wrapEnd();
      },
    });
  } catch (e) {
    console.error("Speech error:", e);
    if (themeMusic) {
      await themeMusic.setVolumeAsync(musicVolume);
    }
    if (ambienceSound) {
      await ambienceSound.setVolumeAsync(ambienceVolume);
    }
    if (onEnd) onEnd();
  }
};

export const stopSpeech = async () => {
  await Speech.stop();
};

export const pauseSpeech = async () => {
  await Speech.pause();
};

export const resumeSpeech = async () => {
  await Speech.resume();
};

export const isSpeaking = async () => {
  return await Speech.isSpeakingAsync();
};
