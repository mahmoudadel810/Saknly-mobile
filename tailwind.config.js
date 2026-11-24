// Same design tokens as Saknly-client (app/globals.css); values live in src/global.css.
const plugin = require('tailwindcss/plugin');

// IBM Plex Sans Arabic (the web app's font), embedded per weight by the expo-font plugin.
// Android can't pick a bold face out of a custom family from fontWeight, so each weight class
// selects its own font file instead. Keep these names in sync with src/theme/fonts.ts.
const FONT_WEIGHTS = {
  '.font-normal': 'IBMPlexSansArabic-Regular',
  '.font-medium': 'IBMPlexSansArabic-Medium',
  '.font-semibold': 'IBMPlexSansArabic-SemiBold',
  '.font-bold': 'IBMPlexSansArabic-Bold',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  corePlugins: { fontWeight: false },
  plugins: [
    plugin(({ addUtilities }) =>
      addUtilities(
        Object.fromEntries(
          Object.entries(FONT_WEIGHTS).map(([cls, family]) => [cls, { fontFamily: family }]),
        ),
      ),
    ),
  ],
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
};
