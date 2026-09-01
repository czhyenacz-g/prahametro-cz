import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "./config/site.ts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KdeJeMetro.cz — nejbližší vstup do metra",
    template: "%s | KdeJeMetro.cz",
  },
  description: "Jedním klepnutím najdi 2–3 nejbližší vstupy do pražského metra a spusť pěší navigaci.",
  // Jediná canonical doména je kdejemetro.cz (viz zadání) — "/" se
  // vyhodnotí proti `metadataBase` výše, takže je vždy absolutní a vždy
  // ukazuje na SITE_URL, bez ohledu na to, z jakého hostname přišel request.
  alternates: { canonical: "/" },
  // Ověření webu pro affiliate síť Impact (partner Bounce, viz
  // lib/ads/campaigns.ts kampaň luggage-en) — jen statický meta tag,
  // nic runtime.
  other: { "impact-site-verification": "1b45667d-02de-45c2-a0db-46d0fe01fa08" },
};

// Vercel Web Analytics — first-party, cookieless, bez osobních
// identifikátorů (na rozdíl od Google Analytics apod., ke kterým se
// zadání MVP stavělo odmítavě). Zapnuto na výslovný požadavek, ne
// omylem — geolokace/mapa/reklamy zůstávají beze změny.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
