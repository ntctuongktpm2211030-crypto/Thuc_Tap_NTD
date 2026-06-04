/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Interactive brand blue
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#0c1a26',
        },
        // Warm gold accent — luxury travel editorial
        gold: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#e8b86d',   // brand gold
          600: '#c99b50',
          700: '#a37928',
          800: '#875d1e',
          900: '#713f12',
        },
        // Editorial surface scale
        surface: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1e1e1e',
          600: '#252525',
          500: '#2a2a2a',
          400: '#383838',
        },
        // Warm cream text
        cream: '#f5f0e8',
      },
      fontFamily: {
        editorial: ['Playfair Display', 'Georgia', 'serif'],
        ui:        ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans:      ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeInUp 0.4s ease forwards',
        'shimmer':    'shimmer 1.5s infinite',
        'ping-slow':  'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #e8b86d, #c99b50)',
        'editorial-hero': 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
