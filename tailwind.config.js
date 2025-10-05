/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: "#1BAE69",   // HealthLane green
        primaryDark: "#169A5F",
        grayDark: "#1B1B1B",
        grayMid: "#333333",
        grayLight: "#EEEEEE",
        accentOrange: "#FF8800",
        accentYellow: "#FFC900",
        accentBlue: "#0081BF",
        accentRed: "#FF5724",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

    },
  }, 
  plugins: [],
};
