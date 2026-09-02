/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iiitp: {
          navy: '#0B1B3D',       // Premium Academic Navy
          burgundy: '#7A1C1C',   // Rich Academic Red
          gold: '#C5A880',       // Accent Gold
          cream: '#F4F2EE',      // Warm off-white
          dark: '#030712',       // Sleek Dark Background
          card: '#0f172a',       // Slate Card
          border: '#334155',     // Slate Border
          lightBorder: '#e2e8f0',// Light Mode Border
          danger: '#dc2626',     // SOS Red
          success: '#16a34a',    // Resolved Green
          warning: '#ea580c',    // Escalation Orange
          info: '#2563eb',       // Inbound Blue
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-danger': '0 0 15px rgba(220, 38, 38, 0.4)',
        'glow-success': '0 0 15px rgba(22, 163, 74, 0.4)',
        'glow-warning': '0 0 15px rgba(234, 88, 12, 0.4)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
