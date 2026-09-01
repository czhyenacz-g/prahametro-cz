// Doména zatím není koupená (viz zadání) — SITE_URL se odvozuje
// automaticky z Vercel preview/production URL (VERCEL_URL), ať appka
// funguje beze změny kódu jak teď (jen vercel.app URL), tak později po
// připojení vlastní domény (stačí nastavit NEXT_PUBLIC_SITE_URL).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
