import React, { useEffect, useState, useRef } from "react";
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
import { getMediaUrl } from "../services/config";

interface WelcomeProps {
  onStart: (theme: Theme, difficulty: Difficulty, mode: GameMode) => void;
  onLoadGame: (state: GameState) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  userProfile: UserProfile | null;
  isLoading: boolean;
}

// Avatar Editing Configuration
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
  facialHair: ["Clean Shaven", "Full Beard", "Goatee", "Stubble", "Mustache"],
  clothing: [
    "Iron Armor",
    "Leather Jacket",
    "Wizard Robes",
    "Space Suit",
    "Tattered Rags",
    "Hoodie",
  ],
  accessory: [
    "None",
    "Eyepatch",
    "Glasses",
    "Scar",
    "Headband",
    "Earrings",
    "Helmet",
  ],
};

const Welcome: React.FC<WelcomeProps> = ({
  onStart,
  onLoadGame,
  onUpdateProfile,
  userProfile,
  isLoading,
}) => {
  const [theme, setTheme] = React.useState<Theme>(Theme.FANTASY);
  const [diff, setDiff] = React.useState<Difficulty>(Difficulty.BEGINNER);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [view, setView] = useState<"profile" | "menu" | "load">("menu");

  // Profile Form State
  const [nameInput, setNameInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar Editor State (Indices)
  const [avatarIndices, setAvatarIndices] = useState({
    archetype: 0,
    gender: 0,
    hairStyle: 0,
    hairColor: 0,
    facialHair: 0,
    clothing: 0,
    accessory: 0,
  });

  useEffect(() => {
    getSaves().then(setSaves);
    // If no profile exists, force profile view
    if (!userProfile) {
      setView("profile");
    } else {
      // Pre-fill if editing
      setNameInput(userProfile.name);
      setAvatarUrl(userProfile.avatarUrl);
    }
  }, [userProfile]);

  const cycleOption = (
    category: keyof typeof AVATAR_OPTIONS,
    direction: "prev" | "next",
  ) => {
    playSfx("CLICK");
    setAvatarIndices((prev) => {
      const current = prev[category];
      const max = AVATAR_OPTIONS[category].length;
      let nextIndex;

      if (direction === "next") {
        nextIndex = (current + 1) % max;
      } else {
        nextIndex = (current - 1 + max) % max;
      }

      return { ...prev, [category]: nextIndex };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
        playSfx("SUCCESS");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    playSfx("CLICK");
  };

  const constructAvatarPrompt = () => {
    const opts = AVATAR_OPTIONS;
    const idx = avatarIndices;

    let description = `${opts.gender[idx.gender]} ${opts.archetype[idx.archetype]}`;

    if (opts.hairStyle[idx.hairStyle] !== "Bald") {
      description += ` with ${opts.hairColor[idx.hairColor]} ${opts.hairStyle[idx.hairStyle]}`;
    } else {
      description += `, Bald`;
    }

    description += `, wearing ${opts.clothing[idx.clothing]}`;

    if (opts.facialHair[idx.facialHair] !== "Clean Shaven") {
      description += `, has ${opts.facialHair[idx.facialHair]}`;
    }

    if (opts.accessory[idx.accessory] !== "None") {
      description += `, wearing ${opts.accessory[idx.accessory]}`;
    }

    return description;
  };

  const handleGenerateAvatar = async () => {
    playSfx("CLICK");
    setIsGeneratingAvatar(true);

    const prompt = constructAvatarPrompt();

    try {
      const url = await generateAvatar(prompt, referenceImage);
      if (url) setAvatarUrl(url);
    } catch (e) {
      alert("Erro ao gerar avatar.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSaveProfile = () => {
    if (!nameInput.trim()) return;
    playSfx("SUCCESS");
    onUpdateProfile({
      name: nameInput.trim(),
      avatarUrl: avatarUrl,
    });
    setView("menu");
  };

  const handleThemeSelect = (t: Theme) => {
    playSfx("CLICK");
    setTheme(t);
  };

  const handleDiffSelect = (d: Difficulty) => {
    playSfx("CLICK");
    setDiff(d);
  };

  const handleStart = (mode: GameMode) => {
    playSfx("CLICK");
    onStart(theme, diff, mode);
  };

  const handleLoad = async (save: SaveSlot) => {
    playSfx("CLICK");
    const fullState = await loadGame(save.id);
    if (fullState) {
      onLoadGame(fullState);
    } else {
      alert("Erro ao carregar o save.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSave(id);
    const updatedSaves = await getSaves();
    setSaves(updatedSaves);
    playSfx("CLICK");
  };

  const SelectorRow = ({
    label,
    category,
  }: {
    label: string;
    category: keyof typeof AVATAR_OPTIONS;
  }) => {
    const options = AVATAR_OPTIONS[category];
    const currentIndex = avatarIndices[category];
    const currentValue = options[currentIndex];

    return (
      <div className="flex flex-col mb-3">
        <span className="text-gray-400 text-[10px] uppercase font-bold mb-1">
          {label}
        </span>
        <div className="flex items-center justify-between bg-gray-800 rounded border border-gray-700 p-1">
          <button
            onClick={() => cycleOption(category, "prev")}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold"
          >
            ←
          </button>
          <span className="text-sm font-serif text-yellow-100">
            {currentValue}
          </span>
          <button
            onClick={() => cycleOption(category, "next")}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold"
          >
            →
          </button>
        </div>
      </div>
    );
  };

  if (view === "profile") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in bg-black/50">
        <div className="bg-quest-card max-w-2xl w-full p-4 md:p-8 rounded-2xl border-2 border-quest-primary shadow-2xl flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center justify-center md:w-1/3">
            <h2 className="font-retro text-xl text-quest-primary mb-4 md:hidden">
              Criar Personagem
            </h2>
            <div className="w-48 h-48 bg-gray-900 border-4 border-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative shadow-inner">
              {isGeneratingAvatar ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin w-10 h-10 border-4 border-quest-accent border-t-transparent rounded-full"></div>
                  <span className="text-[10px] animate-pulse">
                    Pixelating...
                  </span>
                </div>
              ) : avatarUrl ? (
                <img
                  src={getMediaUrl(avatarUrl)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-4xl block mb-2">👤</span>
                  <span className="text-xs text-gray-500">
                    Opcional: Gere um Visual
                  </span>
                </div>
              )}
            </div>

            <div className="w-full mb-4">
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">
                Nome
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={15}
                placeholder="Ex: Hero"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-quest-primary focus:outline-none font-retro text-xs text-center"
              />
            </div>

            <div className="w-full mb-4 flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />

              {referenceImage ? (
                <div className="relative w-full p-2 border border-gray-700 rounded bg-gray-800 flex items-center gap-2">
                  <div className="w-10 h-10 bg-black rounded overflow-hidden flex-shrink-0">
                    <img
                      src={referenceImage}
                      className="w-full h-full object-cover opacity-70"
                    />
                  </div>
                  <span className="text-[10px] text-green-400 flex-1">
                    Foto carregada!
                  </span>
                  <button
                    onClick={clearReferenceImage}
                    className="text-red-400 text-xs font-bold px-2 py-1 hover:text-red-200"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] py-2 w-full flex items-center justify-center gap-2 border-dashed border-2 border-gray-600"
                >
                  <span>📷</span> Foto de Referência
                </Button>
              )}
            </div>

            <Button
              fullWidth
              variant="accent"
              onClick={handleGenerateAvatar}
              disabled={isGeneratingAvatar}
              className="mb-2 text-xs py-3"
            >
              {isGeneratingAvatar ? "Gerando..." : "🎨 Gerar Visual"}
            </Button>

            <Button
              fullWidth
              variant="primary"
              onClick={handleSaveProfile}
              disabled={!nameInput.trim() || isGeneratingAvatar}
              className="text-xs py-3"
            >
              Confirmar
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-auto bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <h3 className="font-retro text-sm text-gray-300 mb-4 border-b border-gray-700 pb-2">
              Customização
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <SelectorRow label="Classe" category="archetype" />
              <SelectorRow label="Gênero" category="gender" />
              <SelectorRow label="Estilo Cabelo" category="hairStyle" />
              <SelectorRow label="Cor Cabelo" category="hairColor" />
              <SelectorRow label="Barba" category="facialHair" />
              <SelectorRow label="Roupas" category="clothing" />
              <SelectorRow label="Acessórios" category="accessory" />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic text-center">
              Gere seu avatar antes de confirmar se quiser um visual
              customizado!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "load") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="w-full bg-quest-card p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-retro text-2xl text-quest-accent">
              Carregar Jogo
            </h2>
            <button
              onClick={() => setView("menu")}
              className="text-gray-400 hover:text-white"
            >
              ✕ Voltar
            </button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {saves.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum jogo salvo.
              </p>
            ) : (
              saves.map((save) => (
                <div
                  key={save.id}
                  onClick={() => handleLoad(save)}
                  className="group bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-quest-primary cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="text-white font-bold text-sm">
                      {save.summary}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(save.date).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, save.id)}
                    className="p-2 text-red-500 hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto animate-fade-in">
      {userProfile && (
        <div
          className="absolute top-6 right-6 flex items-center space-x-3 bg-quest-card px-4 py-2 rounded-full border border-gray-700 shadow-lg cursor-pointer hover:bg-gray-800"
          onClick={() => setView("profile")}
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Logado como</p>
            <p className="text-sm font-bold text-quest-primary">
              {userProfile.name}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-quest-primary bg-gray-900">
            {userProfile.avatarUrl ? (
              <img
                src={getMediaUrl(userProfile.avatarUrl)}
                className="w-full h-full object-cover"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div className="w-full h-full bg-quest-primary flex items-center justify-center text-xs font-bold text-quest-dark">
                {userProfile.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      )}

      <h1 className="font-retro text-4xl md:text-5xl text-quest-primary mb-4 leading-normal">
        LingoQuest
      </h1>
      <p className="text-gray-400 text-lg mb-12">
        Aprenda inglês vivendo uma aventura.
      </p>

      {view === "menu" && (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
          <Button
            fullWidth
            variant="primary"
            onClick={() => {
              playSfx("CLICK");
              setView("newGame");
            }}
            className="py-6 text-xl shadow-lg hover:shadow-blue-500/20"
          >
            ⚔️ Nova Aventura
          </Button>

          {saves.length > 0 && !isLoading && (
            <Button
              fullWidth
              variant="accent"
              onClick={() => {
                playSfx("CLICK");
                setView("load");
              }}
              className="py-4 text-lg shadow-lg hover:shadow-purple-500/20"
            >
              💾 Continuar Jornada ({saves.length})
            </Button>
          )}
        </div>
      )}

      {view === "newGame" && (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in">
          <div className="flex justify-start mb-2">
            <button
              onClick={() => setView("menu")}
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              <span className="text-xl">←</span> Voltar
            </button>
          </div>
          <div className="bg-quest-card p-6 md:p-8 rounded-2xl border border-gray-800 shadow-2xl flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gray-700 flex-1"></div>
              <h2 className="text-sm font-retro text-gray-400 uppercase tracking-widest">
                Nova Aventura
              </h2>
              <div className="h-px bg-gray-700 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-quest-accent font-bold mb-3 font-retro text-sm uppercase">
                    🌍 Cenário
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(Theme).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleThemeSelect(t)}
                        className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center min-h-[48px] ${
                          theme === t
                            ? "border-2 border-quest-primary bg-blue-900/40 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            : "border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-quest-success font-bold mb-3 font-retro text-sm uppercase">
                    ⭐ Nível de Inglês
                  </label>
                  <div className="flex flex-col gap-2">
                    {Object.values(Difficulty).map((d) => (
                      <button
                        key={d}
                        onClick={() => handleDiffSelect(d)}
                        className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                          diff === d
                            ? "border-2 border-quest-success bg-green-900/40 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                            : "border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-4 bg-gray-900/40 p-6 rounded-xl border border-gray-800/50">
                <div className="text-center mb-4">
                  <h3 className="text-white font-retro text-lg mb-1">
                    Modo de Jogo
                  </h3>
                  <p className="text-xs text-gray-400">Escolha o seu desafio</p>
                </div>

                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => handleStart(GameMode.STORY)}
                  disabled={isLoading}
                  className="py-4 shadow-lg hover:shadow-blue-500/20"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">
                      {isLoading ? "Gerando..." : "📖 História Guiada"}
                    </span>
                    <span className="text-[10px] text-blue-200 font-normal normal-case opacity-80">
                      Narrativa rica com escolhas
                    </span>
                  </div>
                </Button>

                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => handleStart(GameMode.SURVIVAL)}
                  disabled={isLoading}
                  className="py-4 shadow-lg hover:shadow-red-500/20"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">
                      {isLoading ? "Preparando..." : "💀 Modo Sobrevivência"}
                    </span>
                    <span className="text-[10px] text-red-200 font-normal normal-case opacity-80">
                      Teste rápido de vocabulário
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
