import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fuel: {
          bg:       '#0A0B1A',
          card:     '#0F1629',
          border:   '#1E2A45',
          cyan:     '#00E5FF',
          orange:   '#FF6B35',
          purple:   '#7B2FBE',
          'cyan-dim':   '#00E5FF33',
          'orange-dim': '#FF6B3533',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        'hero-glow':    'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,255,0.12) 0%, transparent 60%)',
        'orange-glow':  'radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255,107,53,0.10) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
