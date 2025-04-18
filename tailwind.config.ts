import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'naskh': ['Noto Naskh Arabic', 'serif'],
        'sans-arabic': ['Noto Sans Arabic', 'sans-serif'],
        'ibm-arabic': ['IBM Plex Sans Arabic', 'sans-serif'],
        'ibm-sans': ['IBM Plex Sans', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'noto': ['Noto Sans', 'sans-serif'],
        'baloo': ['Baloo Bhaijaan 2', 'cursive'],
      },
      colors: {
        'apple-blue': 'var(--apple-blue)',
        'apple-blue-light': 'var(--apple-blue-light)',
        'apple-text': 'var(--apple-text)',
        'apple-secondary-text': 'var(--apple-secondary-text)',
        'apple-bg': 'var(--apple-bg)',
        'apple-bg-secondary': 'var(--apple-bg-secondary)',
        'apple-border': 'var(--apple-border)',
        'apple-gray': 'var(--apple-gray)',
        'apple-light-gray': 'var(--apple-light-gray)',
        'apple-error': 'var(--apple-error)',
        'apple-success': 'var(--apple-success)',
      },
      borderRadius: {
        'apple': '0.75rem',
      },
    },
  },
  plugins: [],
}

export default config 