import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Researcher-focused black & white palette
        primary: '#000000',       // Pure black for primary actions
        secondary: '#1a1a1a',     // Dark gray for secondary elements
        accent: '#333333',        // Medium gray for accents
        warning: '#666666',       // Gray for warnings (not alarming)
        danger: '#000000',        // Black for errors (professional)
        background: '#ffffff',    // Pure white background
        panel: '#f5f5f5',         // Light gray for panels
        border: '#e0e0e0',        // Subtle gray borders
        text: {
          primary: '#000000',     // Black text
          secondary: '#666666',   // Gray text
          muted: '#999999',       // Light gray text
        },
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        'research': '14px',      // Optimal for reading research content
        'data': '12px',          // For data tables
      },
    },
  },
  plugins: [],
}
export default config
