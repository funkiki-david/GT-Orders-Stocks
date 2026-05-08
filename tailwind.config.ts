import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: '#F7F8FA',
        card: '#FFFFFF',
        header: '#F1F3F4',
        border: '#E0E0E0',
        primaryText: '#202124',
        secondaryText: '#5F6368',
        helperText: '#80868B',
        primaryButton: '#2F3437',
        secondaryButton: '#EEF0F2',
        successBg: '#E6F4EA',
        successText: '#137333',
        warningBg: '#FFF4E5',
        warningText: '#8A5A00',
      },
      fontFamily: {
        title: ['Georgia', 'serif'],
        body: ['Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(60, 64, 67, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
