/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        retro: ['"Press Start 2P"', "cursive"],
      },
      colors: {
        quest: {
          dark: "#1a1b26",
          card: "#24283b",
          primary: "#7aa2f7",
          accent: "#bb9af7",
          success: "#9ece6a",
          danger: "#f7768e",
          warning: "#e0af68",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "bounce-slow": "bounce 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
