"use client";

import LanguageMenu from "../i18n/LanguageMenu.tsx";
import { useI18n } from "../i18n/I18nContext.ts";
import { getNightDictionary } from "../../lib/i18n/night-dictionary.ts";
import { NIGHT_LOCALE_TO_ROUTE } from "../../lib/i18n/night-routes.ts";
import NightThemeToggle from "./NightThemeToggle.tsx";

export type NightHeaderProps = {
  mainHeading: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

/**
 * Hlavička noční stránky — brand + jazykové menu (routuje na noční
 * varianty, viz NIGHT_LOCALE_TO_ROUTE) + přepínač vzhledu, pak H1 se
 * SEO nadpisem (zadání bod 17) a krátký podtitulek. Analogie
 * components/AppHeader.tsx, ale BEZ VulgarToggle (zadání bod 9 "18+
 * režim na noční stránku nepřidávej").
 */
export default function NightHeader({ mainHeading, theme, onToggleTheme }: NightHeaderProps) {
  const { locale } = useI18n();
  const nightDict = getNightDictionary(locale);

  return (
    <header className="px-4 pt-5 sm:pt-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
        <p className="truncate text-lg font-extrabold tracking-tight text-navy-900 dark:text-white sm:text-3xl">KdeJeMetro.cz</p>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageMenu routeMap={NIGHT_LOCALE_TO_ROUTE} />
          <NightThemeToggle theme={theme} onToggle={onToggleTheme} toNightLabel={nightDict.themeToggleToNight} toLightLabel={nightDict.themeToggleToLight} />
        </div>
      </div>
      <h1 className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-600 dark:text-slate-300 sm:text-base">{mainHeading}</h1>
      <p className="mx-auto mt-1 max-w-2xl text-center text-xs text-gray-500 dark:text-slate-400 sm:text-sm">{nightDict.subtitle}</p>
    </header>
  );
}
