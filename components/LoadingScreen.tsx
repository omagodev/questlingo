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

const MAX_WORD_TIME = 15; // seconds per word for timer bar

const scrambleWord = (word: string): string => {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join("");
  return scrambled === word ? scrambleWord(word) : scrambled;
};

// Scoring: faster = more points, wrong attempts penalize
const calcPoints = (secondsElapsed: number, wrongAttempts: number): number => {
  const base = 100;
  const timePenalty = Math.floor(secondsElapsed * 6); // ~6 pts per second
  const wrongPenalty = wrongAttempts * 10; // -10 pts per wrong attempt
  return Math.max(5, base - timePenalty - wrongPenalty); // Minimum 5 pts
};

const getRank = (
  totalPoints: number,
  wordsCorrect: number,
): { emoji: string; title: string } => {
  if (wordsCorrect === 0) return { emoji: "😴", title: "Dorminhoco" };
  const avg = totalPoints / wordsCorrect;
  if (avg >= 80) return { emoji: "⚡", title: "Relâmpago!" };
  if (avg >= 60) return { emoji: "🔥", title: "Rápido!" };
  if (avg >= 40) return { emoji: "👍", title: "Bom trabalho!" };
  return { emoji: "🐢", title: "Continue praticando!" };
};

interface LoadingScreenProps {
  isStillLoading: boolean;
  onDismiss: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isStillLoading,
  onDismiss,
}) => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  const [wordsSkipped, setWordsSkipped] = useState(0);
  const [totalWrongAttempts, setTotalWrongAttempts] = useState(0);
  const [wrongOnCurrent, setWrongOnCurrent] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0); // total seconds across correct answers
  const [currentWord, setCurrentWord] = useState(
    () => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)],
  );
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
  );
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; char: string }[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [wordTimer, setWordTimer] = useState(0); // seconds elapsed on current word

  const inputRef = useRef<HTMLInputElement>(null);
  const particleIdRef = useRef(0);
  const wordStartRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);

  const nextWord = useCallback(() => {
    const word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    setCurrentWord(word);
    setScrambled(scrambleWord(word.en));
    setGuess("");
    setFeedback(null);
    setLastPoints(null);
    setWrongOnCurrent(0);
    wordStartRef.current = Date.now();
    setWordTimer(0);
  }, []);

  useEffect(() => {
    setScrambled(scrambleWord(currentWord.en));
    wordStartRef.current = Date.now();
  }, [currentWord]);

  // Word timer - ticks every 100ms for smooth bar animation
  useEffect(() => {
    if (showResults) return;
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - wordStartRef.current) / 1000;
      setWordTimer(elapsed);
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showResults]);

  // When loading finishes, show results
  useEffect(() => {
    if (!isStillLoading && !showResults) {
      setShowResults(true);
    }
  }, [isStillLoading, showResults]);

  // Rotate loading messages
  useEffect(() => {
    if (showResults) return;
    const interval = setInterval(() => {
      setLoadingMsg(
        LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [showResults]);

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
      const elapsed = (Date.now() - wordStartRef.current) / 1000;
      const pts = calcPoints(elapsed, wrongOnCurrent);
      setFeedback("correct");
      setLastPoints(pts);
      setTotalPoints((s) => s + pts);
      setWordsCorrect((s) => s + 1);
      setTotalTimeSpent((s) => s + elapsed);
      setTimeout(nextWord, 900);
    } else {
      setFeedback("wrong");
      setWrongOnCurrent((s) => s + 1);
      setTotalWrongAttempts((s) => s + 1);
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const handleSkip = () => {
    setWordsSkipped((s) => s + 1);
    nextWord();
  };

  const timerPercent = Math.max(
    0,
    Math.min(100, (1 - wordTimer / MAX_WORD_TIME) * 100),
  );
  const timerColor =
    timerPercent > 60
      ? "bg-quest-success"
      : timerPercent > 30
        ? "bg-quest-warning"
        : "bg-quest-danger";

  // --- RESULTS SCREEN ---
  if (showResults) {
    const rank = getRank(totalPoints, wordsCorrect);
    return (
      <div className="fixed inset-0 z-50 bg-quest-dark/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
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

        <div className="bg-quest-card border border-gray-700 rounded-2xl p-6 md:p-8 max-w-sm w-full mx-4 shadow-2xl animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-5xl mb-2 block">{rank.emoji}</span>
            <h3 className="text-quest-accent font-retro text-sm uppercase tracking-wider mb-1">
              {rank.title}
            </h3>
            <p className="text-gray-400 text-xs">Resultado do Word Scramble</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700">
              <span className="text-gray-300 text-sm">🏆 Pontuação Total</span>
              <span className="text-quest-primary font-retro text-sm">
                {totalPoints}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700">
              <span className="text-gray-300 text-sm">
                ✅ Palavras Corretas
              </span>
              <span className="text-quest-success font-retro text-sm">
                {wordsCorrect}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700">
              <span className="text-gray-300 text-sm">
                ❌ Tentativas Erradas
              </span>
              <span className="text-quest-danger font-retro text-sm">
                {totalWrongAttempts}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700">
              <span className="text-gray-300 text-sm">⏱️ Tempo Médio</span>
              <span className="text-quest-accent font-retro text-sm">
                {wordsCorrect > 0
                  ? (totalTimeSpent / wordsCorrect).toFixed(1)
                  : "0.0"}
                s
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700">
              <span className="text-gray-300 text-sm">⏭️ Puladas</span>
              <span className="text-gray-400 font-retro text-sm">
                {wordsSkipped}
              </span>
            </div>
            {wordsCorrect > 0 && (
              <div className="flex justify-between items-center bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700">
                <span className="text-gray-300 text-sm">
                  ⚡ Média por Palavra
                </span>
                <span className="text-quest-accent font-retro text-sm">
                  {Math.round(totalPoints / wordsCorrect)} pts
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="w-full bg-quest-primary text-quest-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all text-sm font-retro tracking-wider"
          >
            ▶ Continuar Aventura
          </button>
        </div>
      </div>
    );
  }

  // --- GAME SCREEN ---
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
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-quest-accent font-retro text-[10px] uppercase tracking-wider">
            🎮 Word Scramble
          </h3>
          <span className="text-quest-success font-retro text-[10px]">
            🏆 {totalPoints} pts
          </span>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full ${timerColor} transition-all duration-100 rounded-full`}
            style={{ width: `${timerPercent}%` }}
          />
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
        {feedback === "correct" && lastPoints !== null && (
          <p className="text-center text-quest-success font-retro text-[10px] mt-3 animate-fade-in">
            ✅ +{lastPoints} pts!
          </p>
        )}

        {/* Stats bar */}
        <div className="flex justify-between mt-3 pt-3 border-t border-gray-700">
          <span className="text-gray-500 text-[10px]">✅ {wordsCorrect}</span>
          <span className="text-gray-500 text-[10px]">❌ {wrongOnCurrent}</span>
          <span className="text-gray-500 text-[10px]">⏭️ {wordsSkipped}</span>
          <span className="text-gray-500 text-[10px]">
            ⚡ {wordsCorrect > 0 ? Math.round(totalPoints / wordsCorrect) : 0}{" "}
            média
          </span>
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-gray-500 text-[10px] mt-6 font-retro tracking-wider">
        Mais rápido = mais pontos! ⚡
      </p>
    </div>
  );
};

export default LoadingScreen;
