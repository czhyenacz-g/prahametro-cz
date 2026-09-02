import { TrainFront } from "lucide-react";
import I18nProvider from "../i18n/I18nProvider.tsx";
import AppFooter from "../AppFooter.tsx";
import { localeToRoute, type Locale } from "../../lib/i18n/types.ts";
import { getNightDictionary } from "../../lib/i18n/night-dictionary.ts";
import { getNightSeoContent } from "../../lib/seo/night-content.ts";
import NightThemeShell from "./NightThemeShell.tsx";
import NightFinder from "./NightFinder.tsx";
import NightSeoContent from "./NightSeoContent.tsx";

/**
 * Sdílená noční stránka pro všechny 4 jazykové routy (zadání bod 2) —
 * Server Component, `locale` je pevně dané routou, přesně jako u
 * components/HomePage.tsx. Nová, samostatná sekce — HomePage.tsx a
 * jeho jednoduchá funkce zůstávají BEZE ZMĚNY (zadání).
 */
export default function NightPage({ locale }: { locale: Locale }) {
  const nightDict = getNightDictionary(locale);
  const seo = getNightSeoContent(locale);

  return (
    <I18nProvider locale={locale}>
      <NightThemeShell mainHeading={seo.mainHeading}>
        <main className="flex-1">
          <NightFinder />
          <NightSeoContent locale={locale} />
        </main>
        <AppFooter bottomLink={{ href: localeToRoute[locale], label: nightDict.backToMetroLink, icon: <TrainFront aria-hidden="true" size={14} strokeWidth={2.25} /> }} />
      </NightThemeShell>
    </I18nProvider>
  );
}
