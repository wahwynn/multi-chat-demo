import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'base': '16px',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["cupcake", "business"],
    darkTheme: "business",
    base: true,
    styled: true,
    utils: true,
  },
};

export default config;
