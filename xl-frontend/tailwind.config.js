/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emyris: {
          dark: '#1e293b', // Slate 800
          light: '#f8fafc', // Slate 50
          accent: '#38bdf8', // Light blue
        }
      }
    },
  },
  plugins: [],
}
