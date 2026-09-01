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
 */
export default function HomePage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <AppHeader />
        <main>
          <HomeClient entrances={metroEntrances.entrances} />
          <SeoContent locale={locale} />
        </main>
        <AppFooter />
      </div>
    </I18nProvider>
  );
}
