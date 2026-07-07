/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      colors: {
        primary: {
          50:  colors.rose[50],
          100: colors.rose[100],
          200: colors.rose[200],
          300: colors.rose[300],
          400: colors.rose[400],
          500: colors.rose[500],
          600: colors.rose[600],
          700: colors.rose[700],
          800: colors.rose[800],
          900: colors.rose[900],
          950: colors.rose[950],
          DEFAULT: colors.rose[500],
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
        'modal': '0 20px 60px rgba(15, 23, 42, 0.15)',
      },
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      transitionTimingFunction: {
        'ease-out-cubic': 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
      },
      animation: {
        'fade-in': 'fadeIn 250ms ease-out forwards',
        'slide-up': 'slideUp 300ms cubic-bezier(0.33, 1, 0.68, 1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
