"use client";

import Link from "next/link";
import { LocateFixed } from "lucide-react";
import { useI18n } from "../i18n/I18nContext.ts";
import LanguageMenu from "../i18n/LanguageMenu.tsx";
import { localeToRoute } from "../../lib/i18n/types.ts";
import { STATIONS_PATH } from "../../lib/stations/guides.ts";
import { TICKETS_LOCALE_TO_ROUTE } from "../../lib/tickets/tariff.ts";

/**
 * Hlavička stránky jízdenek ve všech jazycích — stejné rozměry jako
 * components/stations/StationHeader.tsx, bez H1. Jazykové menu přepíná
 * mezi jazykovými verzemi stránky jízdenek (ne na homepage), značka a
 * tlačítko polohy vedou na hledání metra v aktuálním jazyce. Odkaz na
 * průvodce stanicemi jen česky (průvodci jsou jen česky).
 */
export default function TicketsHeader({ findMetroAria }: { findMetroAria: string }) {
  const { locale, dict } = useI18n();
  const home = localeToRoute[locale];

  return (
    <header className="px-4 pt-5 sm:pt-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
        <Link href={home} className="truncate text-lg font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          KdeJeMetro.cz
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {locale === "cs" && (
            <a
              href={STATIONS_PATH}
              className="hidden min-h-[44px] items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-700 shadow-sm hover:bg-gray-50 sm:inline-flex"
            >
              Stanice
            </a>
          )}
          <LanguageMenu routeMap={TICKETS_LOCALE_TO_ROUTE} />
          <Link
            href={`${home}#${dict.finder.sectionId}`}
            aria-label={findMetroAria}
            title={findMetroAria}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
          >
            <LocateFixed aria-hidden="true" size={20} strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </header>
  );
}
