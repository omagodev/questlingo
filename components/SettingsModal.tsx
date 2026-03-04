import React, { useState, useEffect } from "react";
import { AudioSettings } from "../types";
import Button from "./Button";
import { getEnglishVoices, speakText } from "../services/audioService";

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<AudioSettings>(currentSettings);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const vs = getEnglishVoices();
      setVoices(vs);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTest = () => {
    speakText("Welcome to Lingo Quest, brave adventurer.", settings);
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-quest-card w-full max-w-md rounded-2xl border-2 border-gray-600 shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h3 className="font-retro text-quest-primary text-lg">
            Configurações
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Engine Selector */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
            <div>
              <label className="block text-gray-200 text-sm font-bold">
                Usar Voz da IA (OpenAI)
              </label>
              <span className="text-xs text-gray-500">
                Vozes ultra-realistas (consome API)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.useAIVoice}
                onChange={(e) =>
                  setSettings({ ...settings, useAIVoice: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-quest-primary"></div>
            </label>
          </div>

          {!settings.useAIVoice ? (
            <>
              {/* Web Speech Voice Selector */}
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Voz do Navegador (Inglês)
                </label>
                <select
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                  value={settings.voiceURI || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      voiceURI: e.target.value || null,
                    })
                  }
                >
                  <option value="">Padrão (Automático)</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Slider */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-gray-300 font-bold">
                    Velocidade da Fala
                  </label>
                  <span className="text-quest-accent">
                    {settings.speechRate}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      speechRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-quest-primary"
                />
              </div>

              {/* Pitch Slider */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-gray-300 font-bold">Tom (Pitch)</label>
                  <span className="text-quest-accent">{settings.pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={settings.pitch}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pitch: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-quest-warning"
                />
              </div>
            </>
          ) : (
            <>
              {/* AI Voice Selector */}
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">
                  Voz da IA
                </label>
                <select
                  className="w-full bg-gray-800 border border-quest-primary rounded p-2 text-white text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  value={settings.aiVoice || "onyx"}
                  onChange={(e) =>
                    setSettings({ ...settings, aiVoice: e.target.value })
                  }
                >
                  <option value="alloy">Alloy (Andrógeno)</option>
                  <option value="echo">Echo (Masculino, suave)</option>
                  <option value="fable">
                    Fable (Masculino, estilo narrador britânico)
                  </option>
                  <option value="onyx">
                    Onyx (Masculino, grave e rasgado)
                  </option>
                  <option value="nova">Nova (Feminino, energético)</option>
                  <option value="shimmer">
                    Shimmer (Feminino, claro e doce)
                  </option>
                </select>
                <p className="text-[10px] text-gray-400 mt-2 italic">
                  Aviso: A velocidade e o tom não podem ser alterados na voz da
                  IA.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-8">
            <Button
              variant="secondary"
              onClick={handleTest}
              className="flex-1 py-2 text-xs"
            >
              🔊 Testar (Só Navegador)
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1 py-2"
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
