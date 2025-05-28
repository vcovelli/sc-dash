/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
      boxShadow: {
        right: '4px 0 6px -4px rgba(0, 0, 0, 0.6)',
      },
    },
  plugins: [],
};
