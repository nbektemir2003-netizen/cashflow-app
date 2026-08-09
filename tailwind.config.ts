import type { Config } from 'tailwindcss'
import path from 'path'

// Absolute paths: Tailwind resolves relative globs against process.cwd(), which
// doesn't always match this project's directory (e.g. when the dev server is
// launched with an explicit project-dir argument from a different cwd).
const config: Config = {
  darkMode: 'class',
  content: [
    path.join(__dirname, 'pages/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, 'components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, 'app/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(110%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
