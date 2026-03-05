import React, { useState, useEffect, useRef, useCallback } from "react";
import { Challenge, ChallengeFormat } from "../types";
import Button from "./Button";
import { playSfx } from "../services/audioService";

interface ChallengeModalProps {
  challenge: Challenge;
  onSolve: (success: boolean) => void;
  onClose: () => void;
}

// ── Helper: normalize strings for comparison ────────────────────────
const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");

// ── Bubble Pop types ────────────────────────────────────────────────
interface Bubble {
  id: number;
  word: string;
  correct: boolean;
  x: number;
  y: number;
  speed: number;
  size: number;
  popped: boolean;
  wrong: boolean;
}

// ════════════════════════════════════════════════════════════════════
const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  onSolve,
  onClose,
}) => {
  const fmt: ChallengeFormat = challenge.challengeFormat || "multiple_choice";

  // ── Multiple Choice state ──
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // ── Text input (fill_blank / translation) ──
  const [textInput, setTextInput] = useState("");

  // ── Word Order state ──
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // ── Bubble Pop state ──
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bubbleMisses, setBubbleMisses] = useState(0);
  const [bubblesPopped, setBubblesPopped] = useState(0);
  const [totalCorrectBubbles, setTotalCorrectBubbles] = useState(0);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Reset on challenge change ──
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
    setTextInput("");
    setBubbleMisses(0);
    setBubblesPopped(0);

    if (fmt === "word_order" && challenge.scrambledWords) {
      setAvailableWords([...challenge.scrambledWords]);
      setOrderedWords([]);
    }

    if (fmt === "bubble_pop") {
      initBubbles();
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [challenge]);

  // ── Bubble Pop helpers ──
  const initBubbles = useCallback(() => {
    const correct = challenge.correctBubbles || [];
    const wrong = challenge.wrongBubbles || [];
    setTotalCorrectBubbles(correct.length);

    const all = [
      ...correct.map((w) => ({ word: w, correct: true })),
      ...wrong.map((w) => ({ word: w, correct: false })),
    ];

    // Shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    const bs: Bubble[] = all.map((b, i) => ({
      id: i,
      word: b.word,
      correct: b.correct,
      x: 10 + Math.random() * 75,
      y: 100 + Math.random() * 30 + i * 8,
      speed: 0.15 + Math.random() * 0.25,
      size: 44 + Math.random() * 20,
      popped: false,
      wrong: false,
    }));

    setBubbles(bs);
    setBubblesPopped(0);
    setBubbleMisses(0);
  }, [challenge]);

  // ── Bubble animation loop ──
  useEffect(() => {
    if (fmt !== "bubble_pop" || submitted) return;
    let running = true;

    const tick = () => {
      if (!running) return;
      setBubbles((prev) =>
        prev.map((b) =>
          b.popped || b.wrong
            ? b
            : { ...b, y: b.y - b.speed, x: b.x + Math.sin(b.y / 10) * 0.15 },
        ),
      );
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [fmt, submitted]);

  // ── Bubble Pop: check win/lose ──
  useEffect(() => {
    if (fmt !== "bubble_pop" || submitted) return;

    if (bubblesPopped >= totalCorrectBubbles && totalCorrectBubbles > 0) {
      setIsCorrect(true);
      setSubmitted(true);
    }
    if (bubbleMisses >= 3) {
      setIsCorrect(false);
      setSubmitted(true);
    }
  }, [bubblesPopped, bubbleMisses, totalCorrectBubbles, fmt, submitted]);

  const popBubble = (id: number) => {
    if (submitted) return;
    const bubble = bubbles.find((b) => b.id === id);
    if (!bubble || bubble.popped || bubble.wrong) return;

    if (bubble.correct) {
      playSfx("CLICK");
      setBubbles((prev) =>
        prev.map((b) => (b.id === id ? { ...b, popped: true } : b)),
      );
      setBubblesPopped((p) => p + 1);
    } else {
      playSfx("ERROR");
      setBubbles((prev) =>
        prev.map((b) => (b.id === id ? { ...b, wrong: true } : b)),
      );
      setBubbleMisses((m) => m + 1);
    }
  };

  // ── Multiple Choice handlers ──
  const handleSelect = (idx: number) => {
    if (!submitted) {
      playSfx("CLICK");
      setSelected(idx);
    }
  };

  const handleMCSubmit = () => {
    if (selected === null) return;
    const correct = selected === challenge.correctIndex;
    setIsCorrect(correct);
    setSubmitted(true);
  };

  // ── Text-based submit (fill_blank / translation) ──
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    const answer = challenge.answer || "";
    const correct = norm(textInput) === norm(answer);
    setIsCorrect(correct);
    setSubmitted(true);
  };

  // ── Word Order handlers ──
  const addWord = (word: string, idx: number) => {
    playSfx("CLICK");
    setOrderedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeWord = (idx: number) => {
    playSfx("CLICK");
    const word = orderedWords[idx];
    setOrderedWords((prev) => prev.filter((_, i) => i !== idx));
    setAvailableWords((prev) => [...prev, word]);
  };

  const handleWordOrderSubmit = () => {
    const userSentence = orderedWords.join(" ");
    const correct = norm(userSentence) === norm(challenge.sentence || "");
    setIsCorrect(correct);
    setSubmitted(true);
  };

  // ── Result handlers ──
  const handleContinue = () => {
    playSfx("CLICK");
    onSolve(isCorrect);
  };

  const handleIncorrectContinue = () => {
    playSfx("CLICK");
    onSolve(false);
  };

  // ── Format label ──
  const formatLabel: Record<ChallengeFormat, string> = {
    multiple_choice: "Múltipla Escolha",
    fill_blank: "Preencher Lacuna",
    word_order: "Ordenar Palavras",
    translation: "Tradução",
    bubble_pop: "Estourar Bolhas",
  };

  // ════════════════════════════════════════════════════════
  // ── RENDER ──
  // ════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-quest-card w-full max-w-lg rounded-2xl shadow-2xl border-2 border-quest-accent p-6 flex flex-col relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-retro text-quest-accent text-lg">
            {formatLabel[fmt]}:{" "}
            <span className="text-gray-400 text-sm">{challenge.type}</span>
          </h3>
          <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
            +XP se acertar
          </div>
        </div>

        {/* ── MULTIPLE CHOICE ── */}
        {fmt === "multiple_choice" && (
          <>
            <p className="text-xl text-white font-medium mb-8 text-center leading-relaxed">
              {challenge.question}
            </p>
            <div className="space-y-3 mb-6">
              {challenge.options.map((opt, idx) => {
                let btnClass =
                  "w-full p-4 rounded-lg text-left transition-all border-2 ";
                if (submitted) {
                  if (idx === challenge.correctIndex)
                    btnClass +=
                      "bg-green-900/50 border-green-500 text-green-100";
                  else if (
                    idx === selected &&
                    selected !== challenge.correctIndex
                  )
                    btnClass +=
                      "bg-red-900/50 border-red-500 text-red-100 opacity-60";
                  else btnClass += "border-gray-700 bg-gray-800 opacity-50";
                } else {
                  if (selected === idx)
                    btnClass +=
                      "border-quest-primary bg-blue-900/30 text-white";
                  else
                    btnClass +=
                      "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300";
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={btnClass}
                    disabled={submitted}
                  >
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center text-xs mr-3 font-mono">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
            {!submitted && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    playSfx("CLICK");
                    onClose();
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Desistir
                </Button>
                <Button
                  onClick={handleMCSubmit}
                  variant="primary"
                  fullWidth
                  disabled={selected === null}
                >
                  Verificar Resposta
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── FILL BLANK ── */}
        {fmt === "fill_blank" && (
          <>
            <p className="text-xl text-white font-medium mb-8 text-center leading-relaxed">
              {challenge.question}
            </p>
            {!submitted ? (
              <div className="mb-6">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  placeholder="Type the missing word..."
                  className="w-full p-4 rounded-lg border-2 border-gray-700 bg-gray-800 text-white text-center text-lg focus:border-quest-primary focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
            ) : (
              <div className="mb-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Sua resposta:</p>
                <p
                  className={`text-lg font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}
                >
                  {textInput}
                </p>
                {!isCorrect && (
                  <p className="text-green-400 text-sm mt-1">
                    Resposta correta: <strong>{challenge.answer}</strong>
                  </p>
                )}
              </div>
            )}
            {!submitted && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    playSfx("CLICK");
                    onClose();
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Desistir
                </Button>
                <Button
                  onClick={handleTextSubmit}
                  variant="primary"
                  fullWidth
                  disabled={!textInput.trim()}
                >
                  Verificar
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── WORD ORDER ── */}
        {fmt === "word_order" && (
          <>
            <p className="text-xl text-white font-medium mb-4 text-center leading-relaxed">
              {challenge.question}
            </p>
            {/* User's sentence */}
            <div className="min-h-[56px] p-3 mb-4 rounded-lg border-2 border-dashed border-gray-600 bg-gray-900/50 flex flex-wrap gap-2 items-center justify-center">
              {orderedWords.length === 0 && (
                <span className="text-gray-500 text-sm italic">
                  Toque nas palavras para montar a frase...
                </span>
              )}
              {orderedWords.map((w, i) => (
                <button
                  key={i}
                  onClick={() => !submitted && removeWord(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    submitted
                      ? isCorrect
                        ? "bg-green-900/50 border border-green-500 text-green-100"
                        : "bg-red-900/50 border border-red-500 text-red-100"
                      : "bg-quest-primary/30 border border-quest-primary text-white hover:bg-quest-primary/50 cursor-pointer"
                  }`}
                  disabled={submitted}
                >
                  {w}
                </button>
              ))}
            </div>
            {/* Available words */}
            {!submitted && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {availableWords.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => addWord(w, i)}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 text-sm font-medium transition-all"
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
            {submitted && !isCorrect && (
              <p className="text-green-400 text-sm text-center mb-4">
                Frase correta: <strong>{challenge.sentence}</strong>
              </p>
            )}
            {!submitted && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    playSfx("CLICK");
                    onClose();
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Desistir
                </Button>
                <Button
                  onClick={handleWordOrderSubmit}
                  variant="primary"
                  fullWidth
                  disabled={availableWords.length > 0}
                >
                  Verificar
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── TRANSLATION ── */}
        {fmt === "translation" && (
          <>
            <p className="text-sm text-gray-400 mb-2 text-center">
              Traduza para inglês:
            </p>
            <p className="text-xl text-quest-accent font-medium mb-8 text-center leading-relaxed">
              "{challenge.question}"
            </p>
            {!submitted ? (
              <div className="mb-6">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  placeholder="Type the English translation..."
                  className="w-full p-4 rounded-lg border-2 border-gray-700 bg-gray-800 text-white text-center text-lg focus:border-quest-primary focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
            ) : (
              <div className="mb-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Sua resposta:</p>
                <p
                  className={`text-lg font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}
                >
                  {textInput}
                </p>
                {!isCorrect && (
                  <p className="text-green-400 text-sm mt-1">
                    Resposta correta: <strong>{challenge.answer}</strong>
                  </p>
                )}
              </div>
            )}
            {!submitted && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    playSfx("CLICK");
                    onClose();
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Desistir
                </Button>
                <Button
                  onClick={handleTextSubmit}
                  variant="primary"
                  fullWidth
                  disabled={!textInput.trim()}
                >
                  Verificar
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── BUBBLE POP ── */}
        {fmt === "bubble_pop" && (
          <>
            <div className="text-center mb-3">
              <p className="text-white text-lg font-medium mb-1">
                Estoure as palavras de:{" "}
                <span className="text-quest-accent font-bold">
                  {challenge.bubbleCategory}
                </span>
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-green-400">
                  ✓ {bubblesPopped}/{totalCorrectBubbles}
                </span>
                <span className="text-red-400">✗ {bubbleMisses}/3</span>
              </div>
            </div>

            {!submitted && (
              <div
                ref={containerRef}
                className="relative w-full h-64 rounded-xl bg-gradient-to-b from-blue-950/50 to-purple-950/50 border border-gray-700 overflow-hidden mb-4"
              >
                {bubbles.map((b) => {
                  if (b.popped)
                    return (
                      <div
                        key={b.id}
                        className="absolute transition-all duration-300"
                        style={{
                          left: `${b.x}%`,
                          top: `${b.y}%`,
                          transform: "scale(1.5)",
                          opacity: 0,
                        }}
                      >
                        <span className="text-green-400 text-xl">✓</span>
                      </div>
                    );
                  if (b.wrong)
                    return (
                      <div
                        key={b.id}
                        className="absolute transition-all duration-300"
                        style={{
                          left: `${b.x}%`,
                          top: `${b.y}%`,
                          transform: "scale(1.3)",
                          opacity: 0.3,
                        }}
                      >
                        <span className="text-red-400 text-xl">✗</span>
                      </div>
                    );
                  return (
                    <button
                      key={b.id}
                      onClick={() => popBubble(b.id)}
                      className="absolute rounded-full bg-gradient-to-br from-blue-400/80 to-purple-500/80 border-2 border-white/30 shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform backdrop-blur-sm"
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: b.size,
                        height: b.size,
                        animation: `float ${2 + Math.random()}s ease-in-out infinite`,
                      }}
                    >
                      {b.word}
                    </button>
                  );
                })}
              </div>
            )}

            {!submitted && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    playSfx("CLICK");
                    onClose();
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Desistir
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── SHARED RESULT FEEDBACK ── */}
        {submitted && (
          <div className="animate-fade-in">
            <div
              className={`p-4 rounded-lg mb-4 ${
                isCorrect
                  ? "bg-green-900/30 border border-green-800"
                  : "bg-red-900/30 border border-red-800"
              }`}
            >
              <p
                className={`font-bold mb-1 ${
                  isCorrect ? "text-green-400" : "text-red-400"
                }`}
              >
                {isCorrect ? "Correto!" : "Incorreto!"}
              </p>
              <p className="text-sm text-gray-300">{challenge.explanation}</p>
            </div>
            {isCorrect ? (
              <Button onClick={handleContinue} variant="primary" fullWidth>
                Continuar
              </Button>
            ) : (
              <Button
                onClick={handleIncorrectContinue}
                variant="secondary"
                fullWidth
              >
                Continuar (Perder Vida)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bubble float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default ChallengeModal;
