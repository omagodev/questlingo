import React, { useState, useEffect } from 'react';
import { AudioSettings } from '../types';
import Button from './Button';
import { getEnglishVoices, speakText } from '../services/audioService';

interface SettingsModalProps {
  currentSettings: AudioSettings;
  onSave: (settings: AudioSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
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
          <h3 className="font-retro text-quest-primary text-lg">Configurações</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-xl">✕</button>
        </div>

        <div className="space-y-6">
          
          {/* Voice Selector */}
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Voz do Narrador (Inglês)</label>
            <select
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
              value={settings.voiceURI || ''}
              onChange={(e) => setSettings({ ...settings, voiceURI: e.target.value || null })}
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
              <label className="text-gray-300 font-bold">Velocidade da Fala</label>
              <span className="text-quest-accent">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) => setSettings({ ...settings, speechRate: parseFloat(e.target.value) })}
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
              onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-quest-warning"
            />
          </div>

          <div className="flex gap-3 mt-8">
             <Button variant="secondary" onClick={handleTest} className="flex-1 py-2 text-xs">
                🔊 Testar
             </Button>
             <Button variant="primary" onClick={handleSave} className="flex-1 py-2">
                Salvar
             </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;