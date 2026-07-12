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
        // Primary Blue brand scale - mapped to gold to prevent layout class breaks
        gold: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',   // brand Primary Blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
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
        'gold-gradient': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        'editorial-hero': 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
