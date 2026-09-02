import type { Metadata } from "next";
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
