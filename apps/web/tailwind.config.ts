import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Crimson Pro", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      colors: {
        cream: "hsl(42 54% 90%)",
        "cream-hi": "hsl(44 60% 92%)",
        ink: "hsl(25 42% 12%)",
        ocre: "hsl(21 71% 45%)",
        "ocre-hi": "hsl(23 65% 50%)",
        vert: "hsl(93 34% 30%)",
        amber: "hsl(37 64% 54%)",
        sienna: "hsl(18 65% 39%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "trame-ocre": "repeating-linear-gradient(90deg, hsl(21 71% 45% / 0.05) 0px, transparent 1px, transparent 24px)",
      },
    },
  },
  plugins: [],
};

export default config;
