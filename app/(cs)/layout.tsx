import type { Metadata } from "next";
import Image from "next/image";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "../config/site.ts";

// Vlastní root layout pro českou jazykovou routu "/" (viz app/en/layout.tsx
// pro anglický protějšek) — Next.js "multiple root layouts" vzorec:
// každá jazyková route group má vlastní <html lang> (viz zadání), takže
// tenhle soubor NENÍ potomkem žádného sdíleného app/layout.tsx (ten byl
// odstraněný, viz README).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Ověření webu pro affiliate síť Impact (partner Bounce) — jen
  // statický meta tag, nic runtime.
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
};

export default function CsRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
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
