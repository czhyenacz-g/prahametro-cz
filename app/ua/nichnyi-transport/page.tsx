import type { Metadata } from "next";
import { getNightSeoContent } from "../../../lib/seo/night-content.ts";
import { buildBreadcrumbListJsonLd, buildWebApplicationJsonLd } from "../../../lib/seo/structured-data.ts";
import { SITE_URL } from "../../config/site.ts";
import NightPage from "../../../components/night/NightPage.tsx";

const seo = getNightSeoContent("uk");
const PATH = "/ua/nichnyi-transport";

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: PATH,
    languages: { cs: "/nocni-mhd", en: "/en/night-transport", de: "/de/nachtverkehr", uk: "/ua/nichnyi-transport", "x-default": "/en/night-transport" },
  },
  openGraph: {
    title: seo.title,
    description: seo.description,
    type: "website",
    url: PATH,
    siteName: "KdeJeMetro.cz",
    locale: seo.ogLocale,
  },
  twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  robots: { index: true, follow: true },
};

export default function Page() {
  const jsonLd = buildWebApplicationJsonLd({ locale: "uk", siteUrl: SITE_URL, path: PATH, name: "KdeJeMetro.cz – Нічний транспорт", description: seo.description });
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    [
      { name: "KdeJeMetro.cz", path: "/ua" },
      { name: seo.mainHeading, path: PATH },
    ],
    SITE_URL
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <NightPage locale="uk" />
    </>
  );
}
