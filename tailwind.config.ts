import type { Config } from "tailwindcss";

const oneToOneSpacing = Object.fromEntries(
  Array.from({ length: 401 }, (_, index) => [`${index}`, `${index}px`]),
);

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        ...oneToOneSpacing,
      },
      typography: {
        // Extended typography classes
        "display-2xl-bold": {
          fontSize: "4.5rem",
          fontWeight: "700",
          lineHeight: "1.1",
        },
      },
      colors: {
        // Design system colors will be defined in globals.css
      },
    },
  },
  plugins: [],
};

export default config;
