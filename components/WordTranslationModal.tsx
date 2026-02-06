import React from "react";
import { WordTranslation } from "../types";

interface WordTranslationModalProps {
  word: string;
  data: WordTranslation | null;
  position: { x: number; y: number };
  onClose: () => void;
  isLoading: boolean;
}

const WordTranslationModal: React.FC<WordTranslationModalProps> = ({
  word,
  data,
  position,
  onClose,
  isLoading,
}) => {
  // Ensure the modal stays within viewport roughly
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y, window.innerHeight - 200),
  };

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="z-[70] bg-gray-900 border border-quest-accent rounded-xl shadow-2xl p-4 w-72 animate-fade-in"
        style={style}
      >
        <h4 className="text-xl font-serif text-white border-b border-gray-700 pb-2 mb-2 capitalize">
          {word.replace(/[^a-zA-Z0-9'’-]/g, "")}
        </h4>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-quest-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-quest-success font-bold text-lg">
                {data.portuguese}
              </span>
              <span className="text-xs text-gray-400 italic bg-gray-800 px-2 py-0.5 rounded">
                {data.grammarClass}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {data.definition}
            </p>
          </div>
        ) : (
          <p className="text-red-400 text-sm">Erro ao carregar tradução.</p>
        )}
      </div>
    </>
  );
};

export default WordTranslationModal;
