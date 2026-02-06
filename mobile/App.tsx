import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  useFonts,
  PressStart2P_400Regular,
} from "@expo-google-fonts/press-start-2p";
import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import {
  playSfx,
  initAudio,
  stopAmbience,
  setThemeMusic,
} from "./services/audioService";
import { saveGame } from "./services/storageService";
import { COLORS } from "./theme";

import Welcome from "./components/Welcome";
import StatsBar from "./components/StatsBar";
import StoryView from "./components/StoryView";
import ChallengeModal from "./components/ChallengeModal";
import ChatTutor from "./components/ChatTutor";
import Journal from "./components/Journal";
import SettingsModal from "./components/SettingsModal";
import Button from "./components/Button";

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

export default function App() {
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
    Inter_400Regular,
    Inter_700Bold,
  });

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

  useEffect(() => {
    initAudio();
    loadPersistedData();
  }, []);

  // Prefetching logic
  useEffect(() => {
    if (
      gameState.currentSegment &&
      !gameState.isLoading &&
      gameState.isPlaying
    ) {
      // Start prefetching after a short delay to not interfere with initial load/narration
      const timer = setTimeout(() => {
        gameState.currentSegment?.choices.forEach((choice) => {
          AI.prefetchNextSegment(
            gameState.currentSegment!.content,
            choice.intent,
            gameState.difficulty,
            gameState.history.length + 2,
            gameState.settings.useAIVoice,
            gameState.settings.aiVoice,
          );
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [
    gameState.currentSegment,
    gameState.isLoading,
    gameState.isPlaying,
    gameState.history.length,
    gameState.difficulty,
  ]);

  const loadPersistedData = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("lingoQuest_settings");
      if (savedSettings) {
        setGameState((prev) => ({
          ...prev,
          settings: JSON.parse(savedSettings),
        }));
      }
      const savedProfile = await AsyncStorage.getItem("lingoQuest_profile");
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (e) {
      console.error("Failed to load persisted data", e);
    }
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    await AsyncStorage.setItem(
      "lingoQuest_profile",
      JSON.stringify(newProfile),
    );
  };

  const handleLoadGame = (state: GameState) => {
    setGameState((prev) => ({
      ...state,
      isLoading: false,
      settings: prev.settings,
    }));
    playSfx("LEVEL_UP");
  };

  const handleSaveGame = async (silent = false) => {
    if (!silent) playSfx("CLICK");
    const success = await saveGame(gameState);
    if (success) {
      if (!silent) {
        playSfx("SUCCESS");
        Alert.alert("Sucesso", "Jogo salvo no dispositivo!");
      }
    } else {
      if (!silent) Alert.alert("Erro", "Falha ao salvar o jogo.");
    }
  };

  const handleUpdateSettings = async (newSettings: AudioSettings) => {
    setGameState((prev) => ({ ...prev, settings: newSettings }));
    await AsyncStorage.setItem(
      "lingoQuest_settings",
      JSON.stringify(newSettings),
    );
    playSfx("CLICK");
  };

  const startGame = async (
    theme: Theme,
    difficulty: Difficulty,
    mode: GameMode,
  ) => {
    playSfx("CLICK");
    setIsVictory(false);
    const startingPlayer = {
      ...INITIAL_PLAYER,
      name: userProfile?.name || "Adventurer",
      avatarUrl: userProfile?.avatarUrl || null,
    };
    setGameState((prev) => ({
      ...prev,
      isLoading: true,
      theme,
      difficulty,
      mode,
      player: startingPlayer,
    }));

    setThemeMusic(theme);

    try {
      const startSegment = await AI.generateStoryStart(theme, difficulty);
      setGameState((prev) => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        currentSegment: startSegment,
        challengeSolved: false,
        gameOver: false,
        history: [],
      }));
      handleSaveGame(true);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível iniciar a aventura.");
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleChoice = async (choiceIntent: string) => {
    if (!gameState.currentSegment) return;
    playSfx("CLICK");

    if (gameState.mode === GameMode.STORY && gameState.history.length >= 9) {
      setIsVictory(true);
      playSfx("LEVEL_UP");
      return;
    }

    setGameState((prev) => ({ ...prev, isLoading: true }));

    try {
      const cacheKey = `${gameState.currentSegment.content}_${choiceIntent}`;
      const prefetched = AI.prefetchCache[cacheKey];

      let nextSegment;
      if (prefetched) {
        console.log("Using cached segment for:", choiceIntent);
        nextSegment = prefetched;
      } else {
        nextSegment = await AI.generateNextSegment(
          gameState.currentSegment.content,
          choiceIntent,
          gameState.difficulty,
          gameState.history.length + 2,
        );
      }

      setGameState((prev) => ({
        ...prev,
        isLoading: false,
        history: [...prev.history, prev.currentSegment!],
        currentSegment: nextSegment,
        challengeSolved: false,
      }));

      // Auto-save after updating state
      setTimeout(() => handleSaveGame(true), 500);
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar o próximo capítulo.");
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleChallengeResult = (success: boolean) => {
    if (success) {
      const itemReward = gameState.currentSegment?.itemReward;
      let newInventory = [...gameState.player.inventory];
      if (itemReward && !newInventory.includes(itemReward)) {
        newInventory.push(itemReward);
      }

      const xpGain = gameState.currentSegment?.xpReward || 20;
      const newXpTotal = gameState.player.xp + xpGain;
      const neededForNextLevel = gameState.player.level * 100;
      const levelUp = newXpTotal >= neededForNextLevel;

      if (levelUp) playSfx("LEVEL_UP");
      else playSfx("SUCCESS");

      setGameState((prev) => ({
        ...prev,
        isChallengeActive: false,
        challengeSolved: true,
        player: {
          ...prev.player,
          inventory: newInventory,
          xp: levelUp ? newXpTotal - neededForNextLevel : newXpTotal,
          level: levelUp ? prev.player.level + 1 : prev.player.level,
          streak: prev.player.streak + 1,
          health: Math.min(
            prev.player.maxHealth,
            prev.player.health + (levelUp ? 1 : 0),
          ),
        },
      }));
    } else {
      playSfx("ERROR");
      const newHealth = gameState.player.health - 1;
      if (newHealth <= 0) {
        setGameState((prev) => ({ ...prev, gameOver: true, isPlaying: true }));
        playSfx("GAME_OVER");
      } else {
        setGameState((prev) => ({
          ...prev,
          isChallengeActive: false,
          player: { ...prev.player, streak: 0, health: newHealth },
        }));
      }
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
      <View style={styles.fullscreenOverlay}>
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverTitle}>GAME OVER</Text>
          <Button
            onPress={() =>
              setGameState((prev) => ({
                ...prev,
                isPlaying: false,
                gameOver: false,
              }))
            }
            fullWidth
          >
            VOLTAR AO MENU
          </Button>
        </View>
      </View>
    );
  }

  if (isVictory) {
    return (
      <View style={styles.fullscreenOverlay}>
        <View style={[styles.gameOverCard, { borderColor: COLORS.success }]}>
          <Text style={[styles.gameOverTitle, { color: COLORS.success }]}>
            VICTÓRIA!
          </Text>
          <Text style={styles.victoryText}>
            Parabéns! Você completou sua jornada de 10 capítulos.
          </Text>
          <Button
            onPress={() => {
              setIsVictory(false);
              setGameState((prev) => ({ ...prev, isPlaying: false }));
            }}
            fullWidth
          >
            NOVA AVENTURA
          </Button>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <StatsBar
          player={gameState.player}
          onOpenJournal={() => setIsJournalOpen(true)}
          onSaveGame={handleSaveGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onExit={() => setGameState((prev) => ({ ...prev, isPlaying: false }))}
        />

        <ScrollView contentContainerStyle={styles.mainContent}>
          {gameState.currentSegment && (
            <StoryView
              segment={gameState.currentSegment}
              onChoiceSelected={handleChoice}
              onChallengeRequest={() =>
                setGameState((prev) => ({ ...prev, isChallengeActive: true }))
              }
              isChallengeSolved={gameState.challengeSolved}
              isGenerating={gameState.isLoading}
              onImageGenerated={(url) =>
                setGameState((prev) => ({
                  ...prev,
                  currentSegment: prev.currentSegment
                    ? { ...prev.currentSegment, imageUrl: url }
                    : null,
                }))
              }
              settings={gameState.settings}
              userAvatarUrl={gameState.player.avatarUrl}
            />
          )}
        </ScrollView>

        {/* Floating Chat Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setIsChatOpen(true)}
        >
          <Text style={styles.floatingButtonText}>?</Text>
        </TouchableOpacity>

        {/* Modals */}
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    paddingVertical: 20,
    flexGrow: 1,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: COLORS.dark,
    fontSize: 24,
    fontWeight: "bold",
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  gameOverCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 30,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  gameOverTitle: {
    color: COLORS.danger,
    fontSize: 28,
    fontFamily: "PressStart2P_400Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  victoryText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
});
