import type { Locale } from "../i18n/types.ts";
import type { FaqItem } from "./content.ts";

export type WebApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  inLanguage: Locale;
};

/**
 * Jen ověřitelné údaje (viz zadání) — žádné hodnocení, počet recenzí,
 * cena, autor ani organizace, protože appka nic takového nemá. `url` je
 * vždy absolutní (schema.org to vyžaduje), postavená nad `siteUrl`
 * (typicky `SITE_URL` z app/config/site.ts), ne natvrdo zapsaná
 * doména — funguje tak správně i v preview prostředí.
 */
export function buildWebApplicationJsonLd(params: { locale: Locale; siteUrl: string; path: string; name: string; description: string }): WebApplicationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: params.name,
    url: new URL(params.path, params.siteUrl).toString(),
    description: params.description,
    applicationCategory: "TravelApplication",
    operatingSystem: "Any",
    inLanguage: params.locale,
  };
}

export type FaqPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }[];
};

/**
 * Postavené PŘÍMO nad stejným polem `FaqItem[]`, které vykresluje
 * viditelné FAQ (viz components/seo/SeoContent.tsx) — strukturovaná
 * data tak nikdy neujedou od toho, co uživatel skutečně vidí (viz
 * zadání "musí přesně odpovídat viditelnému FAQ").
 */
export type BreadcrumbListJsonLd = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: { "@type": "ListItem"; position: number; name: string; item: string }[];
};

/** Homepage -> noční sekce (zadání bod 20) — vždy jen ověřitelné, existující stránky/absolutní URL, žádné vymyšlené úrovně. */
export function buildBreadcrumbListJsonLd(items: readonly { name: string; path: string }[], siteUrl: string): BreadcrumbListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: new URL(item.path, siteUrl).toString() })),
  };
}

export function buildFaqPageJsonLd(items: readonly FaqItem[]): FaqPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
