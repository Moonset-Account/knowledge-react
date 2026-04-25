/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-hover': '#1d4ed8',
        'primary-light': '#3b82f6',
        secondary: '#64748b',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#f8fafc',
        surface: '#ffffff',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        border: '#e2e8f0',
      },
    },
  },
  plugins: [],
};
