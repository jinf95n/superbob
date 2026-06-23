import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "sb-blue": "#1A6FE0",
        "sb-orange": "#F5820D",
        "sb-success": "#18A058",
        "sb-error": "#D93026",
        "sb-warning": "#E88A00",
        "sb-info": "#1A6FE0",
        "sb-bg": "#F7F7F5",
        "sb-bg-dark": "#111210",
        "sb-text": "#1A1A18",
        "sb-text-dark": "#F0F0EE",
        "sb-muted": "#5A5A58",
        "sb-muted-dark": "#9A9A98",
        "sb-border": "#E2E2DF",
        "sb-border-dark": "#2E2E2C",
        "sb-section-alt": "#EEF4FD",
        "sb-card-blue": "#EEF4FD",
        "sb-card-orange": "#FEF3E8",
      },
      fontFamily: {
        display: ["var(--font-dm-sans)"],
        sans: ["var(--font-inter)"],
      },
      fontWeight: {
        extrabold: "800",
      },
      borderRadius: {
        DEFAULT: "8px",
        card: "12px",
        "2xl": "16px",
        "3xl": "24px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
