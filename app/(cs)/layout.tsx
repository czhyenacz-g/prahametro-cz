import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "../config/site.ts";
import { PWA_APPLE_WEB_APP_METADATA, PWA_VIEWPORT } from "../../lib/pwa/config.ts";

// Vlastní root layout pro českou jazykovou routu "/" (viz app/en/layout.tsx
// pro anglický protějšek) — Next.js "multiple root layouts" vzorec:
// každá jazyková route group má vlastní <html lang> (viz zadání), takže
// tenhle soubor NENÍ potomkem žádného sdíleného app/layout.tsx (ten byl
// odstraněný, viz README).
//
// `viewport`/`appleWebApp` musí být (stejně jako `metadataBase` výše) v
// KAŽDÉM ze čtyř root layoutů zvlášť — sdílené hodnoty viz lib/pwa/config.ts.
export const viewport: Viewport = PWA_VIEWPORT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Ověření webu pro affiliate síť Impact (partner Bounce) — jen
  // statický meta tag, nic runtime.
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
  appleWebApp: PWA_APPLE_WEB_APP_METADATA,
};

export default function CsRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
