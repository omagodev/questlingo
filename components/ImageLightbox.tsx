import React, { useEffect, useState } from "react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    setScale((prev) => {
      const newScale = prev - e.deltaY * 0.001;
      return Math.max(0.5, Math.min(4, newScale));
    });
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-200 ${
        isVisible ? "bg-black/90 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors border border-gray-600"
      >
        ✕
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-600">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.max(0.5, s - 0.25));
          }}
          className="text-white hover:text-quest-primary text-lg font-bold transition-colors w-8 h-8 flex items-center justify-center"
        >
          −
        </button>
        <span className="text-gray-400 text-xs font-retro min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.min(4, s + 0.25));
          }}
          className="text-white hover:text-quest-primary text-lg font-bold transition-colors w-8 h-8 flex items-center justify-center"
        >
          +
        </button>
        <div className="w-px h-5 bg-gray-600" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScale(1);
          }}
          className="text-gray-400 hover:text-white text-xs transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt || "Full screen image"}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        className={`max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        style={{
          transform: `scale(${scale})`,
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
        draggable={false}
      />
    </div>
  );
};

export default ImageLightbox;
