/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",   // todas tus páginas Next.js
    "./components/**/*.{js,ts,jsx,tsx}", // todos tus componentes
    "./app/**/*.{js,ts,jsx,tsx}", // si usas App Router en lugar de Pages Router
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}