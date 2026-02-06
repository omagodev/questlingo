import React, { useState, useEffect } from 'react';
import { Challenge } from '../types';
import Button from './Button';
import { playSfx } from '../services/audioService';

interface ChallengeModalProps {
  challenge: Challenge;
  onSolve: (success: boolean) => void;
  onClose: () => void; // Only available if user wants to retreat (if implemented) or after solve
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ challenge, onSolve }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when challenge changes
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
  }, [challenge]);

  const handleSelect = (idx: number) => {
    if (!submitted) {
      playSfx('CLICK');
      setSelected(idx);
    }
  };

  const handleSubmit = () => {
    if (selected === null) return;
    
    const correct = selected === challenge.correctIndex;
    setIsCorrect(correct);
    setSubmitted(true);
    
    // Auto close after delay if correct
    if (correct) {
      setTimeout(() => {
        onSolve(true);
      }, 2500);
    }
  };

  const handleIncorrectContinue = () => {
    // Take damage logic is handled in parent via onSolve(false)
    playSfx('CLICK');
    onSolve(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-quest-card w-full max-w-lg rounded-2xl shadow-2xl border-2 border-quest-accent p-6 flex flex-col relative max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-retro text-quest-accent text-lg">Desafio: {challenge.type}</h3>
          <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
            +XP se acertar
          </div>
        </div>

        <p className="text-xl text-white font-medium mb-8 text-center leading-relaxed">
          {challenge.question}
        </p>

        <div className="space-y-3 mb-6">
          {challenge.options.map((opt, idx) => {
            let btnClass = "w-full p-4 rounded-lg text-left transition-all border-2 ";
            
            if (submitted) {
               if (idx === challenge.correctIndex) {
                 btnClass += "bg-green-900/50 border-green-500 text-green-100";
               } else if (idx === selected && selected !== challenge.correctIndex) {
                 btnClass += "bg-red-900/50 border-red-500 text-red-100 opacity-60";
               } else {
                 btnClass += "border-gray-700 bg-gray-800 opacity-50";
               }
            } else {
               if (selected === idx) {
                 btnClass += "border-quest-primary bg-blue-900/30 text-white";
               } else {
                 btnClass += "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300";
               }
            }

            return (
              <button 
                key={idx}
                onClick={() => handleSelect(idx)}
                className={btnClass}
                disabled={submitted}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center text-xs mr-3 font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </div>
              </button>
            );
          })}
        </div>

        {submitted ? (
          <div className="animate-fade-in">
            <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              <p className={`font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correto!' : 'Incorreto!'}
              </p>
              <p className="text-sm text-gray-300">{challenge.explanation}</p>
            </div>
            {!isCorrect && (
              <Button onClick={handleIncorrectContinue} variant="secondary" fullWidth>
                Continuar (Perder Vida)
              </Button>
            )}
          </div>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="primary" 
            fullWidth 
            disabled={selected === null}
          >
            Verificar Resposta
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChallengeModal;