/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tablu brand (platform surfaces) — from Brand Guide 2025
        "tablu-orange": "#F25623",
        "tablu-black": "#171717",
        "tablu-gray": "#4D4D4D",
        "tablu-light": "#DEDEDE",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Brand guide radius scale
        micro: "4px",
        small: "8px",
        med: "12px",
        large: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
};
