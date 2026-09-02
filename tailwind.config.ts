import type { Config } from "tailwindcss";

export default {
  // "class" místo výchozího "media" (zadání bod 13 — přepínač noční
  // sekce musí umět přebít systémové nastavení, ne se jen řídit
  // prefers-color-scheme). Žádná komponenta homepage `dark:` třídu
  // nepoužívá, takže jde o čistě aditivní změnu bez dopadu na homepage.
  darkMode: "class",
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
        // Designové tokeny pro vizuální redesign (viz zadání) — tmavě
        // námořnická pro primární plochy, jemně fialová pro reklamní
        // kartu. Barvy linek metra (metro.*) zůstávají jediným místem,
        // kde barva nese funkční informaci o lince/stavu.
        navy: {
          50: "#F0F3F8",
          700: "#1B2A4A",
          800: "#132038",
          900: "#0D1626",
        },
        "ad-purple": {
          50: "#F7F5FC",
          200: "#E3DAF5",
          700: "#5B4B8A",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
