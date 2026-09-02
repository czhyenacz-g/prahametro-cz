import type { Metadata } from "next";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "../config/site.ts";

// Vlastní root layout pro anglickou jazykovou routu "/en" — viz
// app/(cs)/layout.tsx pro český protějšek a vysvětlení vzorce
// "multiple root layouts".
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
};

export default function EnRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 bg-[url('/hero-metro.webp')] bg-top bg-no-repeat bg-[length:100%_auto] text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
