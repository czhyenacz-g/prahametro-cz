import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "../config/site.ts";
import { PWA_APPLE_WEB_APP_METADATA, PWA_VIEWPORT } from "../../lib/pwa/config.ts";

// Vlastní root layout pro německou jazykovou routu "/de" — viz
// app/(cs)/layout.tsx pro vysvětlení vzorce "multiple root layouts" a
// proč jsou viewport/appleWebApp duplikované.
export const viewport: Viewport = PWA_VIEWPORT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
  appleWebApp: PWA_APPLE_WEB_APP_METADATA,
};

export default function DeRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
