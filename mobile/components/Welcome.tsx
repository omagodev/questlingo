import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Difficulty, Theme, GameMode, GameState, UserProfile } from "../types";
import Button from "./Button";
import { playSfx } from "../services/audioService";
import {
  getSaves,
  loadGame,
  SaveSlot,
  deleteSave,
} from "../services/storageService";
import { generateAvatar } from "../services/aiService";
import { COLORS, FONTS } from "../theme";
import {
  User,
  Camera,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Skull,
} from "lucide-react-native";

interface WelcomeProps {
  onStart: (theme: Theme, difficulty: Difficulty, mode: GameMode) => void;
  onLoadGame: (state: GameState) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  userProfile: UserProfile | null;
  isLoading: boolean;
}

const AVATAR_OPTIONS = {
  archetype: [
    "Knight",
    "Mage",
    "Rogue",
    "Cyberpunk",
    "Survivor",
    "Astronaut",
    "Elf",
    "Orc",
  ],
  gender: ["Male", "Female", "Robot", "Non-binary"],
  hairStyle: [
    "Short Hair",
    "Long Hair",
    "Mohawk",
    "Bald",
    "Spiky Hair",
    "Ponytail",
  ],
  hairColor: ["Blonde", "Black", "Brown", "Red", "Blue", "White", "Neon Green"],
  clothing: [
    "Iron Armor",
    "Leather Jacket",
    "Wizard Robes",
    "Space Suit",
    "Tattered Rags",
    "Hoodie",
  ],
};

