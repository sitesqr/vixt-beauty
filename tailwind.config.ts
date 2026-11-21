import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Preto sofisticado com Reflexos Champagne
        ink: {
          950: "#10090C",
          900: "#1A1014",
          850: "#24161B",
          800: "#2F1E24",
          700: "#422C33",
          600: "#5A3E46",
        },
        // Rosé gold / Nude / Champagne — identidade VIXT Beauty
        rose: {
          50: "#FFF5F7",
          100: "#FFE4EB",
          200: "#FFC7D6",
          300: "#F7A0B8",
          400: "#EE7998",
          500: "#E0557E",
          600: "#C23B64",
          700: "#A12C51",
          800: "#822545",
          900: "#6B2039",
        },
        champagne: {
          50: "#FFFDF8",
          100: "#FBF3E4",
          200: "#F5E4C4",
          300: "#EED0A0",
          400: "#E4B878",
          500: "#D9A05B",
          600: "#C48745",
          700: "#A86B3A",
          800: "#8A5634",
          900: "#71492F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(224,85,126,.18), 0 12px 40px -12px rgba(224,85,126,.28)",
        card: "0 1px 2px rgba(0,0,0,.35), 0 8px 28px -12px rgba(0,0,0,.55)",
        champagne: "0 0 0 1px rgba(217,160,91,.22), 0 12px 40px -12px rgba(217,160,91,.25)",
      },
      backgroundImage: {
        "rose-gradient": "linear-gradient(135deg, #F7A0B8 0%, #E0557E 50%, #C23B64 100%)",
        "champagne-gradient": "linear-gradient(135deg, #F5E4C4 0%, #D9A05B 50%, #C48745 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in .35s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
