import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { StorySegment, AudioSettings, WordTranslation } from "../types";
import Button from "./Button";
import {
  playSfx,
  speakText,
  stopSpeech,
  setAmbience,
  pauseSpeech,
  resumeSpeech,
} from "../services/audioService";
import { translateWord, generateSceneImage } from "../services/aiService";
import { COLORS, FONTS } from "../theme";
import {
  Play,
  Pause,
  Clock,
  Search,
  BookOpen,
  ChevronRight,
  HelpCircle,
} from "lucide-react-native";
import { useRef } from "react";

interface StoryViewProps {
  segment: StorySegment;
  onChoiceSelected: (choice: string) => void;
  onChallengeRequest: () => void;
  isChallengeSolved: boolean;
  isGenerating: boolean;
  onImageGenerated: (url: string) => void;
  settings: AudioSettings;
  userAvatarUrl: string | null;
}

const StoryView: React.FC<StoryViewProps> = ({
  segment,
  onChoiceSelected,
  onChallengeRequest,
  isChallengeSolved,
  isGenerating,
  onImageGenerated,
  settings,
  userAvatarUrl,
}) => {
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [isTranslationMode, setIsTranslationMode] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(
    segment.imageUrl || null,
  );

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [translationData, setTranslationData] =
    useState<WordTranslation | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const lastNarratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (segment.mood) {
      setAmbience(segment.mood);
    }

    if (!segment.imageUrl) {
      handleGenerateImage();
    } else {
      setImageSrc(segment.imageUrl);
    }

    // Auto-narrate only if it's a new segment
    if (lastNarratedRef.current !== segment.content) {
      handleAutoNarrate();
    }

    return () => {
      stopSpeech();
    };
  }, [segment.content]);

  const handleGenerateImage = async () => {
    setLoadingImage(true);
    try {
      const url = await generateSceneImage(segment.imageKeyword);
      if (url) {
        setImageSrc(url);
        onImageGenerated(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingImage(false);
    }
  };

  const handleAutoNarrate = () => {
    if (lastNarratedRef.current === segment.content) return;
    lastNarratedRef.current = segment.content;

    setTimeout(() => {
      handlePlay();
    }, 1000);
  };

  const handlePlay = () => {
    setIsAudioActive(true);
    setIsPaused(false);
    speakText(
      segment.content,
      { ...settings, prefetchedAudio: segment.audioUrl } as any,
      undefined,
      () => {
        setIsAudioActive(false);
        setIsPaused(false);
      },
    );
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await resumeSpeech();
      setIsPaused(false);
    } else {
      await pauseSpeech();
      setIsPaused(true);
    }
  };

  const handleWordTap = async (word: string) => {
    if (!isTranslationMode) return;

    playSfx("CLICK");
    const cleanWord = word.replace(/[^a-zA-Z0-9'’-]/g, "");
    if (!cleanWord || cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setIsLoadingTranslation(true);
    try {
      const result = await translateWord(cleanWord, segment.content);
      setTranslationData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const renderInteractiveText = (text: string) => {
    const parts = text.split(/([a-zA-Z0-9'’-]+)/g);
    return (
      <Text style={styles.storyText}>
        {parts.map((part, index) => {
          if (/[a-zA-Z0-9'’-]+/.test(part)) {
            return (
              <Text
                key={index}
                onPress={() => handleWordTap(part)}
                style={[styles.word, isTranslationMode && styles.wordHighlight]}
              >
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Global Loading Overlay */}
      {isGenerating && (
        <View style={styles.globalLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.globalLoaderText}>TELLING THE STORY...</Text>
        </View>
      )}

      {/* Scene Image */}
      <View style={styles.imageContainer}>
        {loadingImage ? (
          <View style={styles.imageLoader}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={styles.loaderText}>GENERATING WORLD...</Text>
          </View>
        ) : (
          imageSrc && <Image source={{ uri: imageSrc }} style={styles.image} />
        )}
        <View style={styles.moodBadge}>
          <Text style={styles.moodText}>{segment.mood?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Text Area */}
      <View style={styles.contentCard}>
        <ScrollView style={styles.textScroll}>
          {renderInteractiveText(segment.content)}

          {showFullTranslation && (
            <View style={styles.fullTranslationBox}>
              <Text style={styles.translationText}>{segment.translation}</Text>
            </View>
          )}
        </ScrollView>

        {/* Controls */}
        <View style={styles.controls}>
          {!isAudioActive || isPaused ? (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={isPaused ? handlePauseResume : handlePlay}
            >
              <Play size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={handlePauseResume}
            >
              <Pause size={20} color={COLORS.warning} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => speakText(segment.content, settings, 0.5)}
          >
            <Clock size={20} color={COLORS.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              isTranslationMode && styles.controlBtnActive,
            ]}
            onPress={() => setIsTranslationMode(!isTranslationMode)}
          >
            <Search
              size={20}
              color={isTranslationMode ? COLORS.dark : COLORS.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setShowFullTranslation(!showFullTranslation)}
          >
            <BookOpen size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interaction / Choices */}
      <View style={styles.actionArea}>
        {!isChallengeSolved ? (
          <View style={styles.challengeBox}>
            <Text style={styles.challengePrompt}>
              COMPLETE O DESAFIO PARA PROSSEGUIR
            </Text>
            <Button variant="accent" onPress={onChallengeRequest} fullWidth>
              ⚔️ ENFRENTAR DESAFIO
            </Button>
          </View>
        ) : (
          <View style={styles.choicesBox}>
            {segment.choices.map((choice, idx) => (
              <Button
                key={idx}
                variant="primary"
                onPress={() => onChoiceSelected(choice.intent)}
                fullWidth
                style={styles.choiceBtn}
              >
                {choice.text}
              </Button>
            ))}
          </View>
        )}
      </View>

      {/* Translation Modal */}
      <Modal
        visible={!!selectedWord}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalWord}>{selectedWord}</Text>
            {isLoadingTranslation ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              translationData && (
                <View>
                  <Text style={styles.modalPortuguese}>
                    {translationData.portuguese}
                  </Text>
                  <Text style={styles.modalDef}>
                    {translationData.definition}
                  </Text>
                  <Text style={styles.modalGrammar}>
                    {translationData.grammarClass}
                  </Text>
                </View>
              )
            )}
            <Button
              variant="secondary"
              onPress={() => setSelectedWord(null)}
              fullWidth
              style={styles.mt16}
            >
              FECHAR
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imageContainer: {
    height: 220,
    backgroundColor: COLORS.dark,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 16,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    color: COLORS.accent,
    fontFamily: FONTS.retro,
    fontSize: 10,
  },
  moodBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
  },
  moodText: {
    color: "#aaa",
    fontSize: 10,
    fontWeight: "bold",
  },
  contentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  textScroll: {
    flex: 1,
  },
  storyText: {
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 28,
  },
  word: {
    color: COLORS.white,
  },
  wordHighlight: {
    color: COLORS.accent,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 12,
  },
  controlBtn: {
    padding: 10,
    backgroundColor: COLORS.dark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlBtnActive: {
    backgroundColor: COLORS.accent,
  },
  fullTranslationBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  translationText: {
    color: "#aaa",
    fontStyle: "italic",
    fontSize: 14,
  },
  actionArea: {
    paddingVertical: 16,
    gap: 12,
  },
  challengeBox: {
    backgroundColor: "rgba(255,165,0,0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warning,
    alignItems: "center",
  },
  challengePrompt: {
    color: COLORS.warning,
    fontFamily: FONTS.retro,
    fontSize: 10,
    marginBottom: 12,
    textAlign: "center",
  },
  choicesBox: {
    gap: 8,
  },
  choiceBtn: {
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalWord: {
    color: COLORS.primary,
    fontSize: 24,
    fontFamily: FONTS.retro,
    marginBottom: 16,
    textAlign: "center",
  },
  modalPortuguese: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDef: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 8,
  },
  modalGrammar: {
    color: "#aaa",
    fontSize: 12,
    fontStyle: "italic",
  },
  mt16: { marginTop: 16 },
  globalLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  globalLoaderText: {
    color: COLORS.primary,
    fontFamily: FONTS.retro,
    fontSize: 12,
    marginTop: 20,
  },
});

export default StoryView;
