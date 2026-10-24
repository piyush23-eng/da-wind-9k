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
        chalk: {
          DEFAULT: '#F6F5EF',
          pure: '#FFFFFF',
          subtle: '#EFEFE8',
          tint: '#E8E7DF',
        },
        ink: {
          DEFAULT: '#1C2922',
          light: '#334038',
          soft: '#4A564F',
        },
        forest: {
          DEFAULT: '#245C46',
          dark: '#1A4333',
          light: '#2E7559',
        },
        copper: {
          DEFAULT: '#B96848',
          dark: '#9E5235',
          light: '#CF7D5E',
        },
        muted: {
          DEFAULT: '#777D74',
          light: '#9DA29A',
          faint: '#B8BCB5',
        },
        divider: {
          DEFAULT: '#DDDCD2',
          dark: '#CBC9BE',
        }
      }
    },
  },
  plugins: [],
}
