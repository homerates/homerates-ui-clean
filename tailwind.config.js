/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/*.html",
    "./public/**/*.html",
    "./public/**/*.js",
    "./public/**/*.mjs",
    "./public/**/*.ts",
    "./public/**/*.tsx"
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0F172A", blue: "#0ea5e9", green: "#10b981" }
      }
    }
  },
  plugins: []
}