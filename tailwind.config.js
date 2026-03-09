/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E40AF',   // Primary – Trust / Education
          green: '#16A34A',  // Success / Growth
          orange: '#F59E0B', // CTA / Action
          dark: '#0F172A',   // Headings / Strong text
          muted: '#475569',  // Normal text
          light: '#F8FAFC',  // Section backgrounds
        },
      },
    },
  },
  plugins: [],
};
