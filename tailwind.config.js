/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F59E0B',
        light: '#FEF3C7',
        accent: '#FCD34D',
      },
    },
  },
  plugins: [],
}
