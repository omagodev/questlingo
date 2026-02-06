import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StorySegment } from "../types";
import { askTutor } from "../services/aiService";
import { playSfx } from "../services/audioService";
import { COLORS, FONTS } from "../theme";
import Button from "./Button";
import { X, Send } from "lucide-react-native";

interface Message {
  role: "user" | "tutor";
  text: string;
}

interface ChatTutorProps {
  segment: StorySegment;
  onClose: () => void;
}

const ChatTutor: React.FC<ChatTutorProps> = ({ segment, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "tutor",
      text: "Olá! Sou seu tutor. Tem alguma dúvida sobre o texto ou o desafio atual?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    playSfx("CLICK");

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askTutor(segment, userMsg);
      setMessages((prev) => [...prev, { role: "tutor", text: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "tutor", text: "Erro ao conectar com o tutor." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.tutorIcon}>
                <Text style={styles.tutorIconText}>?</Text>
              </View>
              <Text style={styles.headerTitle}>TUTOR IA</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === "user" ? styles.userBubble : styles.tutorBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === "user" ? styles.userText : styles.tutorText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View
                style={[
                  styles.messageBubble,
                  styles.tutorBubble,
                  styles.loadingBubble,
                ]}
              >
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Sua dúvida..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!input.trim() || isLoading) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={20} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: COLORS.card,
    height: "80%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tutorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tutorIconText: {
    color: COLORS.dark,
    fontFamily: FONTS.retro,
    fontSize: 12,
  },
  headerTitle: {
    color: COLORS.primary,
    fontFamily: FONTS.retro,
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 15,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  tutorBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.dark,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingBubble: {
    opacity: 0.6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: COLORS.dark,
    fontWeight: "bold",
  },
  tutorText: {
    color: COLORS.white,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

export default ChatTutor;
