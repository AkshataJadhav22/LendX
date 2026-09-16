/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kikin-inspired LendX palette
        forest: {
          black: '#122315',
          deep: '#0B3B2E',
        },
        neon: {
          green: '#55DD4A',
          soft: '#77E46E',
        },
        lime: '#D8FF62',
        sky: '#73D3EB',
        cream: {
          DEFAULT: '#F3EDE4',
          soft: '#F4F1E8',
          white: '#FDFCFB',
        },
        muted: {
          green: '#566053',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(3.5rem, 8vw, 7rem)', { lineHeight: '0.95', fontWeight: '900' }],
        'section': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.0', fontWeight: '800' }],
        'feature': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.15', fontWeight: '700' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'score-fill': 'scoreFill 1.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        scoreFill: { from: { 'stroke-dashoffset': 251 }, to: { 'stroke-dashoffset': 0 } },
      },
      boxShadow: {
        'card': '0 4px 24px rgba(18, 35, 21, 0.08)',
        'card-hover': '0 12px 40px rgba(18, 35, 21, 0.16)',
        'neon': '0 0 24px rgba(85, 221, 74, 0.4)',
        'neon-lg': '0 0 48px rgba(85, 221, 74, 0.3)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #122315 0%, #0B3B2E 50%, #122315 100%)',
        'neon-gradient': 'linear-gradient(135deg, #55DD4A, #D8FF62)',
        'card-gradient': 'linear-gradient(135deg, #FDFCFB, #F4F1E8)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
      maxWidth: {
        'content': '1280px',
      },
    },
  },
  plugins: [],
}
