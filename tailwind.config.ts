import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  "#eef1f7",
          100: "#d5dced",
          200: "#aab9db",
          300: "#7f96c9",
          400: "#5473b7",
          500: "#3a5a9e",
          600: "#2d4780",
          700: "#1b2a4a",
          800: "#12203a",
          900: "#0a1422",
        },
        brand: {
          green: "#2D6A4F",
          light: "#52B788",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
