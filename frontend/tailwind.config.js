/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A1A2A',
          700: '#243B53',
          500: '#52667A',
          300: '#A7B4C2',
        },
        line: '#E2E8EF',
        surface: '#F5F7FA',
        card: '#FFFFFF',
        primary: {
          900: '#06383B',
          800: '#094C50',
          700: '#0B5F63',
          600: '#0E7378',
          100: '#D9F0EF',
        },
        accent: {
          500: '#E8A317',
        },
        status: {
          submitted: '#64748B',
          'under-review': '#2F6FDE',
          accepted: '#0E7378',
          rejected: '#C2410C',
          assigned: '#0369A1',
          'on-the-way': '#B45309',
          'in-progress': '#A16207',
          done: '#4D7C0F',
          verified: '#15803D',
          closed: '#475569',
          reopened: '#BE123C',
        },
        priority: {
          low: '#64748B',
          medium: '#2F6FDE',
          high: '#D97706',
          critical: '#B91C1C',
        },
        semantic: {
          success: '#15803D',
          warning: '#D97706',
          danger: '#B91C1C',
          info: '#0369A1',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '21px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '29px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['40px', { lineHeight: '48px' }],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        button: '8px',
        badge: '9999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10, 26, 42, 0.06)',
        modal: '0 8px 24px rgba(10, 26, 42, 0.12)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0A1A2A 0%, #0B3B45 55%, #0B5F63 100%)',
        'data-fade': 'linear-gradient(180deg, rgba(14, 115, 120, 0.18) 0%, rgba(14, 115, 120, 0) 100%)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        smooth: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

