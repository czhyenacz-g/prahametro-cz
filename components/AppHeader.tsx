"use client";

import LanguageToggle from "./i18n/LanguageToggle.tsx";
import VulgarToggle from "./i18n/VulgarToggle.tsx";
import { useI18n } from "./i18n/I18nContext.ts";
import { getSeoContent } from "../lib/seo/content.ts";

// Značka "KdeJeMetro.cz" se NEPŘEKLÁDÁ (je to název domény) — jen
// podtitulek a popisky tlačítek jsou jazykově závislé. Na 320px se
// značka může zmenšit, ale tlačítka si drží min. 44×44 px tap target
// (viz zadání). Značka je záměrně odstavec, ne nadpis — jediný
// smysluplný nadpis první úrovně na stránku je hlavní SEO nadpis níže
// (lib/seo/content.ts mainHeading), viditelně na stejném místě jako
// dřívější podtitulek, beze změny vizuálu (stejné třídy jako předtím
// měl podtitulek).
export default function AppHeader() {
  const { dict, locale } = useI18n();
  const seo = getSeoContent(locale);

  return (
    <header className="px-4 pt-5 sm:pt-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
        <p className="truncate text-lg font-extrabold tracking-tight text-navy-900 sm:text-3xl">KdeJeMetro.cz</p>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageToggle />
          <VulgarToggle />
        </div>
      </div>
      <h1 className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-600 sm:text-base">{seo.mainHeading}</h1>
      <p className="mx-auto mt-1 max-w-2xl text-center text-xs text-gray-500 sm:text-sm">{dict.header.subtitle}</p>
    </header>
  );
}
