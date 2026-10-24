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
          DEFAULT: '#F6F5EF',
          pure: '#FFFFFF',
          tint: '#EFEFE8',
        },
        ink: {
          DEFAULT: '#1C2922',
          light: '#2E3A33',
          soft: '#4A564F',
        },
        forest: {
          DEFAULT: '#245C46',
          deep: '#142D25',
          dark: '#1A4333',
          light: '#2E7559',
          bright: '#3DD598',
        },
        copper: {
          DEFAULT: '#B96848',
          dark: '#9E5235',
          light: '#CF7D5E',
          bright: '#F97316',
        },
        sage: {
          DEFAULT: '#A9BBAE',
          light: '#C4D1C8',
        },
        muted: {
          DEFAULT: '#777D74',
          light: '#9DA29A',
          faint: '#B8BCB5',
        },
        rule: {
          DEFAULT: '#DDDCD2',
          dark: '#CBC9BE',
        }
      }
    },
  },
  plugins: [],
}
