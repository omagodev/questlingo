import React, { useState, useEffect } from "react";
import {
  GameState,
  Theme,
  Difficulty,
  PlayerState,
  GameMode,
  AudioSettings,
  UserProfile,
} from "./types";
import * as AI from "./services/aiService";
import { playSfx, initAudio, stopAmbience } from "./services/audioService";
import { saveGame } from "./services/storageService";
import Welcome from "./components/Welcome";
import StatsBar from "./components/StatsBar";
import StoryView from "./components/StoryView";
import ChallengeModal from "./components/ChallengeModal";
import Button from "./components/Button";
import ChatTutor from "./components/ChatTutor";
import Journal from "./components/Journal";
import SettingsModal from "./components/SettingsModal";
import LoadingScreen from "./components/LoadingScreen";

const INITIAL_PLAYER: PlayerState = {
  name: "",
  avatarUrl: null,
  xp: 0,
  level: 1,
  streak: 1,
  health: 3,
  maxHealth: 3,
  inventory: [],
};

const DEFAULT_SETTINGS: AudioSettings = {
  voiceURI: null,
  speechRate: 1.0,
  pitch: 1.0,
  useAIVoice: false,
  aiVoice: "onyx",
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isLoading: false,
    mode: GameMode.STORY,
    history: [],
    currentSegment: null,
    player: INITIAL_PLAYER,
    theme: Theme.FANTASY,
    difficulty: Difficulty.BEGINNER,
    isChallengeActive: false,
    challengeSolved: false,
    gameOver: false,
    settings: DEFAULT_SETTINGS,
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState<number | null>(
    null,
  );

  // Chapter navigation helpers
  const totalChapters =
    gameState.history.length + (gameState.currentSegment ? 1 : 0);
  const isViewingHistory = viewingHistoryIndex !== null;
  const viewedSegment = isViewingHistory
    ? gameState.history[viewingHistoryIndex]
    : gameState.currentSegment;

  const goToChapter = (index: number) => {
    if (index >= 0 && index < gameState.history.length) {
      setViewingHistoryIndex(index);
    } else {
      setViewingHistoryIndex(null); // Go to current
    }
  };

  const returnToCurrent = () => setViewingHistoryIndex(null);

  // Show loading screen when isLoading starts
  useEffect(() => {
    if (gameState.isLoading && gameState.isPlaying) {
      setShowLoadingScreen(true);
    }
  }, [gameState.isLoading, gameState.isPlaying]);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("lingoQuest_settings");
      if (savedSettings)
        setGameState((prev) => ({
          ...prev,
          settings: JSON.parse(savedSettings),
        }));
      const savedProfile = localStorage.getItem("lingoQuest_profile");
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (
      gameState.isPlaying &&
      !gameState.gameOver &&
      !gameState.isLoading &&
      gameState.currentSegment
    ) {
      try {
        localStorage.setItem("lingoQuestSave", JSON.stringify(gameState));
      } catch (e) {}
    }
  }, [gameState]);

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem("lingoQuest_profile", JSON.stringify(newProfile));
  };

  const handleLoadGame = (state: GameState) => {
    setGameState((prev) => ({
      ...state,
      isLoading: false,
      settings: prev.settings,
    }));
    playSfx("LEVEL_UP");
    if (state.id) {
      window.history.replaceState({}, "", `/?save=${state.id}`);
    }
  };

  const handleSaveGame = async () => {
    playSfx("CLICK");
    const newId = await saveGame(gameState);
    if (newId) {
      playSfx("SUCCESS");
      alert("Jogo salvo com sucesso!");
      setGameState((s) => ({ ...s, id: newId }));
      window.history.replaceState({}, "", `/?save=${newId}`);
    } else {
      alert("Erro ao salvar jogo.");
    }
  };

  const handleUpdateSettings = (newSettings: AudioSettings) => {
    setGameState((prev) => ({ ...prev, settings: newSettings }));
    localStorage.setItem("lingoQuest_settings", JSON.stringify(newSettings));
    playSfx("CLICK");
  };

  const handleReturnToMenu = () => {
    playSfx("CLICK");
    stopAmbience();
    setIsVictory(false);
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      currentSegment: null,
      history: [],
      player: INITIAL_PLAYER,
      gameOver: false,
      id: undefined,
    }));
    window.history.replaceState({}, "", `/`);
  };

  const startGame = async (
    theme: Theme,
    difficulty: Difficulty,
    mode: GameMode,
  ) => {
    initAudio();
    playSfx("CLICK");
    setIsVictory(false);
    const startingPlayer = {
      ...INITIAL_PLAYER,
      name: userProfile?.name || "Adventurer",
      avatarUrl: userProfile?.avatarUrl || null,
    };

    const targetState: GameState = {
      ...gameState,
      isLoading: true,
      theme,
      difficulty,
      mode,
      player: startingPlayer,
      id: undefined, // Clear ID for new game
    };
    setGameState(targetState);

    try {
      let startSegment =
        mode === GameMode.SURVIVAL
          ? await AI.generateSurvivalSegment(theme, difficulty, 1)
          : await AI.generateStoryStart(theme, difficulty);

      // --- GENERATE ASSETS SYNCHRONOUSLY ---
      const b64Image = await AI.generateSceneImage(
        startSegment.imageKeyword,
        startingPlayer.avatarUrl,
      );
      if (b64Image) startSegment.imageUrl = b64Image;

      if (targetState.settings.useAIVoice) {
        const b64Audio = await AI.generateSpeech(
          startSegment.content,
          targetState.settings.aiVoice as any,
        );
        if (b64Audio) startSegment.audioUrl = b64Audio;
      }

      const finalState: GameState = {
        ...targetState,
        isPlaying: true,
        isLoading: false,
        currentSegment: startSegment,
        challengeSolved: false,
        gameOver: false,
        history: [],
      };

      setGameState(finalState);

      // Save explicitly and update URL
      const newId = await saveGame(finalState);
      if (newId) {
        setGameState((s) => ({ ...s, id: newId }));
        window.history.replaceState({}, "", `/?save=${newId}`);
      }
    } catch (error) {
      alert("Erro ao iniciar aventura.");
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleChoice = async (choiceIntent: string) => {
    if (!gameState.currentSegment) return;
    playSfx("CLICK");

    // Check if we already reached 10 scenes in Story Mode
    if (gameState.mode === GameMode.STORY && gameState.history.length >= 9) {
      setIsVictory(true);
      playSfx("LEVEL_UP");
      return;
    }

    const targetState: GameState = { ...gameState, isLoading: true };
    setGameState(targetState);

    try {
      const currentSceneCount = targetState.history.length + 2; // Next scene number
      const nextSegment =
        targetState.mode === GameMode.SURVIVAL
          ? await AI.generateSurvivalSegment(
              targetState.theme,
              targetState.difficulty,
              targetState.player.streak + 1,
            )
          : await AI.generateNextSegment(
              targetState.currentSegment!.content,
              choiceIntent,
              targetState.difficulty,
              currentSceneCount,
            );

      // --- GENERATE ASSETS SYNCHRONOUSLY ---
      const b64Image = await AI.generateSceneImage(
        nextSegment.imageKeyword,
        targetState.player.avatarUrl,
      );
      if (b64Image) nextSegment.imageUrl = b64Image;

      if (targetState.settings.useAIVoice) {
        const b64Audio = await AI.generateSpeech(
          nextSegment.content,
          targetState.settings.aiVoice as any,
        );
        if (b64Audio) nextSegment.audioUrl = b64Audio;
      }

      const finalState: GameState = {
        ...targetState,
        isLoading: false,
        history: [...targetState.history, targetState.currentSegment!],
        currentSegment: nextSegment,
        challengeSolved: false,
      };

      setGameState(finalState);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Save explicitly and update URL
      const newId = await saveGame(finalState);
      if (newId) {
        setGameState((s) => ({ ...s, id: newId }));
        window.history.replaceState({}, "", `/?save=${newId}`);
      }
    } catch (error) {
      alert("Erro ao gerar próximo capítulo.");
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleChallengeResult = (success: boolean) => {
    if (success) {
      const itemReward = gameState.currentSegment?.itemReward;
      let newInventory = [...gameState.player.inventory];
      if (itemReward && !newInventory.includes(itemReward))
        newInventory.push(itemReward);
      const newXp =
        gameState.player.xp + (gameState.currentSegment?.xpReward || 20);
      const levelUp = newXp >= gameState.player.level * 100;
      if (levelUp) playSfx("LEVEL_UP");
      else playSfx("SUCCESS");

      setGameState((prev) => ({
        ...prev,
        isChallengeActive: false,
        challengeSolved: true,
        player: {
          ...prev.player,
          inventory: newInventory,
          xp: levelUp ? newXp - prev.player.level * 100 : newXp,
          level: levelUp ? prev.player.level + 1 : prev.player.level,
          streak: prev.player.streak + 1,
          health: Math.min(
            prev.player.maxHealth,
            prev.player.health + (levelUp ? 1 : 0),
          ),
        },
      }));

      // In Story Mode, if it's scene 10, the "choices" will be empty from Gemini.
      // We check for victory when they click "Finish" or if choices array is empty.
      if (gameState.mode === GameMode.STORY && gameState.history.length === 9) {
        // Victory logic will trigger when they finish the 10th scene
      }
    } else {
      playSfx("ERROR");
      const newHealth = gameState.player.health - 1;
      if (newHealth <= 0) {
        playSfx("GAME_OVER");
        stopAmbience();
      }
      setGameState((prev) => ({
        ...prev,
        isChallengeActive: false,
        player: { ...prev.player, streak: 0, health: newHealth },
        gameOver: newHealth <= 0,
      }));
    }
  };

  const restartGame = () => {
    playSfx("CLICK");
    stopAmbience();
    localStorage.removeItem("lingoQuestSave");
    handleReturnToMenu();
  };

  if (!gameState.isPlaying) {
    return (
      <Welcome
        onStart={startGame}
        onLoadGame={handleLoadGame}
        isLoading={gameState.isLoading}
        onUpdateProfile={handleUpdateProfile}
        userProfile={userProfile}
      />
    );
  }

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-900/20 text-center p-6">
        <div className="max-w-md w-full bg-quest-card p-8 rounded-2xl border-2 border-red-600 shadow-2xl">
          <h1 className="text-4xl text-red-500 font-retro mb-4">GAME OVER</h1>
          <Button onClick={restartGame} variant="primary" fullWidth>
            Voltar ao Menu
          </Button>
        </div>
      </div>
    );
  }

  if (isVictory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-quest-primary/10 text-center p-6">
        <div className="max-w-md w-full bg-quest-card p-8 rounded-2xl border-2 border-quest-success shadow-2xl animate-fade-in">
          <h1 className="text-4xl text-quest-success font-retro mb-4">
            VICTORY!
          </h1>
          <p className="text-gray-300 mb-8">
            Parabéns, {gameState.player.name}! <br />
            Você completou sua jornada de 10 capítulos.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg mb-6 text-sm text-left border border-gray-700">
            <p className="text-quest-primary mb-1 font-bold">
              Resumo da Aventura:
            </p>
            <p>Nível: {gameState.player.level}</p>
            <p>Palavras Aprendidas: ~{gameState.history.length * 5}</p>
            <p>Desafios Vencidos: {gameState.player.streak}</p>
          </div>
          <Button onClick={restartGame} variant="primary" fullWidth>
            Nova Aventura
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quest-dark pb-10">
      <StatsBar
        player={gameState.player}
        onOpenJournal={() => setIsJournalOpen(true)}
        onSaveGame={handleSaveGame}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExit={handleReturnToMenu}
      />

      <div className="max-w-3xl mx-auto px-4 pt-4 flex justify-between items-center opacity-60">
        <span className="text-[10px] font-retro text-gray-400 uppercase tracking-widest">
          Capítulo{" "}
          {isViewingHistory
            ? viewingHistoryIndex! + 1
            : gameState.history.length + 1}{" "}
          / 10
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalChapters }, (_, i) => (
            <button
              key={i}
              onClick={() => goToChapter(i)}
              className={`w-3 h-3 rounded-sm transition-all duration-300 ${
                (
                  isViewingHistory
                    ? viewingHistoryIndex === i
                    : i === totalChapters - 1
                )
                  ? "bg-quest-primary scale-125"
                  : i < gameState.history.length
                    ? "bg-quest-primary/40 hover:bg-quest-primary/70"
                    : "bg-gray-700"
              }`}
              title={`Capítulo ${i + 1}`}
            />
          ))}
          {Array.from({ length: Math.max(0, 10 - totalChapters) }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="w-3 h-3 rounded-sm bg-gray-800"
            />
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 md:p-6 mt-4 relative">
        {viewedSegment && (
          <StoryView
            segment={viewedSegment}
            onChoiceSelected={handleChoice}
            onChallengeRequest={() =>
              setGameState((prev) => ({ ...prev, isChallengeActive: true }))
            }
            isChallengeSolved={gameState.challengeSolved}
            isGenerating={gameState.isLoading}
            settings={gameState.settings}
            userAvatarUrl={gameState.player.avatarUrl}
            isReadOnly={isViewingHistory}
            chapterNav={
              gameState.history.length > 0
                ? {
                    current: isViewingHistory
                      ? viewingHistoryIndex! + 1
                      : totalChapters,
                    total: totalChapters,
                    onPrev: () =>
                      goToChapter(
                        isViewingHistory
                          ? viewingHistoryIndex! - 1
                          : gameState.history.length - 1,
                      ),
                    onNext: () =>
                      goToChapter(
                        isViewingHistory ? viewingHistoryIndex! + 1 : 0,
                      ),
                    onReturn: returnToCurrent,
                  }
                : undefined
            }
            deferNarration={showLoadingScreen}
          />
        )}

        {/* If scene 10 and challenge solved, show special finish button if Gemini returned empty choices */}
        {!isViewingHistory &&
          gameState.mode === GameMode.STORY &&
          gameState.history.length === 9 &&
          gameState.challengeSolved &&
          !gameState.isLoading && (
            <div className="mt-8 animate-fade-in">
              <Button
                variant="accent"
                fullWidth
                onClick={() => setIsVictory(true)}
              >
                🏆 Finalizar Jornada
              </Button>
            </div>
          )}
      </main>

      {/* Loading Screen with mini-game */}
      {showLoadingScreen && gameState.isPlaying && (
        <LoadingScreen
          isStillLoading={gameState.isLoading}
          onDismiss={() => setShowLoadingScreen(false)}
        />
      )}

      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-quest-primary text-quest-dark p-3 md:p-4 rounded-full shadow-lg border-2 border-blue-400 hover:scale-110 transition-transform flex items-center justify-center opacity-80 hover:opacity-100"
      >
        <span className="font-retro text-lg md:text-xl font-bold">?</span>
      </button>

      {gameState.isChallengeActive && gameState.currentSegment && (
        <ChallengeModal
          challenge={gameState.currentSegment.challenge}
          onSolve={handleChallengeResult}
          onClose={() =>
            setGameState((prev) => ({ ...prev, isChallengeActive: false }))
          }
        />
      )}
      {isChatOpen && gameState.currentSegment && (
        <ChatTutor
          segment={gameState.currentSegment}
          onClose={() => setIsChatOpen(false)}
        />
      )}
      {isJournalOpen && (
        <Journal
          history={gameState.history}
          onClose={() => setIsJournalOpen(false)}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          currentSettings={gameState.settings}
          onSave={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
