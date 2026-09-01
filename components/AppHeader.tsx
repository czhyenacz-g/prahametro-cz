"use client";

import LanguageToggle from "./i18n/LanguageToggle.tsx";
import VulgarToggle from "./i18n/VulgarToggle.tsx";
import { useI18n } from "./i18n/I18nContext.ts";

// Značka "KdeJeMetro.cz" se NEPŘEKLÁDÁ (je to název domény) — jen
// podtitulek a popisky tlačítek jsou jazykově závislé. Na 320px se
// značka může zmenšit, ale tlačítka si drží min. 44×44 px tap target
// (viz zadání).
export default function AppHeader() {
  const { dict } = useI18n();

  return (
    <header className="px-4 pt-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
        <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-3xl">KdeJeMetro.cz</h1>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <VulgarToggle />
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-600 sm:text-base">{dict.header.subtitle}</p>
    </header>
  );
}
