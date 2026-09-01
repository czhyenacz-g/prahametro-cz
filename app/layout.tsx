import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "./config/site.ts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KdeJeMetro.cz — nejbližší vstup do metra",
    template: "%s | KdeJeMetro.cz",
  },
  description: "Jedním klepnutím najdi 2–3 nejbližší vstupy do pražského metra a spusť pěší navigaci.",
};

// Žádná analytika/cookies (viz zadání) — jen html/body/globals.css.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
