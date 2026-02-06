import React from 'react';
import { StorySegment } from '../types';

interface JournalProps {
  history: StorySegment[];
  onClose: () => void;
}

const Journal: React.FC<JournalProps> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-quest-card w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📜</span>
            <h3 className="font-retro text-quest-warning text-lg">Diário da Aventura</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 text-xl font-bold">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-quest-dark/50">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 italic mt-10">
              Sua história está apenas começando...
            </p>
          ) : (
            history.map((segment, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-gray-700 pb-8 last:pb-0">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-quest-warning border-4 border-quest-dark"></div>
                
                <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-quest-primary font-mono uppercase">Capítulo {idx + 1}</span>
                    <span className="text-[10px] text-gray-500 bg-black/30 px-2 py-0.5 rounded">
                      {segment.imageKeyword}
                    </span>
                  </div>
                  
                  <p className="text-gray-200 font-serif leading-relaxed mb-3">
                    {segment.content}
                  </p>
                  
                  <div className="text-sm text-gray-400 italic border-l-2 border-quest-primary/30 pl-3">
                    {segment.translation}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;