const Welcome: React.FC<WelcomeProps> = ({
  onStart,
  onLoadGame,
  onUpdateProfile,
  userProfile,
  isLoading,
}) => {
  const [theme, setTheme] = useState<Theme>(Theme.FANTASY);
  const [diff, setDiff] = useState<Difficulty>(Difficulty.BEGINNER);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [view, setView] = useState<"profile" | "menu" | "load">("menu");

  const [nameInput, setNameInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const [avatarIndices, setAvatarIndices] = useState({
    archetype: 0,
    gender: 0,
    hairStyle: 0,
    hairColor: 0,
    clothing: 0,
  });

  useEffect(() => {
    refreshSaves();
    if (!userProfile) {
      setView("profile");
    } else {
      setNameInput(userProfile.name);
      setAvatarUrl(userProfile.avatarUrl);
    }
  }, [userProfile]);

  const refreshSaves = async () => {
    const s = await getSaves();
    setSaves(s);
  };

  const cycleOption = (
    category: keyof typeof AVATAR_OPTIONS,
    dir: "prev" | "next",
  ) => {
    playSfx("CLICK");
    const options = AVATAR_OPTIONS[category];
    setAvatarIndices((prev) => {
      let nextIdx = dir === "next" ? prev[category] + 1 : prev[category] - 1;
      if (nextIdx >= options.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = options.length - 1;
      return { ...prev, [category]: nextIdx };
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setReferenceImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      playSfx("SUCCESS");
    }
  };

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    const prompt = `${AVATAR_OPTIONS.gender[avatarIndices.gender]} ${AVATAR_OPTIONS.archetype[avatarIndices.archetype]} with ${AVATAR_OPTIONS.hairColor[avatarIndices.hairColor]} ${AVATAR_OPTIONS.hairStyle[avatarIndices.hairStyle]} wearing ${AVATAR_OPTIONS.clothing[avatarIndices.clothing]}`;

    try {
      const url = await generateAvatar(prompt, referenceImage);
      if (url) setAvatarUrl(url);
    } catch (e) {
      Alert.alert("Erro", "Falha ao gerar avatar.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSaveProfile = () => {
    if (!nameInput.trim()) return;
    onUpdateProfile({ name: nameInput.trim(), avatarUrl });
    setView("menu");
  };

  const handleLoad = async (id: string) => {
    const state = await loadGame(id);
    if (state) onLoadGame(state);
  };

  const handleDelete = async (id: string) => {
    await deleteSave(id);
    refreshSaves();
  };

  if (view === "profile") {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>CRIAR PERSONAGEM</Text>

          <View style={styles.avatarPreview}>
            {isGeneratingAvatar ? (
              <ActivityIndicator size="large" color={COLORS.accent} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <User size={64} color={COLORS.border} />
            )}
          </View>

          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Nome do Herói"
            placeholderTextColor="#666"
            maxLength={15}
          />

          <View style={styles.customizationRow}>
            {Object.keys(AVATAR_OPTIONS).map((cat) => (
              <View key={cat} style={styles.selector}>
                <Text style={styles.selectorLabel}>{cat.toUpperCase()}</Text>
                <View style={styles.selectorControls}>
                  <TouchableOpacity
                    onPress={() => cycleOption(cat as any, "prev")}
                  >
                    <ChevronLeft color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.selectorValue}>
                    {
                      AVATAR_OPTIONS[cat as keyof typeof AVATAR_OPTIONS][
                        avatarIndices[cat as keyof typeof avatarIndices]
                      ]
                    }
                  </Text>
                  <TouchableOpacity
                    onPress={() => cycleOption(cat as any, "next")}
                  >
                    <ChevronRight color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.buttonGroup}>
            <Button
              variant="secondary"
              onPress={handlePickImage}
              fullWidth
              style={styles.mb8}
            >
              {referenceImage
                ? "✅ FOTO CARREGADA"
                : "📷 USAR FOTO DE REFERÊNCIA"}
            </Button>
            <Button
              variant="accent"
              onPress={handleGenerateAvatar}
              fullWidth
              disabled={isGeneratingAvatar}
              style={styles.mb8}
            >
              {isGeneratingAvatar
                ? "GENERATING..."
                : "🎨 GERAR VISUAL PIXEL ART"}
            </Button>
            <Button
              variant="primary"
              onPress={handleSaveProfile}
              fullWidth
              disabled={!nameInput.trim() || isGeneratingAvatar}
            >
              CONFIRMAR
            </Button>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (view === "load") {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={[styles.card, { width: "90%" }]}>
          <View style={styles.header}>
            <Text style={styles.title}>CARREGAR JOGO</Text>
            <TouchableOpacity onPress={() => setView("menu")}>
              <Text style={styles.backText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.saveList}>
            {saves.map((save) => (
              <View key={save.id} style={styles.saveItem}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleLoad(save.id)}
                >
                  <Text style={styles.saveSummary}>{save.summary}</Text>
                  <Text style={styles.saveDate}>
                    {new Date(save.date).toLocaleString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(save.id)}>
                  <Trash2 size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            {saves.length === 0 && (
              <Text style={styles.emptyText}>Nenhum save encontrado.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.logo}>LINGOQUEST</Text>
      <Text style={styles.subtitle}>Aprenda inglês vivendo uma aventura.</Text>

      <View style={[styles.card, { width: "90%" }]}>
        {saves.length > 0 && (
          <Button
            variant="accent"
            onPress={() => setView("load")}
            fullWidth
            style={styles.mb16}
          >
            💾 CARREGAR JOGO ({saves.length})
          </Button>
        )}

        <Text style={styles.sectionLabel}>Dificuldade</Text>
        <View style={styles.row}>
          {Object.values(Difficulty).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, diff === d && styles.chipActive]}
              onPress={() => setDiff(d)}
            >
              <Text
                style={[styles.chipText, diff === d && styles.chipTextActive]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Cenário</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollRow}
        >
          {Object.values(Theme).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.themeChip, theme === t && styles.themeChipActive]}
              onPress={() => setTheme(t)}
            >
              <Text
                style={[styles.chipText, theme === t && styles.chipTextActive]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.mt16}>
          <Button
            variant="primary"
            onPress={() => onStart(theme, diff, GameMode.STORY)}
            fullWidth
            style={styles.mb8}
          >
            INICIAR HISTÓRIA 📖
          </Button>
          <Button
            variant="danger"
            onPress={() => onStart(theme, diff, GameMode.SURVIVAL)}
            fullWidth
          >
            SOBREVIVÊNCIA 💀
          </Button>
        </View>
      </View>

      {userProfile && (
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => setView("profile")}
        >
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Image
            source={{
              uri: userProfile.avatarUrl || "https://via.placeholder.com/40",
            }}
            style={styles.profileAvatar}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollContent: {
    paddingVertical: 40,
    alignItems: "center",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    fontSize: 42,
    color: COLORS.primary,
    fontFamily: FONTS.retro,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.retro,
    textAlign: "center",
    marginBottom: 20,
  },
  avatarPreview: {
    width: 150,
    height: 150,
    backgroundColor: "#000",
    borderRadius: 15,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  input: {
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    padding: 12,
    borderRadius: 8,
    fontFamily: FONTS.retro,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customizationRow: {
    marginBottom: 20,
  },
  selector: {
    marginBottom: 12,
  },
  selectorLabel: {
    color: COLORS.text,
    fontSize: 8,
    fontFamily: FONTS.retro,
    marginBottom: 4,
  },
  selectorControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.dark,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorValue: {
    color: COLORS.white,
    fontSize: 12,
  },
  buttonGroup: {
    gap: 8,
  },
  sectionLabel: {
    color: COLORS.accent,
    fontFamily: FONTS.retro,
    fontSize: 12,
    marginBottom: 10,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  scrollRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(122, 162, 247, 0.1)",
  },
  themeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(122, 162, 247, 0.1)",
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  saveList: {
    maxHeight: 400,
  },
  saveItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveSummary: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  saveDate: {
    color: COLORS.text,
    fontSize: 10,
  },
  emptyText: {
    color: COLORS.text,
    textAlign: "center",
    marginTop: 20,
  },
  profileBadge: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileName: {
    color: COLORS.primary,
    fontSize: 10,
    marginRight: 8,
    fontWeight: "bold",
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mt16: { marginTop: 16 },
});

export default Welcome;
