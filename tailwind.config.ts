import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#0a1120'
        },
        accent: {
          DEFAULT: '#06b6d4',
          hover: '#0ea5e9'
        },
        border: {
          DEFAULT: '#1e293b',
          light: '#263548'
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#475569'
        },
        status: {
          success: '#4ade80',
          warning: '#facc15',
          danger: '#f87171'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
} satisfies Config
