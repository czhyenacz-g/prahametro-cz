import type { Metadata } from "next";
import type { Locale } from "../i18n/types.ts";
import { localeToRoute } from "../i18n/types.ts";
import { buildBreadcrumbListJsonLd } from "../seo/structured-data.ts";
import { getTicketsText } from "./content.ts";
import { TICKETS_HREFLANG, TICKETS_LOCALE_TO_ROUTE } from "./tariff.ts";

/**
 * Metadata stránky jízdenek pro daný jazyk — canonical na vlastní URL,
 * hreflang klastr všech 4 jazyků (x-default = angličtina, jako noční
 * sekce). Strukturovaná data jen BreadcrumbList: žádné Product/Offer
 * (KdeJeMetro jízdenky neprodává) ani FAQPage.
 */
export function buildTicketsMetadata(locale: Locale): Metadata {
  const { seo } = getTicketsText(locale);
  const path = TICKETS_LOCALE_TO_ROUTE[locale];
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: path, languages: TICKETS_HREFLANG },
    openGraph: { title: seo.title, description: seo.description, type: "website", url: path, siteName: "KdeJeMetro.cz", locale: seo.ogLocale },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
    robots: { index: true, follow: true },
  };
}

export function buildTicketsBreadcrumbJsonLd(locale: Locale, siteUrl: string) {
  return buildBreadcrumbListJsonLd(
    [
      { name: "KdeJeMetro.cz", path: localeToRoute[locale] },
      { name: getTicketsText(locale).breadcrumb, path: TICKETS_LOCALE_TO_ROUTE[locale] },
    ],
    siteUrl
  );
}
