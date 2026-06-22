/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Noto Sans JP",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
