// Simple synth for 8-bit style sound effects using Web Audio API
import { SceneMood, AudioSettings, Theme } from "../types";

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;
let backgroundGain: GainNode | null = null; // Master volume for background sounds

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (!backgroundGain && audioCtx) {
    backgroundGain = audioCtx.createGain();
    backgroundGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    backgroundGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch((err) => console.error("Audio resume failed", err));
  }
};

// --- SFX Logic ---

export type SoundType =
  | "CLICK"
  | "SUCCESS"
  | "ERROR"
  | "LEVEL_UP"
  | "GAME_OVER"
  | "TYPE";

const playTone = (
  freq: number,
  type: OscillatorType,
  duration: number,
  startTime: number,
  vol: number = 0.1,
) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playSfx = (type: SoundType) => {
  try {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    switch (type) {
      case "CLICK":
        playTone(600, "square", 0.05, now, 0.05);
        break;
      case "SUCCESS":
        playTone(440, "sine", 0.1, now, 0.1);
        playTone(554, "sine", 0.1, now + 0.08, 0.1);
        playTone(659, "sine", 0.2, now + 0.16, 0.1);
        break;
      case "ERROR":
        playTone(150, "sawtooth", 0.2, now, 0.1);
        playTone(100, "sawtooth", 0.3, now + 0.1, 0.1);
        break;
      case "LEVEL_UP":
        playTone(440, "square", 0.1, now, 0.1);
        playTone(554, "square", 0.1, now + 0.1, 0.1);
        playTone(659, "square", 0.1, now + 0.2, 0.1);
        playTone(880, "square", 0.4, now + 0.3, 0.1);
        break;
      case "GAME_OVER":
        playTone(300, "triangle", 0.3, now, 0.15);
        playTone(250, "triangle", 0.3, now + 0.25, 0.15);
        playTone(200, "triangle", 0.3, now + 0.5, 0.15);
        playTone(150, "triangle", 0.8, now + 0.75, 0.15);
        break;
      case "TYPE":
        playTone(800, "triangle", 0.03, now, 0.02);
        break;
    }
  } catch (e) {
    console.warn("Audio playback failed", e);
  }
};

// ─── Background Music Engine (MP3-based) ────────────────────────────

// Track lists per theme folder
const MEDIEVAL_TRACKS = [
  "/bd-sound/medieval/deuslower-medieval-ambient-236809.mp3",
  "/bd-sound/medieval/tunetank-medieval-background-348171.mp3",
  "/bd-sound/medieval/tunetank-medieval-waltz-music-412748.mp3",
  "/bd-sound/medieval/tunetank-medieval-waltz-music-412748 (1).mp3",
  "/bd-sound/medieval/watermelon_beats-medieval-folk-music-2026-489261.mp3",
];

const SCIFI_TRACKS = [
  "/bd-sound/sci-fi/deuslower-medieval-ambient-236809.mp3",
  "/bd-sound/sci-fi/tunetank-medieval-background-348171.mp3",
  "/bd-sound/sci-fi/tunetank-medieval-waltz-music-412748.mp3",
  "/bd-sound/sci-fi/tunetank-medieval-waltz-music-412748 (1).mp3",
  "/bd-sound/sci-fi/watermelon_beats-medieval-folk-music-2026-489261.mp3",
];

const CHALLENGE_TRACKS = [
  "/bd-sound/challenge/liecio-dark-drone-ambient-312347.mp3",
  "/bd-sound/challenge/liecio-hi-sounds-of-dread-premonition-soundscapes-312346.mp3",
  "/bd-sound/challenge/nxtlvl_snds-dark-cinematic-drone-deep-bass-ambient-456038.mp3",
  "/bd-sound/challenge/pastichio_piano_music-tension-and-release-289419.mp3",
  "/bd-sound/challenge/roneyfriday-suspense-tension-341051.mp3",
  "/bd-sound/challenge/valddos-dark-night-269715.mp3",
];

// Map themes to track folders
const getTracksForTheme = (theme: Theme): string[] => {
  switch (theme) {
    case Theme.SCIFI:
      return SCIFI_TRACKS;
    case Theme.FANTASY:
    case Theme.MYSTERY:
    case Theme.SURVIVAL:
    default:
      return MEDIEVAL_TRACKS;
  }
};

// State
let bgAudio: HTMLAudioElement | null = null;
let challengeAudio: HTMLAudioElement | null = null;
let currentTheme: Theme | null = null;
let currentTrackIndex = 0;
let isMuted = false;

const BG_VOLUME = 0.3;
const CHALLENGE_VOLUME = 0.35;

// ─── Theme Music ──────────────────────────────────────────────

/** Start or switch the theme background music, rotating through available tracks. */
export const setThemeMusic = (theme: Theme, chapterIndex: number = 0) => {
  if (isMuted) {
    currentTheme = theme;
    currentTrackIndex = chapterIndex;
    return;
  }

  const tracks = getTracksForTheme(theme);
  const trackIdx = chapterIndex % tracks.length;
  const trackUrl = tracks[trackIdx];

  // Already playing this exact track?
  if (
    bgAudio &&
    currentTheme === theme &&
    currentTrackIndex === trackIdx &&
    !bgAudio.paused
  ) {
    return;
  }

  // Stop current
  stopThemeMusic();

  currentTheme = theme;
  currentTrackIndex = trackIdx;

  bgAudio = new Audio(trackUrl);
  bgAudio.loop = true;
  bgAudio.volume = BG_VOLUME;
  bgAudio.play().catch((e) => console.warn("Theme music play failed:", e));
};

