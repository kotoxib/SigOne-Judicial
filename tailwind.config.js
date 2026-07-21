/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        brand: {
          light:  '#F5F6FA',
          border: '#E5E7EB',
          text:   '#1F2937',
          muted:  '#6B7280',
          orange: '#F47920',
          sidebar:'#1A1F2E',
        },
        orange: {
          DEFAULT: '#F47920',
          50:  '#FFF3E8',
          100: '#FFE4C4',
          200: '#FFCA8A',
          300: '#FFAD50',
          400: '#FF9224',
          500: '#F47920',
          600: '#D4620A',
          700: '#A84800',
          800: '#7C3500',
          900: '#502200',
        },
      },
    },
  },
  plugins: [],
}