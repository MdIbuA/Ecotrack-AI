/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d1',
          300: '#86efad',
          400: '#4ade81',
          500: '#00d97e', // Vibrant Eco Mint Green
          600: '#00b568',
          700: '#008f51',
          800: '#007340',
          900: '#055933',
          950: '#02301a',
        },
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed', // Electric Cyber Violet
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
          950: '#1d003b',
        },
        dark: {
          50: '#f4f7f6',
          100: '#e7edeb',
          200: '#ccdcd7',
          300: '#a2c0b7',
          400: '#709a8e',
          500: '#507c70',
          600: '#3d6056',
          700: '#304c44',
          800: '#1d2f2a', // Deep Forest Charcoal
          900: '#0f1a17',
          950: '#070e0c', // Dark Jungle Night
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
