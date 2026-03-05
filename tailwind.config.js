/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        "background-light": "#fcfdfe",
        "background-dark": "#0f172a",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
