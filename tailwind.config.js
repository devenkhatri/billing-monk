/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dynamic color system using CSS custom properties
        primary: {
          50: 'var(--color-primary-light, #eff6ff)',
          100: 'var(--color-primary-light, #dbeafe)',
          200: 'var(--color-primary-light, #bfdbfe)',
          300: 'var(--color-accent, #93c5fd)',
          400: 'var(--color-accent, #60a5fa)',
          500: 'var(--color-primary, #3b82f6)',
          600: 'var(--color-primary, #2563eb)',
          700: 'var(--color-primary-dark, #1d4ed8)',
          800: 'var(--color-primary-dark, #1e40af)',
          900: 'var(--color-primary-dark, #1e3a8a)',
          950: 'var(--color-primary-dark, #172554)',
        },
        accent: {
          50: 'var(--color-primary-light, #eff6ff)',
          100: 'var(--color-primary-light, #dbeafe)',
          200: 'var(--color-primary-light, #bfdbfe)',
          300: 'var(--color-accent, #93c5fd)',
          400: 'var(--color-accent, #60a5fa)',
          500: 'var(--color-accent, #3b82f6)',
          600: 'var(--color-primary, #2563eb)',
          700: 'var(--color-primary-dark, #1d4ed8)',
          800: 'var(--color-primary-dark, #1e40af)',
          900: 'var(--color-primary-dark, #1e3a8a)',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      backgroundColor: {
        'theme': 'var(--color-background, #f8fafc)',
        'theme-dark': 'var(--color-background-dark, #0f172a)',
        'dark': '#0f172a',
        'dark-card': '#1e293b',
        'dark-hover': '#334155',
      },
      textColor: {
        'dark': '#f1f5f9',
        'dark-secondary': '#cbd5e1',
      },
      borderColor: {
        'dark': '#334155',
      },
    },
  },
  plugins: [],
}