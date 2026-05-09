import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          50: "#e9fff5",
          400: "#2de88a",
          700: "#0d6b45",
          850: "#07412f",
          950: "#031f18"
        },
        brass: "#e2b85f",
        ink: "#07110e"
      },
      boxShadow: {
        card: "0 12px 30px rgba(0,0,0,.26)",
        glow: "0 0 24px rgba(45,232,138,.34)"
      }
    }
  },
  plugins: []
};

export default config;
