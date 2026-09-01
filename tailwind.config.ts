import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Barvy linek (LINE_BADGE_CLASS) jsou definované v lib/, ne v
    // components/ — bez tohohle by je Tailwindův statický scanner
    // nikdy neviděl a utility třídy by se nevygenerovaly.
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "přibližně" barvy linek (viz zadání) — vlastní paleta, ne
        // přesné DPP barvy. Žlutá (B) je tmavší/sytější, aby s ní šel
        // použít tmavý text s dostatečným kontrastem (WCAG AA).
        metro: {
          a: "#1E8E3E",
          b: "#F4B400",
          c: "#D93025",
          d: "#6B4FBB",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
