/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: '#FFFFFF',
        border: '#E2E8F0',
        primary: {
          DEFAULT: '#74E0BB',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#293AF9',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#74E0BB',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 0.25rem)',
        sm: 'calc(var(--radius) - 0.5rem)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'gradient-rotate': {
          '0%': { '--gradient-angle': '0deg' },
          '100%': { '--gradient-angle': '360deg' },
        },
        'gradient-base': {
          '0%': {
            '--gradient-pos-1': '0% 0%',
            '--gradient-pos-2': '100% 0%',
            '--gradient-pos-3': '100% 100%',
            '--gradient-pos-4': '0% 100%',
          },
          '20%': {
            '--gradient-pos-1': '0.3% 0.3%',
            '--gradient-pos-2': '99.7% 0.3%',
            '--gradient-pos-3': '99.7% 99.7%',
            '--gradient-pos-4': '0.3% 99.7%',
          },
          '40%': {
            '--gradient-pos-1': '0.6% 0.6%',
            '--gradient-pos-2': '99.4% 0.6%',
            '--gradient-pos-3': '99.4% 99.4%',
            '--gradient-pos-4': '0.6% 99.4%',
          },
          '60%': {
            '--gradient-pos-1': '0.3% 0.3%',
            '--gradient-pos-2': '99.7% 0.3%',
            '--gradient-pos-3': '99.7% 99.7%',
            '--gradient-pos-4': '0.3% 99.7%',
          },
          '80%': {
            '--gradient-pos-1': '0% 0%',
            '--gradient-pos-2': '100% 0%',
            '--gradient-pos-3': '100% 100%',
            '--gradient-pos-4': '0% 100%',
          },
          '100%': {
            '--gradient-pos-1': '0% 0%',
            '--gradient-pos-2': '100% 0%',
            '--gradient-pos-3': '100% 100%',
            '--gradient-pos-4': '0% 100%',
          },
        },
        'gradient-slow': {
          '0%': {
            '--gradient-pos-1': '30% 20%',
            '--gradient-pos-2': '70% 80%',
          },
          '25%': {
            '--gradient-pos-1': '30.3% 20.3%',
            '--gradient-pos-2': '69.7% 79.7%',
          },
          '50%': {
            '--gradient-pos-1': '30.6% 20.6%',
            '--gradient-pos-2': '69.4% 79.4%',
          },
          '75%': {
            '--gradient-pos-1': '30.3% 20.3%',
            '--gradient-pos-2': '69.7% 79.7%',
          },
          '100%': {
            '--gradient-pos-1': '30% 20%',
            '--gradient-pos-2': '70% 80%',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.1)' },
        },
        'orb-float-1': {
          '0%, 100%': { 
            transform: 'translate(0, 0)',
          },
          '50%': { 
            transform: 'translate(1%, 1%)',
          }
        },
        'orb-float-2': {
          '0%, 100%': { 
            transform: 'translate(0, 0)',
          },
          '50%': { 
            transform: 'translate(-1%, 1%)',
          }
        },
        'orb-float-3': {
          '0%, 100%': { 
            transform: 'translate(0, 0)',
          },
          '50%': { 
            transform: 'translate(0.5%, -0.5%)',
          }
        },
        'orb-float-4': {
          '0%, 100%': { 
            transform: 'translate(0, 0)',
          },
          '50%': { 
            transform: 'translate(-0.5%, -0.5%)',
          }
        },
        'orb-float-5': {
          '0%, 100%': { 
            transform: 'translate(0, 0)',
          },
          '50%': { 
            transform: 'translate(0.5%, 0.5%)',
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'gradient-rotate': 'gradient-rotate 120s linear infinite',
        'gradient-base': 'gradient-base 90s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'gradient-slow': 'gradient-slow 60s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'float': 'float 6s ease-in-out infinite',
        'orb-float-1': 'orb-float-1 30s ease-in-out infinite',
        'orb-float-2': 'orb-float-2 35s ease-in-out infinite',
        'orb-float-3': 'orb-float-3 40s ease-in-out infinite',
        'orb-float-4': 'orb-float-4 45s ease-in-out infinite',
        'orb-float-5': 'orb-float-5 50s ease-in-out infinite'
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #74E0BB, #293AF9)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}