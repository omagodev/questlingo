import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import { AudioSettings } from "../types";
import Button from "./Button";
import { speakText } from "../services/audioService";
import { COLORS, FONTS } from "../theme";
import { X, Volume2, Mic, Check } from "lucide-react-native";

const OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

interface SettingsModalProps {
  currentSettings: AudioSettings;
  onSave: (settings: AudioSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  currentSettings,
  onSave,
  onClose,
}) => {
  const [settings, setSettings] = useState<AudioSettings>(currentSettings);

  const handleTest = () => {
    speakText("Welcome to Lingo Quest, brave adventurer.", settings);
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Volume2 size={24} color={COLORS.primary} />
              <Text style={styles.title}>CONFIGURAÇÕES</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.settingItem}>
              <View style={styles.labelRow}>
                <View>
                  <Text style={styles.label}>Voz de IA (OpenAI)</Text>
                  <Text style={styles.subLabel}>
                    Voz ultra-realista (Requer Internet)
                  </Text>
                </View>
                <Switch
                  value={settings.useAIVoice}
                  onValueChange={(val) =>
                    setSettings({ ...settings, useAIVoice: val })
                  }
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={settings.useAIVoice ? COLORS.white : COLORS.text}
                />
              </View>
            </View>

            {settings.useAIVoice && (
              <View style={styles.voiceSelector}>
                <Text style={styles.subTitle}>ESCOLHA A VOZ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.voiceRow}>
                    {OPENAI_VOICES.map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.voiceOption,
                          settings.aiVoice === v && styles.voiceOptionActive,
                        ]}
                        onPress={() => setSettings({ ...settings, aiVoice: v })}
                      >
                        <Text
                          style={[
                            styles.voiceOptionText,
                            settings.aiVoice === v &&
                              styles.voiceOptionTextActive,
                          ]}
                        >
                          {v.toUpperCase()}
                        </Text>
                        {settings.aiVoice === v && (
                          <Check size={12} color={COLORS.dark} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.settingItem}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Velocidade da Fala</Text>
                <Text style={styles.value}>
                  {settings.speechRate.toFixed(1)}x
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={settings.speechRate}
                onValueChange={(val) =>
                  setSettings({ ...settings, speechRate: val })
                }
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Tom (Pitch)</Text>
                <Text style={styles.value}>{settings.pitch.toFixed(1)}x</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={1.5}
                step={0.1}
                value={settings.pitch}
                onValueChange={(val) =>
                  setSettings({ ...settings, pitch: val })
                }
                minimumTrackTintColor={COLORS.success}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.success}
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                variant="secondary"
                onPress={handleTest}
                style={{ flex: 1 }}
              >
                🔊 TESTAR
              </Button>
              <Button
                variant="primary"
                onPress={handleSave}
                style={{ flex: 1 }}
              >
                SALVAR
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: COLORS.primary,
    fontFamily: FONTS.retro,
    fontSize: 14,
  },
  body: {
    gap: 24,
  },
  settingItem: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  subLabel: {
    color: "#aaa",
    fontSize: 10,
    marginTop: 2,
  },
  subTitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontFamily: FONTS.retro,
    marginBottom: 8,
  },
  voiceSelector: {
    marginBottom: 10,
  },
  voiceRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  voiceOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voiceOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  voiceOptionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  voiceOptionTextActive: {
    color: COLORS.dark,
  },
  value: {
    color: COLORS.accent,
    fontWeight: "bold",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
});

export default SettingsModal;
