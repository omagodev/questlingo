import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Challenge } from "../types";
import Button from "./Button";
import { playSfx } from "../services/audioService";
import { COLORS, FONTS } from "../theme";

interface ChallengeModalProps {
  challenge: Challenge;
  onSolve: (success: boolean) => void;
  onClose: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  onSolve,
  onClose,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
  }, [challenge]);

  const handleSelect = (idx: number) => {
    if (!submitted) {
      playSfx("CLICK");
      setSelected(idx);
    }
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const correct = selected === challenge.correctIndex;
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) {
      setTimeout(() => onSolve(true), 1500);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.header}>
            DESAFIO: {challenge.type.toUpperCase()}
          </Text>
          <ScrollView>
            <Text style={styles.question}>{challenge.question}</Text>
            <View style={styles.options}>
              {challenge.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelect(idx)}
                  disabled={submitted}
                  style={[
                    styles.optionBtn,
                    selected === idx && styles.optionSelected,
                    submitted &&
                      idx === challenge.correctIndex &&
                      styles.optionCorrect,
                    submitted &&
                      selected === idx &&
                      idx !== challenge.correctIndex &&
                      styles.optionWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected === idx && styles.textWhite,
                    ]}
                  >
                    {String.fromCharCode(65 + idx)}) {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {submitted && (
              <View
                style={[
                  styles.feedback,
                  isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
                ]}
              >
                <Text style={styles.feedbackTitle}>
                  {isCorrect ? "Correto!" : "Incorreto!"}
                </Text>
                <Text style={styles.explanation}>{challenge.explanation}</Text>
                {!isCorrect && (
                  <Button
                    onPress={() => onSolve(false)}
                    variant="danger"
                    fullWidth
                    style={styles.mt16}
                  >
                    CONTINUAR (PERDER VIDA)
                  </Button>
                )}
              </View>
            )}

            {!submitted && (
              <Button
                onPress={handleSubmit}
                disabled={selected === null}
                fullWidth
              >
                VERIFICAR
              </Button>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 16,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.accent,
    maxHeight: "90%",
  },
  header: {
    fontFamily: FONTS.retro,
    color: COLORS.accent,
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  question: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  optionBtn: {
    backgroundColor: COLORS.dark,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(122, 162, 247, 0.2)",
  },
  optionCorrect: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(158, 206, 106, 0.2)",
  },
  optionWrong: {
    borderColor: COLORS.danger,
    backgroundColor: "rgba(247, 118, 142, 0.2)",
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
  },
  textWhite: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  feedback: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  feedbackCorrect: {
    backgroundColor: "rgba(158, 206, 106, 0.1)",
    borderColor: COLORS.success,
  },
  feedbackWrong: {
    backgroundColor: "rgba(247, 118, 142, 0.1)",
    borderColor: COLORS.danger,
  },
  feedbackTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
    color: COLORS.white,
  },
  explanation: {
    color: COLORS.text,
    fontSize: 14,
  },
  mt16: { marginTop: 16 },
});

export default ChallengeModal;
