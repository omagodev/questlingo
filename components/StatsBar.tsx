import React from "react";
import { PlayerState } from "../types";
import { getMediaUrl } from "../services/config";

interface StatsBarProps {
  player: PlayerState;
  onOpenJournal: () => void;
  onSaveGame: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

const StatsBar: React.FC<StatsBarProps> = ({
  player,
  onOpenJournal,
  onSaveGame,
  onOpenSettings,
  onExit,
}) => {
  return (
    <div className="bg-quest-card w-full p-2 md:p-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-md border-b border-gray-800 gap-2 md:gap-0">
      {/* Player Info - Compact on Mobile */}
      <div className="flex items-center space-x-3 w-full md:w-auto overflow-hidden">
        {/* Avatar */}
        <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full border-2 border-quest-accent bg-gray-900 overflow-hidden relative">
          {player.avatarUrl ? (
            <img
              src={getMediaUrl(player.avatarUrl)}
              alt="Hero"
              className="w-full h-full object-cover"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-quest-primary text-quest-dark font-bold">
              {player.name.charAt(0)}
            </div>
          )}
          <span className="absolute bottom-0 right-0 bg-quest-dark text-[8px] px-1 rounded text-white border border-gray-600">
            {player.level}
          </span>
        </div>

        <div className="flex flex-col flex-grow min-w-0 md:w-48">
          <div className="flex justify-between items-end mb-1">
            <span className="text-white font-bold text-sm truncate">
              {player.name}
            </span>
            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
              XP {player.xp}/{player.level * 100}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-quest-accent transition-all duration-500"
              style={{
                width: `${Math.min(100, (player.xp / (player.level * 100)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar - Scrollable on very small screens if needed, or wrapped */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4">
        {/* Stats Row for Mobile (Health & Streak) - Moved here for better mobile layout or kept aside? 
            Let's keep them on the right but ensure they don't break layout.
        */}

        <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={onOpenJournal}
            className="p-2 bg-blue-900/30 text-blue-300 rounded border border-blue-800 hover:bg-blue-800 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-1 flex-shrink-0"
            title="Histórico / Diário"
          >
            <span>📜</span> <span className="hidden sm:inline">Diário</span>
          </button>

          <button
            onClick={onSaveGame}
            className="p-2 bg-green-900/30 text-green-300 rounded border border-green-800 hover:bg-green-800 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-1 flex-shrink-0"
            title="Salvar Jogo"
          >
            <span>💾</span> <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 bg-gray-700/50 text-gray-300 rounded border border-gray-600 hover:bg-gray-600 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-1 flex-shrink-0"
            title="Configurações de Áudio"
          >
            <span>⚙️</span>
          </button>

          <button
            onClick={onExit}
            className="p-2 bg-red-900/30 text-red-300 rounded border border-red-800 hover:bg-red-800 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-1 flex-shrink-0"
            title="Voltar ao Menu"
          >
            <span>🏠</span>
          </button>
        </div>

        {/* Health & Streak */}
        <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
          <div className="flex items-center space-x-1 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 md:w-6 md:h-6 animate-pulse"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span className="font-bold font-retro text-xs md:text-sm">
              {player.health}/{player.maxHealth}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-quest-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                fillRule="evenodd"
                d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-bold font-retro text-xs md:text-sm">
              {player.streak}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
