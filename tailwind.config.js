/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        brand: {
          cyan:   "#4fc3f7",
          "cyan-deep": "#0ea5e9",
          blue:   "#3b5bdb",
          indigo: "#4c6ef5",
          violet: "#7c3aed",
        },
      },
    },
  },
  plugins: [],
};
