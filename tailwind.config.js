/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5fa',
          100: '#e1e8f3',
          200: '#c4d1e6',
          300: '#97aed2',
          400: '#6584b9',
          500: '#43639f',
          600: '#324d83',
          700: '#283e6a',
          800: '#1c2c4d',
          900: '#121e36',
          950: '#0a1224',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f5edd5',
          200: '#ead9a9',
          300: '#dec077',
          400: '#d3a952',
          500: '#c5933a',
          600: '#a9762f',
          700: '#885a29',
          800: '#714a28',
          900: '#5f3f25',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(10, 18, 36, 0.25)',
        gold: '0 8px 24px -8px rgba(197, 147, 58, 0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease-out both',
      },
    },
  },
  plugins: [],
}
