/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        romantic: {
          50: '#fff5f6',
          100: '#ffebeb',
          200: '#ffced5',
          300: '#ffa1ae',
          400: '#ff697e',
          500: '#f43f5e', // Rose core
          600: '#e11d48',
          700: '#be123c',
          cream: '#fffdfa',
          ivory: '#faf6f0',
          gold: '#dfb76c',
          bronze: '#8c6d31',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        cursive: ['"Dancing Script"', '"Great Vibes"', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'heart-beat': 'heartBeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '40%': { transform: 'scale(1.05)' },
          '60%': { transform: 'scale(1.15)' },
        }
      }
    },
  },
  plugins: [],
}
