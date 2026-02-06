// Simple synth for 8-bit style sound effects using Web Audio API
import { SceneMood, AudioSettings } from "../types";

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;
let backgroundGain: GainNode | null = null; // Master volume for background sounds
let ambienceNodes: AudioNode[] = [];
let musicTimer: number | null = null;
let currentMood: SceneMood | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (!backgroundGain && audioCtx) {
    backgroundGain = audioCtx.createGain();
    backgroundGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    backgroundGain.connect(audioCtx.destination);
    console.log("Background gain initialized");
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
        playTone(440, "sine", 0.1, now, 0.1); // A4
        playTone(554, "sine", 0.1, now + 0.08, 0.1); // C#5
        playTone(659, "sine", 0.2, now + 0.16, 0.1); // E5
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

// --- Procedural Music Engine (The Bard) ---

// Scales (frequencies in Hz)
const SCALES = {
  // Dorian Mode (Medieval/Fantasy feel) - D Minorish
  DORIAN: [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33],
  // Aeolian (Sad/Somber)
  MINOR: [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0],
  // Phrygian (Tension/Combat)
  COMBAT: [110.0, 116.54, 130.81, 146.83, 164.81, 174.61, 196.0, 220.0],
  // Whole Tone (Dreamy/Magical)
  MAGICAL: [261.63, 293.66, 329.63, 369.99, 415.3, 466.16, 523.25],
};

const playLuteNote = (freq: number, time: number, duration: number = 1.0) => {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Triangle wave sounds a bit like a plucked string/flute in 8-bit
  osc.type = "triangle";
  osc.frequency.value = freq;

  // Pluck envelope
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.15, time + 0.05); // Attack
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // Decay

  osc.connect(gain);
  if (backgroundGain) {
    gain.connect(backgroundGain);
  } else {
    gain.connect(audioCtx.destination);
  }

  osc.start(time);
  osc.stop(time + duration);
};

const playBassNote = (freq: number, time: number) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq / 2; // Octave down

  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;

  osc.connect(filter).connect(gain);
  if (backgroundGain) {
    gain.connect(backgroundGain);
  } else {
    gain.connect(audioCtx.destination);
  }
  osc.start(time);
  osc.stop(time + 0.5);
};

const startMusicSequencer = (mood: SceneMood) => {
  if (!audioCtx) return;

  let nextNoteTime = audioCtx.currentTime;
  let beatCount = 0;

  // Stop existing loop
  if (musicTimer) clearInterval(musicTimer);

  const scheduleNotes = () => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Lookahead: Schedule notes for the next 0.5 seconds
    while (nextNoteTime < now + 0.5) {
      // -- COMPOSITION LOGIC --

      if (mood === "peaceful" || mood === ("fantasy" as any)) {
        // Slow Arpeggios
        const scale = SCALES.DORIAN;
        const speed = 0.5; // Seconds per note

        // Randomly pick notes from scale, favoring chord tones
        const noteIdx = Math.floor(Math.random() * scale.length);
        playLuteNote(scale[noteIdx], nextNoteTime, 2.0);

        // Occasional Bass
        if (beatCount % 4 === 0) playBassNote(scale[0], nextNoteTime);

        nextNoteTime += speed;
      } else if (mood === "combat" || mood === "cyberpunk") {
        // Fast, aggressive
        const scale = SCALES.COMBAT;
        const speed = 0.25;

        if (beatCount % 2 === 0) {
          playBassNote(scale[Math.floor(Math.random() * 3)], nextNoteTime);
        }
        if (Math.random() > 0.3) {
          playLuteNote(
            scale[Math.floor(Math.random() * scale.length)],
            nextNoteTime,
            0.3,
          );
        }

        nextNoteTime += speed;
      } else if (mood === "suspense" || mood === "creepy") {
        // Sparse, dissonant
        const scale = SCALES.MINOR;
        // Random timing
        const speed = 0.5 + Math.random();

        playLuteNote(
          scale[Math.floor(Math.random() * scale.length)],
          nextNoteTime,
          3.0,
        );
        // Add a detuned interval
        playLuteNote(
          scale[Math.floor(Math.random() * scale.length)] + 5,
          nextNoteTime,
          3.0,
        );

        nextNoteTime += speed;
      } else if (mood === "magical") {
        // Dreamy
        const scale = SCALES.MAGICAL;
        const speed = 0.4;

        // Ascending runs
        const idx = beatCount % scale.length;
        playLuteNote(scale[idx], nextNoteTime, 1.5);
        if (beatCount % 3 === 0)
          playLuteNote(scale[(idx + 2) % scale.length], nextNoteTime, 1.5);

        nextNoteTime += speed;
      } else {
        // Default / Peaceful fallback
        const scale = SCALES.DORIAN;
        playLuteNote(
          scale[Math.floor(Math.random() * scale.length)],
          nextNoteTime,
          1.5,
        );
        nextNoteTime += 0.8;
      }

      beatCount++;
    }
  };

  // Run the scheduler frequently
  musicTimer = window.setInterval(scheduleNotes, 200);
};

// --- Ambience Engine (Background Drone/Noise) ---

const createNoiseBuffer = () => {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const stopAmbience = () => {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  if (ambienceNodes.length > 0) {
    ambienceNodes.forEach((node) => {
      try {
        // Check if it's a source node that can be stopped
        if ("stop" in node) (node as any).stop();
        node.disconnect();
      } catch (e) {}
    });
    ambienceNodes = [];
  }
  currentMood = null;
};

export const setAmbience = (mood: SceneMood) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  if (currentMood === mood) return; // Don't restart if same mood

  // Fade out old
  stopAmbience();
  currentMood = mood;

  // 1. Start the Background Drone/Noise (Atmosphere)
  const now = audioCtx.currentTime;
  const masterGain = audioCtx.createGain();

  if (backgroundGain) {
    masterGain.connect(backgroundGain);
  } else {
    masterGain.connect(audioCtx.destination);
  }

  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.1, now + 2); // Fade in
  ambienceNodes.push(masterGain);

  const noiseBuffer = createNoiseBuffer();

  switch (mood) {
    case "peaceful":
    case "magical":
      // Wind/Ethereal
      if (noiseBuffer) {
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;
        noise.connect(filter).connect(masterGain);
        noise.start();
        ambienceNodes.push(noise, filter);
      }
      break;

    case "suspense":
    case "creepy":
      // Low rumble
      const osc2 = audioCtx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.value = 50;
      const filter2 = audioCtx.createBiquadFilter();
      filter2.type = "lowpass";
      filter2.frequency.value = 150;
      osc2.connect(filter2).connect(masterGain);
      osc2.start();
      ambienceNodes.push(osc2, filter2);
      break;

    case "combat":
    case "cyberpunk":
      // Noisy drone
      const osc3 = audioCtx.createOscillator();
      osc3.type = "square";
      osc3.frequency.value = 80;
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 8; // Fast vibrato
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 10;
      lfo.connect(lfoGain).connect(osc3.frequency);

      const filter3 = audioCtx.createBiquadFilter();
      filter3.type = "lowpass";
      filter3.frequency.value = 300;

      osc3.connect(filter3).connect(masterGain);
      osc3.start();
      lfo.start();
      ambienceNodes.push(osc3, lfo, lfoGain, filter3);
      break;
  }

  // 2. Start the Musical Composition
  startMusicSequencer(mood);
};

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
