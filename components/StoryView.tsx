import React, { useState, useEffect } from "react";
import { StorySegment, AudioSettings, WordTranslation } from "../types";
import Button from "./Button";
import {
  playSfx,
  speakText,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  setAmbience,
} from "../services/audioService";
import { translateWord } from "../services/aiService";
import WordTranslationModal from "./WordTranslationModal";

interface StoryViewProps {
  segment: StorySegment;
  onChoiceSelected: (choice: string) => void;
  onChallengeRequest: () => void;
  isChallengeSolved: boolean;
  isGenerating: boolean;
  onImageGenerated: (url: string) => void;
  onAudioGenerated?: (url: string) => void;
  settings: AudioSettings;
  userAvatarUrl: string | null;
}

const StoryView: React.FC<StoryViewProps> = ({
  segment,
  onChoiceSelected,
  onChallengeRequest,
  isChallengeSolved,
  isGenerating,
  settings,
}) => {
  const [showTranslation, setShowTranslation] = useState(false);

  // Word Translation State
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [translationData, setTranslationData] =
    useState<WordTranslation | null>(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [isTranslationMode, setIsTranslationMode] = useState(false); // New state for mobile toggle
  const [narrationStatus, setNarrationStatus] = useState<
    "idle" | "playing" | "paused"
  >("idle");
  const [narrationRate, setNarrationRate] = useState<number | undefined>(
    undefined,
  );

  // Fallback image if generation failed or is missing
  const imageSrc =
    segment.imageUrl ||
    `https://picsum.photos/seed/${segment.imageKeyword}/800/400?grayscale&blur=2`;

  useEffect(() => {
    return () => {
      stopSpeech();
      setNarrationStatus("idle");
      setNarrationRate(undefined);
    };
  }, [segment]);

  // Trigger Ambience based on mood
  useEffect(() => {
    if (segment.mood) {
      setAmbience(segment.mood);
    }
  }, [segment.mood]);

  // Sync state with actual speech status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // If the browser says it's not speaking AND we are in 'playing' state, sync to 'idle'
      // Note: speechSynthesis.speaking is true even if paused
      if (!window.speechSynthesis.speaking && narrationStatus !== "idle") {
        setNarrationStatus("idle");
        setNarrationRate(undefined);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [narrationStatus]);

  // Refs for tracking HTML audio so we can pause/resume it
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Auto-Narration
  useEffect(() => {
    // Stop any previous speech before starting new logic
    stopSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (segment.audioUrl) {
      // Play AI Voice synchronously
      const audio = new Audio(segment.audioUrl);
      audioRef.current = audio;
      setNarrationStatus("playing");
      audio.onended = () => {
        setNarrationStatus("idle");
        audioRef.current = null;
      };
      audio.play().catch((e) => console.error("Error playing saved audio", e));
    } else if (!settings.useAIVoice) {
      // Play Web Speech API fallback
      setNarrationStatus("playing");
      setNarrationRate(undefined);
      speakText(segment.content, settings, undefined, () => {
        setNarrationStatus("idle");
        setNarrationRate(undefined);
      });
    }

    return () => {
      stopSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [segment, settings]);
  // Added segment.content to deps to ensure text updates for speech

  const toggleTranslation = () => {
    playSfx("CLICK");
    setShowTranslation(!showTranslation);
  };

  const handleSpeak = (rate?: number) => {
    // 1. AI Voice Handling
    if (settings.useAIVoice) {
      if (narrationStatus === "playing" && audioRef.current) {
        audioRef.current.pause();
        setNarrationStatus("paused");
        return;
      }
      if (narrationStatus === "paused" && audioRef.current) {
        audioRef.current.play();
        setNarrationStatus("playing");
        return;
      }

      if (narrationStatus === "idle") {
        if (segment.audioUrl) {
          audioRef.current = new Audio(segment.audioUrl);
          setNarrationStatus("playing");
          audioRef.current.onended = () => {
            setNarrationStatus("idle");
            audioRef.current = null;
          };
          audioRef.current.play().catch((e) => console.error(e));
        } else {
          // Fallback to web speech if no AI audio was generated previously
          setNarrationStatus("playing");
          setNarrationRate(rate);
          speakText(segment.content, settings, rate, () => {
            setNarrationStatus("idle");
            setNarrationRate(undefined);
          });
        }
      }
      return;
    }

    // 2. Web Speech API Handling
    // If we're playing or paused at the SAME rate, toggle pause/resume
    if (narrationStatus !== "idle" && narrationRate === rate) {
      if (narrationStatus === "playing") {
        pauseSpeech();
        setNarrationStatus("paused");
      } else {
        resumeSpeech();
        setNarrationStatus("playing");
      }
      return;
    }

    // If we're idle OR playing/paused at a DIFFERENT rate, start/restart
    stopSpeech();
    setNarrationStatus("playing");
    setNarrationRate(rate);
    speakText(segment.content, settings, rate, () => {
      setNarrationStatus("idle");
      setNarrationRate(undefined);
    });
  };

  // Unified handler for word interaction
  const handleWordInteraction = async (
    e: React.MouseEvent,
    word: string,
    isContext: boolean,
  ) => {
    // If it's a context menu event, prevent default
    if (isContext) e.preventDefault();

    // If it's a left click (not context) and we are NOT in translation mode, do nothing
    if (!isContext && !isTranslationMode) return;

    // Only process actual words
    const cleanWord = word.replace(/[^a-zA-Z0-9'’-]/g, "");
    if (!cleanWord || cleanWord.length < 2) return;

    playSfx("CLICK");
    setSelectedWord(cleanWord);

    // For mobile/touch, we might want to center it or use click position
    // If it's a tap, clientX/Y works fine.
    setModalPos({ x: e.clientX, y: e.clientY });
    setLoadingTranslation(true);
    setTranslationData(null);

    try {
      const result = await translateWord(cleanWord, segment.content);
      setTranslationData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTranslation(false);
    }
  };

  const handleWordRightClick = (e: React.MouseEvent, word: string) => {
    handleWordInteraction(e, word, true);
  };

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    handleWordInteraction(e, word, false);
  };

  // Helper to split text into interactive spans
  const renderInteractiveText = (text: string) => {
    // Split by non-word characters but keep them to preserve punctuation/spacing
    // Using regex capture group to keep delimiters
    const parts = text.split(/([a-zA-Z0-9'’-]+)/g);

    return parts.map((part, index) => {
      // If it matches a word pattern, make it interactive
      if (/[a-zA-Z0-9'’-]+/.test(part)) {
        return (
          <span
            key={index}
            onContextMenu={(e) => handleWordRightClick(e, part)}
            onClick={(e) => handleWordClick(e, part)}
            className={`cursor-pointer rounded px-0.5 transition-colors duration-200 ${
              isTranslationMode
                ? "hover:bg-quest-accent/30 text-quest-accent font-semibold border-b border-dashed border-quest-accent"
                : "hover:text-quest-primary hover:bg-white/10"
            }`}
            title={
              isTranslationMode
                ? "Toque para traduzir"
                : "Clique direito para traduzir"
            }
          >
            {part}
          </span>
        );
      }
      // Return punctuation/spaces as is
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pb-24">
      {/* Image Header */}
      <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-2xl relative border-2 border-gray-700 group bg-black">
        <img
          src={imageSrc}
          alt={segment.imageKeyword}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
          style={{ imageRendering: "pixelated" }}
        />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-quest-dark to-transparent h-20 flex items-end p-4">
          <div className="flex items-center space-x-2 bg-black/50 px-2 py-1 rounded text-gray-300 backdrop-blur-sm border border-gray-600 max-w-full">
            <span className="text-xs uppercase font-bold whitespace-nowrap">
              {segment.mood}
            </span>
            <span className="text-[10px] opacity-70">|</span>
            <span
              className="text-xs truncate max-w-[200px] md:max-w-md"
              title={segment.imageKeyword}
            >
              {segment.imageKeyword}
            </span>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="bg-quest-card p-6 rounded-xl border border-gray-700 shadow-xl relative">
        <div className="text-xl md:text-2xl font-serif text-gray-100 leading-relaxed mb-4">
          {renderInteractiveText(segment.content)}
        </div>

        {/* Audio & Tool Bar */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-3">
          <button
            onClick={() => handleSpeak()}
            className="flex items-center space-x-2 bg-blue-900/30 text-blue-300 px-3 py-2 rounded hover:bg-blue-900/50 transition-colors border border-blue-800"
            title="Ouvir (Normal)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              {narrationStatus === "playing" && narrationRate === undefined ? (
                <path
                  fillRule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              ) : (
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.805l-.74 2.402a2.72 2.72 0 00.24 2.594c.331.469.863.748 1.438.748h1.66l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06z" />
              )}
            </svg>
            <span className="text-xs font-bold uppercase">
              {narrationStatus === "playing" && narrationRate === undefined
                ? "Pausar"
                : narrationStatus === "paused" && narrationRate === undefined
                  ? "Resumir"
                  : "Narrar"}
            </span>
          </button>

          <button
            onClick={() => handleSpeak(0.7)}
            className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors border ${
              narrationRate === 0.7
                ? "bg-green-700/40 text-green-200 border-green-600"
                : "bg-green-900/30 text-green-300 border-green-800 hover:bg-green-900/50"
            }`}
            title="Ouvir Lento (Fixo)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              fill="currentColor"
              className="w-5 h-5"
            >
              {narrationStatus === "playing" && narrationRate === 0.7 ? (
                <path
                  fillRule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              ) : (
                <path d="M464 256h-23.7C455.4 230.1 464 200.2 464 168c0-56-39.2-102.5-90.4-113.6C376.6 22 355 0 328 0H184c-27 0-48.6 22-45.6 54.4C87.2 65.5 48 112 48 168c0 32.2 8.6 62.1 23.7 88H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h21.1c-15.1 25.9-23.7 55.8-23.7 88 0 25.6 8 49.6 21.8 70H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h138.5c10.8 0 21.1-4.6 28.3-12.7L256 448h64l41.2 46.3c7.2 8.1 17.5 12.7 28.3 12.7H528c26.5 0 48-21.5 48-48s-21.5-48-48-48zM144 168c0-30.9 25.1-56 56-56h112c30.9 0 56 25.1 56 56s-25.1 56-56 56H200c-30.9 0-56-25.1-56-56zm56 272c-30.9 0-56-25.1-56-56s25.1-56 56-56h112c30.9 0 56 25.1 56 56s-25.1 56-56 56H200z" />
              )}
            </svg>
            <span className="text-xs font-bold uppercase hidden sm:inline">
              {narrationStatus === "playing" && narrationRate === 0.7
                ? "Pausar"
                : narrationStatus === "paused" && narrationRate === 0.7
                  ? "Resumir"
                  : "Lento"}
            </span>
            <span className="text-xs font-bold uppercase sm:hidden">🐢</span>
          </button>

          {/* Translation Toggle for Mobile */}
          <button
            onClick={() => {
              playSfx("CLICK");
              setIsTranslationMode(!isTranslationMode);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors border ${
              isTranslationMode
                ? "bg-quest-accent text-quest-dark border-quest-accent font-bold"
                : "bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600"
            }`}
            title="Ativar modo de tradução por toque"
          >
            <span className="text-lg">🔍</span>
            <span className="text-xs font-bold uppercase hidden sm:inline">
              {isTranslationMode ? "Traduzindo..." : "Traduzir"}
            </span>
          </button>
        </div>

        <button
          onClick={toggleTranslation}
          className="text-xs text-quest-primary hover:text-white underline underline-offset-4 mb-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          {showTranslation
            ? "Ocultar Tradução Completa"
            : "Ver Tradução Completa (Português)"}
        </button>

        {showTranslation && (
          <p className="text-gray-400 italic text-sm mt-2 p-3 bg-black/20 rounded border-l-2 border-quest-primary animate-fade-in">
            {segment.translation}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {!isChallengeSolved ? (
          <div className="text-center p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
            <p className="text-yellow-200 mb-4 font-retro text-xs md:text-sm">
              ⚠ Complete o desafio para prosseguir!
            </p>
            <Button
              variant="accent"
              fullWidth
              onClick={onChallengeRequest}
              className="animate-pulse"
            >
              ⚔️ Enfrentar Desafio ({segment.challenge.type})
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-green-400 text-center font-retro text-xs mb-2">
              ✅ Desafio completo! Escolha seu caminho:
            </p>
            {segment.choices.map((choice, idx) => (
              <Button
                key={idx}
                variant="primary"
                fullWidth
                disabled={isGenerating}
                onClick={() => onChoiceSelected(choice.intent)}
              >
                {isGenerating ? "Escrevendo destino..." : `👉 ${choice.text}`}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu Translation Modal */}
      {selectedWord && (
        <WordTranslationModal
          word={selectedWord}
          data={translationData}
          isLoading={loadingTranslation}
          position={modalPos}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
};

export default StoryView;
