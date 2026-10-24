/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#F7F6F0',
          pure: '#FFFFFF',
          tint: '#EFEFE8',
        },
        ink: {
          DEFAULT: '#202821',
          light: '#3A443B',
        },
        forest: {
          DEFAULT: '#245C46',
          dark: '#1A4333',
          light: '#2E7559',
          tint: 'rgba(36, 92, 70, 0.08)',
        },
        rust: {
          DEFAULT: '#B96745',
          dark: '#9E5233',
          light: '#CF7D5B',
          tint: 'rgba(185, 103, 69, 0.10)',
        },
        muted: {
          DEFAULT: '#777A70',
          light: '#9DA096',
          faint: '#B8BAB2',
        },
        rule: {
          DEFAULT: '#DFDED5',
          dark: '#CBC9BF',
        }
      }
    },
  },
  plugins: [],
}
