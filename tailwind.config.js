/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#0A0A14',
          base: '#0F0F1A',
          card: '#1A1A2E',
          hover: '#222238',
          border: '#2D2D4E',
        },
        primary: {
          DEFAULT: '#7C3AED',
          light: '#8B5CF6',
          dark: '#6D28D9',
          muted: '#3D1F78',
        },
        accent: {
          pink: '#EC4899',
          amber: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
          blue: '#3B82F6',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pet-idle': 'petIdle 3s ease-in-out infinite',
        'pet-happy': 'petHappy 0.6s ease-in-out infinite',
        'pet-excited': 'petExcited 0.5s ease-in-out infinite',
        'pet-tired': 'petTired 4s ease-in-out infinite',
        'pet-sad': 'petSad 2s ease-in-out infinite',
        'pet-focused': 'petFocused 4s ease-in-out infinite',
        'pet-celebrating': 'petCelebrating 0.4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        petIdle: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        petHappy: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '30%': { transform: 'translateY(-20px) scale(1.05)' },
          '60%': { transform: 'translateY(-10px) scale(1.02)' },
        },
        petExcited: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-25px) rotate(-8deg)' },
          '75%': { transform: 'translateY(-25px) rotate(8deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        petTired: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        petSad: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        petFocused: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        petCelebrating: {
          '0%, 100%': { transform: 'translateY(0) scale(1) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) scale(1.1) rotate(5deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
