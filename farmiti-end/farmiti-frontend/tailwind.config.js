export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0D3320',
        'forest-mid': '#1A5C38',
        'forest-light': '#2E7D52',
        sage: '#6BBF8E',
        cream: '#F5F7F2',
        'cream-dark': '#ECF0E8',
        parchment: '#FEFCF6',
        gold: '#E8A020',
        'gold-light': '#FDF3E0',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 24px rgba(0,0,0,0.06)',
        'card-lg': '0 12px 48px rgba(0,0,0,0.12)',
        glow: '0 0 32px rgba(26,92,56,0.22)',
        'glow-gold': '0 0 24px rgba(232,160,32,0.30)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}