
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}", // AGGIUNTO: Scansiona file nella root come App.tsx
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#eef6ff',
          100: '#d9e9ff',
          200: '#bcdaff',
          300: '#8ec3ff',
          400: '#59a1ff',
          500: '#297eff',
          600: '#0060e3', // Brand Blue
          700: '#004db5',
          800: '#004299',
          900: '#063778',
          950: '#04224d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-simple': 'fadeInSimple 0.3s ease-out forwards',
      },
      keyframes: {
        fadeInSimple: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
