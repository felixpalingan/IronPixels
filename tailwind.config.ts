import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#1C1C1E",
        "surface-container": "#201f1f",
        "surface-high": "#2a2a2a",
        "pixel-border": "#48484A",
        "pixel-green": "#00ff41",
        "pixel-green-glow": "#00e639",
        "exp-blue": "#0A84FF",
        "gold-loot": "#FFD60A",
        "health-red": "#ff3b30",
        "mana-purple": "#e9b3ff",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        headline: ["var(--font-space)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-hanken)", "Hanken Grotesk", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 10px rgba(0, 255, 65, 0.4)",
        "neon-strong": "0 0 20px rgba(0, 255, 65, 0.7)",
        "gold-glow": "0 0 10px rgba(255, 214, 10, 0.4)",
        "blue-glow": "0 0 10px rgba(10, 132, 255, 0.4)",
        "red-glow": "0 0 10px rgba(255, 59, 48, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
