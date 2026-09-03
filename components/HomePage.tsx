import { getActivePromotionCampaigns } from "../lib/promotions/get-promotions.ts";
import { metroEntrances } from "../lib/metro/load-entrances.ts";
import type { Locale } from "../lib/i18n/types.ts";
import I18nProvider from "./i18n/I18nProvider.tsx";
import AppHeader from "./AppHeader.tsx";
import AppFooter from "./AppFooter.tsx";
import HomeClient from "./HomeClient.tsx";
import SeoContent from "./seo/SeoContent.tsx";

/**
 * Sdílená homepage pro obě jazykové routy (app/(cs)/page.tsx = "/",
 * app/en/page.tsx = "/en") — Server Component, `locale` je pevně dané
 * routou. `SeoContent` je taky Server Component a i přesto, že je tu
 * vykreslená jako potomek klientského `I18nProvider`, zůstává
 * serverově vykreslená (Next.js Server Components zůstávají server-only
 * i jako children klientské komponenty, pokud je autorem JSX stromu
 * Server Component — což `HomePage` je).
 *
 * Reklamy pro placement "finder_results" se stahují TADY, server-side
 * (Content API token nikdy neopustí server, viz lib/content-api/client.ts) —
 * `HomeClient`/`FinderSection` dál dostávají už hotové pole jako obyčejná
 * data, žádný z nich neví, že existuje Content API (viz zadání bod 6/7).
 */
export default async function HomePage({ locale }: { locale: Locale }) {
  const promotionCampaigns = await getActivePromotionCampaigns("finder_results");

  return (
    <I18nProvider locale={locale}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <AppHeader />
        {/* Ilustrace jako pozadí obsahu POD hlavičkou (ne banner nad ní,
            viz oprava zpětné vazby "prázdná oblast hlavičky/hero") —
            začíná přesně na horní hraně <main>, tedy o sekci níž než
            hlavička. Karty (bg-white) uvnitř ji místy překryjí, to je
            u obrázku na pozadí čekané chování. Od `md:` výš je pozadí
            `fixed` (obsah přes něj při scrollování "pluje") — na mobilu
            (hlavně iOS Safari) má `background-attachment: fixed`
            dlouhodobě problémy s výkonem/renderováním, proto tam
            zůstává výchozí `bg-scroll`. */}
        <main className="bg-[url('/hero-metro.webp')] bg-top bg-no-repeat bg-[length:100%_auto] md:bg-fixed">
          <HomeClient entrances={metroEntrances.entrances} promotionCampaigns={promotionCampaigns} />
          <SeoContent locale={locale} />
        </main>
        <AppFooter />
      </div>
    </I18nProvider>
  );
}
