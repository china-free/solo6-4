/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f5fa',
          100: '#dae4ef',
          200: '#b8c9de',
          300: '#8aa8c7',
          400: '#5883ab',
          500: '#396892',
          600: '#2b5376',
          700: '#24435f',
          800: '#1e3a5f',
          900: '#1a3352',
          950: '#102137',
        },
        accent: {
          50: '#faf6ec',
          100: '#f2e9d1',
          200: '#e5d2a1',
          300: '#d6b76b',
          400: '#c9a962',
          500: '#b89244',
          600: '#9d7737',
          700: '#7e5c2e',
          800: '#694c2b',
          900: '#593f28',
        },
        warm: {
          50: '#fbfaf7',
          100: '#f5f2eb',
          200: '#e9e2d3',
          300: '#d9ceb5',
          400: '#c6b694',
          500: '#b39e73',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
