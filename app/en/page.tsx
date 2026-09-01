import type { Metadata } from "next";
import { getSeoContent } from "../../lib/seo/content.ts";
import { buildWebApplicationJsonLd } from "../../lib/seo/structured-data.ts";
import { SITE_URL } from "../config/site.ts";
import HomePage from "../../components/HomePage.tsx";

const seo = getSeoContent("en");

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  alternates: {
    canonical: "/en",
    languages: { cs: "/", en: "/en", "x-default": "/" },
  },
  openGraph: {
    title: seo.title,
    description: seo.description,
    type: "website",
    url: "/en",
    siteName: "KdeJeMetro.cz",
    locale: seo.ogLocale,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  const jsonLd = buildWebApplicationJsonLd({
    locale: "en",
    siteUrl: SITE_URL,
    path: "/en",
    name: "KdeJeMetro.cz",
    description: seo.description,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePage locale="en" />
    </>
  );
}
