import type { Metadata } from "next";
import { TICKETS_PATH, TICKETS_SEO } from "../../../lib/tickets/tariff.ts";
import { buildBreadcrumbListJsonLd } from "../../../lib/seo/structured-data.ts";
import { SITE_URL } from "../../config/site.ts";
import TicketsPage from "../../../components/tickets/TicketsPage.tsx";

// Jen BreadcrumbList — žádné Product/Offer (KdeJeMetro jízdenky neprodává)
// ani FAQPage.
export const metadata: Metadata = {
  title: { absolute: TICKETS_SEO.title },
  description: TICKETS_SEO.description,
  alternates: { canonical: TICKETS_PATH },
  openGraph: {
    title: TICKETS_SEO.title,
    description: TICKETS_SEO.description,
    type: "website",
    url: TICKETS_PATH,
    siteName: "KdeJeMetro.cz",
    locale: "cs_CZ",
  },
  twitter: { card: "summary_large_image", title: TICKETS_SEO.title, description: TICKETS_SEO.description },
  robots: { index: true, follow: true },
};

export default function Page() {
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    [
      { name: "KdeJeMetro.cz", path: "/" },
      { name: "Jízdenky", path: TICKETS_PATH },
    ],
    SITE_URL
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <TicketsPage />
    </>
  );
}