const stopThemeMusic = () => {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.src = "";
    bgAudio = null;
  }
};

// ─── Challenge Music ──────────────────────────────────────────

/** Start a random challenge track, ducking the theme music. */
export const setChallengeMusic = () => {
  if (isMuted) return;

  // Duck theme music
  if (bgAudio) {
    bgAudio.volume = 0.08;
  }

  // Pick random challenge track
  const track =
    CHALLENGE_TRACKS[Math.floor(Math.random() * CHALLENGE_TRACKS.length)];

  stopChallengeMusic();

  challengeAudio = new Audio(track);
  challengeAudio.loop = true;
  challengeAudio.volume = CHALLENGE_VOLUME;
  challengeAudio
    .play()
    .catch((e) => console.warn("Challenge music play failed:", e));
};

/** Stop challenge track and restore theme music volume. */
export const stopChallengeMusic = () => {
  if (challengeAudio) {
    challengeAudio.pause();
    challengeAudio.src = "";
    challengeAudio = null;
  }

  // Restore theme music volume
  if (bgAudio && !isMuted) {
    bgAudio.volume = BG_VOLUME;
  }
};

// ─── Mute / Legacy API ────────────────────────────────────────

/** Stops all background music (theme + challenge). Used by mute button. */
export const stopAmbience = () => {
  stopThemeMusic();
  stopChallengeMusic();
  currentTheme = null;
};

/** Legacy setAmbience — delegates to setThemeMusic if a theme is active. */
export const setAmbience = (mood: SceneMood, forceRestart: boolean = false) => {
  // This is called from StoryView per segment mood change.
  // If theme music is already playing, just keep it going.
  // The mute toggle uses this to restart music.
  if (forceRestart && currentTheme) {
    setThemeMusic(currentTheme, currentTrackIndex);
  }
};

/** Toggle mute state. Returns new muted state. */
export const toggleMute = (): boolean => {
  isMuted = !isMuted;
  if (isMuted) {
    if (bgAudio) bgAudio.volume = 0;
    if (challengeAudio) challengeAudio.volume = 0;
  } else {
    if (bgAudio) bgAudio.volume = BG_VOLUME;
    if (challengeAudio) challengeAudio.volume = CHALLENGE_VOLUME;
  }
  return isMuted;
};

export const isAudioMuted = (): boolean => isMuted;

// --- Text to Speech (TTS) Logic ---

let currentUtterance: SpeechSynthesisUtterance | null = null;

const setBackgroundDucking = (isDucking: boolean) => {
  if (!audioCtx || !backgroundGain) return;
  const now = audioCtx.currentTime;
  const targetGain = isDucking ? 0.25 : 1.0;
  console.log(`Setting background ducking: ${isDucking} (gain: ${targetGain})`);
  backgroundGain.gain.cancelScheduledValues(now);
  backgroundGain.gain.linearRampToValueAtTime(targetGain, now + 0.4);
};

export const getEnglishVoices = (): SpeechSynthesisVoice[] => {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  // Filter mainly for English
  return voices.filter((v) => v.lang.startsWith("en"));
};

export const speakText = (
  text: string,
  settings?: AudioSettings,
  overrideRate?: number,
  onEnd?: () => void,
) => {
  if (!("speechSynthesis" in window)) {
    console.warn("Browser does not support TTS");
    return;
  }

  // Cancel any ongoing speech and clear its listeners to avoid state race conditions
  if (currentUtterance) {
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  const voices = window.speechSynthesis.getVoices();

  // Voice Selection Logic
  let selectedVoice: SpeechSynthesisVoice | undefined;

  // 1. Try user preference
  if (settings?.voiceURI) {
    selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
  }

  // 2. Fallback to Medieval Style Logic (UK Male preference)
  if (!selectedVoice) {
    selectedVoice = voices.find(
      (v) =>
        v.name.includes("UK English Male") ||
        v.name.includes("Google UK English Male"),
    );
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang === "en-GB" && v.name.includes("Male"),
      );
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang === "en-US" && v.name.includes("Male"),
      );
    }
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => v.lang.startsWith("en"));
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Rate & Pitch Logic
  const userRate = settings?.speechRate ?? 1.0;
  const userPitch = settings?.pitch ?? 1.0;

  if (overrideRate) {
    utterance.rate = 0.7; // Very slow fixed rate for "Slow" button
  } else {
    utterance.rate = 0.9 * userRate;
  }

  utterance.pitch = 0.9 * userPitch;

  utterance.onend = () => {
    currentUtterance = null;
    setBackgroundDucking(false);
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    currentUtterance = null;
    setBackgroundDucking(false);
    if (onEnd) onEnd();
  };

  setBackgroundDucking(true);
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ("speechSynthesis" in window) {
    if (currentUtterance) {
      currentUtterance.onend = null;
      currentUtterance.onerror = null;
      currentUtterance = null;
    }
    window.speechSynthesis.cancel();
    setBackgroundDucking(false);
  }
};

export const pauseSpeech = () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.pause();
    setBackgroundDucking(false);
  }
};

export const resumeSpeech = () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.resume();
    setBackgroundDucking(true);
  }
};

export const isSpeaking = () => {
  return "speechSynthesis" in window && window.speechSynthesis.speaking;
};

export const isPaused = () => {
  return "speechSynthesis" in window && window.speechSynthesis.paused;
};
