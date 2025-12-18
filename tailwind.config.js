/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cemedis': {
          50: '#e6f2f5',
          100: '#cce5eb',
          200: '#99ccd7',
          300: '#66b2c3',
          400: '#3399af',
          500: '#004B63',
          600: '#003d51',
          700: '#002f3f',
          800: '#00212d',
          900: '#00131b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
