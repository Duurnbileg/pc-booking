/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0f14",
          900: "#121820",
          800: "#1a2330",
          700: "#243044",
          500: "#6b7c93",
          300: "#b4c0d0",
          100: "#e8eef5",
        },
        accent: {
          DEFAULT: "#3ddc97",
          dim: "#2bb87a",
        },
        status: {
          available: "#3ddc97",
          inuse: "#f5c542",
          reserved: "#ef5b5b",
          offline: "#7a8699",
          maintenance: "#9b7bff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
