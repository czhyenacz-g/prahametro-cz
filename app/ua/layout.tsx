import type { Metadata } from "next";
import Image from "next/image";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "../config/site.ts";

// Vlastní root layout pro ukrajinskou jazykovou routu "/ua" — viz
// app/(cs)/layout.tsx pro vysvětlení vzorce "multiple root layouts".
// URL segment je "ua" (kód země), ale <html lang> MUSÍ být "uk" (ISO
// 639-1 kód jazyka) — viz lib/i18n/types.ts routeToLocale a zadání.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
};

export default function UaRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/* Banner v normálním toku dokumentu (ne pozadí <body>) — jako
            pozadí by ho hustý obsah hned pod hlavičkou (CTA karta bez
            mezery) prakticky celý zakryl, viz oprava hlášené chyby
            "není vidět pozadí". Čistě dekorativní, bez ořezu (w-full
            h-auto zachová poměr stran 1774:887). */}
        <Image src="/hero-metro.webp" alt="" width={1774} height={887} priority className="h-auto w-full" />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
