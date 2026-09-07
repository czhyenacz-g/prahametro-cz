import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "../config/site.ts";
import { PWA_APPLE_WEB_APP_METADATA, PWA_VIEWPORT } from "../../lib/pwa/config.ts";

// Vlastní root layout pro ukrajinskou jazykovou routu "/ua" — viz
// app/(cs)/layout.tsx pro vysvětlení vzorce "multiple root layouts" a
// proč jsou viewport/appleWebApp duplikované.
// URL segment je "ua" (kód země), ale <html lang> MUSÍ být "uk" (ISO
// 639-1 kód jazyka) — viz lib/i18n/types.ts routeToLocale a zadání.
export const viewport: Viewport = PWA_VIEWPORT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
  appleWebApp: PWA_APPLE_WEB_APP_METADATA,
};

export default function UaRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
