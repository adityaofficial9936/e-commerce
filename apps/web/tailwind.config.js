/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        blush: '#F3DDD6',
        champagne: {
          DEFAULT: '#C9A66B',
          light: '#E2CA9B',
          dark: '#A37E3E',
        },
        charcoal: {
          DEFAULT: '#1C1B1A',
          light: '#2D2B29',
          muted: '#52504D',
        },
        rose: {
          DEFAULT: '#D88C9A',
          light: '#F8ECEE',
          dark: '#B76676',
        },
        brand: {
          50: '#FAF7F2',
          100: '#F3DDD6',
          500: '#C9A66B',
          600: '#A37E3E',
          700: '#1C1B1A',
          900: '#1C1B1A',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'soft': '10px',
        'soft-lg': '14px',
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(28, 27, 26, 0.05)',
        'luxury': '0 10px 30px -4px rgba(201, 166, 107, 0.12)',
      },
    },
  },
  plugins: [],
};
