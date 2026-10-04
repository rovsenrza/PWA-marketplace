/** Tailwind is compiled at build time. Scanning covers the markup and every script that builds HTML strings. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/app/**/*.{js,ts}', './src/shared/**/*.{js,ts}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Onest', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#1e6091', hover: '#18527a', muted: '#e8f1f8' },
        ink: { DEFAULT: '#0f172a', secondary: '#334155', muted: '#64748b', faint: '#94a3b8' },
        surface: { DEFAULT: '#ffffff', page: '#f4f6f8', input: '#f2f2f2', line: '#e2e8f0' },
        accent: { DEFAULT: '#ea580c', hover: '#c2410a' },
        shop: { DEFAULT: '#1c3a34' },
      },
      borderRadius: { card: '16px', sheet: '20px', pill: '9999px' },
    },
  },
  plugins: [],
};
