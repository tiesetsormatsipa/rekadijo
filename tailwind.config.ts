import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#1C2127",
          50: "#F4F5F6",
          100: "#E4E6E8",
          200: "#C6CACE",
          300: "#9EA4AB",
          400: "#6C7480",
          500: "#4A515C",
          600: "#363C45",
          700: "#272C33",
          800: "#1C2127",
          900: "#13161A"
        },
        amber: {
          DEFAULT: "#D97A34",
          50: "#FDF3EA",
          100: "#FAE4CD",
          200: "#F3C69B",
          300: "#ECA869",
          400: "#E28D45",
          500: "#D97A34",
          600: "#B45F24",
          700: "#8A481C",
          800: "#603216",
          900: "#3D200F"
        },
        olive: {
          DEFAULT: "#6E7B4B",
          50: "#F2F4EC",
          100: "#E1E6D1",
          200: "#C4CDA5",
          300: "#A6B379",
          400: "#8A9860",
          500: "#6E7B4B",
          600: "#57613C",
          700: "#41482D",
          800: "#2B301E",
          900: "#181A11"
        },
        cream: {
          DEFAULT: "#FBF7F1",
          100: "#FFFFFF",
          200: "#FBF7F1",
          300: "#F3EBDE"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,33,39,0.04), 0 8px 24px -12px rgba(28,33,39,0.12)",
        cardHover: "0 4px 8px rgba(28,33,39,0.06), 0 16px 32px -12px rgba(28,33,39,0.18)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
