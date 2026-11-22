// Same design tokens as Saknly-client (app/globals.css); values live in src/global.css.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--c-primary)',
          hover: 'var(--c-primary-hover)',
          soft: 'var(--c-primary-soft)',
        },
        'on-primary': 'var(--c-on-primary)',
        secondary: 'var(--c-secondary)',
        bg: 'var(--c-bg)',
        surface: {
          DEFAULT: 'var(--c-surface)',
          2: 'var(--c-surface-2)',
          raised: 'var(--c-surface-raised)',
        },
        border: { DEFAULT: 'var(--c-border)', strong: 'var(--c-border-strong)' },
        text: { DEFAULT: 'var(--c-text)', 2: 'var(--c-text-2)' },
        muted: 'var(--c-muted)',
        success: 'var(--c-success)',
        warning: 'var(--c-warning)',
        error: 'var(--c-error)',
        info: 'var(--c-info)',
        field: 'var(--c-field)',
        accent: { DEFAULT: 'var(--c-accent)', on: 'var(--c-on-accent)' },
      },
    },
  },
  plugins: [],
};
