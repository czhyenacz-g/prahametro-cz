import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStationGuide, STATION_GUIDES, STATIONS_PATH, stationGuidePath } from "../../../../lib/stations/guides.ts";
import { buildBreadcrumbListJsonLd } from "../../../../lib/seo/structured-data.ts";
import { SITE_URL } from "../../../config/site.ts";
import StationGuidePage from "../../../../components/stations/StationGuidePage.tsx";

// Jen osm pilotních průvodců (lib/stations/guides.ts) — jiný slug je 404,
// žádné automatické stránky pro zbytek stanic.
export const dynamicParams = false;

export function generateStaticParams() {
  return STATION_GUIDES.map((guide) => ({ slug: guide.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getStationGuide((await params).slug);
  if (!guide) return {};
  const path = stationGuidePath(guide.slug);

  return {
    // Celý title je v konfiguraci včetně značky — `absolute`, ať se nic nepřipojuje.
    title: { absolute: guide.seoTitle },
    description: guide.seoDescription,
    alternates: { canonical: path },
    openGraph: {
      title: guide.seoTitle,
      description: guide.seoDescription,
      type: "website",
      url: path,
      siteName: "KdeJeMetro.cz",
      locale: "cs_CZ",
    },
    twitter: { card: "summary_large_image", title: guide.seoTitle, description: guide.seoDescription },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const guide = getStationGuide((await params).slug);
  if (!guide) notFound();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    [
      { name: "KdeJeMetro.cz", path: "/" },
      { name: "Průvodce stanicemi", path: STATIONS_PATH },
      { name: guide.name, path: stationGuidePath(guide.slug) },
    ],
    SITE_URL
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <StationGuidePage guide={guide} />
    </>
  );
}
