import React, { useState, useEffect, useCallback, useRef } from "react";

// Vocabulary for the word scramble mini-game
const WORD_BANK = [
  { en: "knight", pt: "cavaleiro" },
  { en: "sword", pt: "espada" },
  { en: "dragon", pt: "dragão" },
  { en: "castle", pt: "castelo" },
  { en: "wizard", pt: "mago" },
  { en: "shield", pt: "escudo" },
  { en: "forest", pt: "floresta" },
  { en: "river", pt: "rio" },
  { en: "magic", pt: "magia" },
  { en: "quest", pt: "missão" },
  { en: "potion", pt: "poção" },
  { en: "shadow", pt: "sombra" },
  { en: "throne", pt: "trono" },
  { en: "bridge", pt: "ponte" },
  { en: "storm", pt: "tempestade" },
  { en: "flame", pt: "chama" },
  { en: "tower", pt: "torre" },
  { en: "battle", pt: "batalha" },
  { en: "crown", pt: "coroa" },
  { en: "brave", pt: "corajoso" },
  { en: "ancient", pt: "antigo" },
  { en: "travel", pt: "viajar" },
  { en: "village", pt: "vila" },
  { en: "secret", pt: "segredo" },
  { en: "danger", pt: "perigo" },
  { en: "light", pt: "luz" },
  { en: "power", pt: "poder" },
  { en: "treasure", pt: "tesouro" },
  { en: "island", pt: "ilha" },
  { en: "garden", pt: "jardim" },
];

const LOADING_MESSAGES = [
  "✍️ O bardo está escrevendo...",
  "🗺️ Desenhando o mapa...",
  "⚔️ Forjando o destino...",
  "🔮 Consultando o oráculo...",
  "📜 Desenrolando o pergaminho...",
  "🏰 Construindo o cenário...",
  "🐉 Acordando os dragões...",
  "🌟 Alinhando as estrelas...",
  "🧙 Preparando feitiços...",
  "🎭 Os personagens entram em cena...",
];

const scrambleWord = (word: string): string => {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join("");
  // Avoid returning the same word
  return scrambled === word ? scrambleWord(word) : scrambled;
};

const LoadingScreen: React.FC = () => {
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState(
    () => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)],
  );
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
  );
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; char: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const particleIdRef = useRef(0);

  const nextWord = useCallback(() => {
    const word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    setCurrentWord(word);
    setScrambled(scrambleWord(word.en));
    setGuess("");
    setFeedback(null);
  }, []);

  useEffect(() => {
    setScrambled(scrambleWord(currentWord.en));
  }, [currentWord]);

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsg(
        LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Spawn floating particles
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = ["✦", "⚔", "🗡", "✨", "🔮", "⭐", "💎", "🏆"];
      const newParticle = {
        id: particleIdRef.current++,
        x: Math.random() * 100,
        y: 100 + Math.random() * 10,
        char: chars[Math.floor(Math.random() * chars.length)],
      };
      setParticles((prev) => [...prev.slice(-12), newParticle]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim().toLowerCase() === currentWord.en.toLowerCase()) {
      setFeedback("correct");
      setScore((s) => s + 1);
      setTimeout(nextWord, 800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const handleSkip = () => {
    nextWord();
  };

  return (
    <div className="fixed inset-0 z-50 bg-quest-dark/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
      {/* Floating particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-xl opacity-60 pointer-events-none"
          style={{
            left: `${p.x}%`,
            animation: `floatUp 4s linear forwards`,
            bottom: `${p.y - 100}%`,
          }}
        >
          {p.char}
        </span>
      ))}

      {/* Loading indicator */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-1 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-quest-primary rounded-sm"
              style={{
                animation: `loadingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="text-quest-primary font-retro text-xs tracking-widest animate-pulse">
          {loadingMsg}
        </p>
      </div>

      {/* Mini Game */}
      <div className="bg-quest-card border border-gray-700 rounded-2xl p-6 md:p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-quest-accent font-retro text-[10px] uppercase tracking-wider">
            🎮 Word Scramble
          </h3>
          <span className="text-quest-success font-retro text-[10px]">
            ⭐ {score}
          </span>
        </div>

        {/* Scrambled letters */}
        <div className="flex justify-center gap-1.5 mb-4">
          {scrambled.split("").map((char, i) => (
            <span
              key={`${scrambled}-${i}`}
              className="w-9 h-10 md:w-10 md:h-11 bg-gray-800 border-2 border-quest-primary/40 rounded-lg flex items-center justify-center text-lg md:text-xl font-bold text-quest-primary uppercase"
              style={{
                animation: `tileAppear 0.3s ease-out ${i * 0.05}s both`,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Hint */}
        <p className="text-center text-gray-400 text-xs mb-4">
          💡 <span className="italic">{currentWord.pt}</span>
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Digite a palavra..."
            autoFocus
            className={`w-full bg-gray-800 border-2 rounded-lg px-4 py-2.5 text-center text-lg font-bold text-white placeholder-gray-500 outline-none transition-colors ${
              feedback === "correct"
                ? "border-quest-success bg-green-900/30"
                : feedback === "wrong"
                  ? "border-quest-danger bg-red-900/30 animate-[shake_0.3s_ease-in-out]"
                  : "border-gray-600 focus:border-quest-accent"
            }`}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-quest-primary text-quest-dark font-bold py-2 rounded-lg hover:brightness-110 transition-all text-sm"
            >
              Verificar ✓
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 bg-gray-700 text-gray-300 font-bold py-2 rounded-lg hover:bg-gray-600 transition-all text-sm"
            >
              Pular →
            </button>
          </div>
        </form>

        {/* Feedback toast */}
        {feedback === "correct" && (
          <p className="text-center text-quest-success font-retro text-[10px] mt-3 animate-fade-in">
            ✅ Correto! +1 ⭐
          </p>
        )}
      </div>

      {/* Bottom hint */}
      <p className="text-gray-500 text-[10px] mt-6 font-retro tracking-wider">
        Jogue enquanto a história é gerada!
      </p>
    </div>
  );
};

export default LoadingScreen;
