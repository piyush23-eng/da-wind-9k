/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        ivory: {
          DEFAULT: '#F5F4ED',
          50: '#FCFBF8',
          100: '#FAF9F5',
          200: '#F0EFE7',
          300: '#E6E4D9',
          border: '#DBD8CA',
          dark: '#E2DFD2',
        },
        forest: {
          DEFAULT: '#245C46',
          dark: '#1A4333',
          light: '#2E7559',
          muted: '#3D8C6E',
        },
        amber: {
          DEFAULT: '#C69A42',
          dark: '#A67F30',
          light: '#D9AF5B',
        },
        signal: {
          DEFAULT: '#D76B42',
          dark: '#B8532D',
          light: '#E5855F',
        },
        charcoal: {
          DEFAULT: '#1C2421',
          light: '#2E3834',
          muted: '#5C6460',
          subtle: '#8A928D',
          faint: '#B4BCB7',
        }
      }
    },
  },
  plugins: [],
}
