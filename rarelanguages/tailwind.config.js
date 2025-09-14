module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#1e40af',
          600: '#1e3a8a',
          700: '#1d4ed8',
        },
        success: {
          50: '#ecfdf5',
          500: '#059669',
          600: '#047857',
        },
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          600: '#475569',
          900: '#334155',
        },
        accent: {
          500: '#ea580c',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
      }
    },
  },
  plugins: [],
}