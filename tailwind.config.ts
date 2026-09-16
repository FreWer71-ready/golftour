import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        "ink-soft": "var(--color-ink-soft)",
        maroon: {
          DEFAULT: "var(--color-maroon)",
          strong: "var(--color-maroon-strong)",
        },
        gold: {
          DEFAULT: "var(--color-gold)",
          bright: "var(--color-gold-bright)",
        },
        parchment: "var(--color-parchment)",
        paper: "var(--color-paper)",
        fairway: "var(--color-fairway)",
        brown: "var(--color-brown)",
        line: "var(--color-line)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        data: ["var(--font-data)"],
        label: ["var(--font-label)"],
      },
      borderRadius: {
        card: "12px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 4px 10px var(--color-shadow)",
        phone: "0 16px 30px var(--color-shadow)",
      },
    },
  },
  plugins: [],
};

export default config;
