import type { Metadata } from "next";
import { STATIONS_PATH } from "../../../lib/stations/guides.ts";
import { buildBreadcrumbListJsonLd } from "../../../lib/seo/structured-data.ts";
import { SITE_URL } from "../../config/site.ts";
import StationsOverviewPage, { STATIONS_OVERVIEW_SEO } from "../../../components/stations/StationsOverviewPage.tsx";

export const metadata: Metadata = {
  title: { absolute: STATIONS_OVERVIEW_SEO.title },
  description: STATIONS_OVERVIEW_SEO.description,
  alternates: { canonical: STATIONS_PATH },
  openGraph: {
    title: STATIONS_OVERVIEW_SEO.title,
    description: STATIONS_OVERVIEW_SEO.description,
    type: "website",
    url: STATIONS_PATH,
    siteName: "KdeJeMetro.cz",
    locale: "cs_CZ",
  },
  twitter: { card: "summary_large_image", title: STATIONS_OVERVIEW_SEO.title, description: STATIONS_OVERVIEW_SEO.description },
  robots: { index: true, follow: true },
};

export default function Page() {
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    [
      { name: "KdeJeMetro.cz", path: "/" },
      { name: "Průvodce stanicemi", path: STATIONS_PATH },
    ],
    SITE_URL
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <StationsOverviewPage />
    </>
  );
}
