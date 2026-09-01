"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./I18nContext.ts";
import { LOCALES, localeToRoute, type Locale } from "../../lib/i18n/types.ts";
import { useFocusTrap } from "../../hooks/useFocusTrap.ts";

// Kód URL segmentu daného jazyka jako viditelný štítek tlačítka (viz
// zadání "🌐 CS/EN/DE/UA") — záměrně "UA" pro ukrajinštinu, i když
// interní locale je "uk" (viz lib/i18n/types.ts routeToLocale/localeToRoute).
// Odkaz mezi tlačítkem a interním locale je jen tenhle jeden objekt.
const ROUTE_BADGE: Record<Locale, string> = { cs: "CS", en: "EN", de: "DE", uk: "UA" };

// Název jazyka VŽDY v jazyce samotném (ne v aktuálním jazyce prohlížení) —
// proto NENÍ v Dictionary (ten je vždy v aktuálním jazyce, viz
// lib/i18n/dictionary.ts). Stejný důvod jako u dřívějšího LanguageToggle.
const NATIVE_NAME: Record<Locale, string> = { cs: "Čeština", en: "English", de: "Deutsch", uk: "Українська" };

// <html lang> hodnota cílové stránky (uk, ne ua — viz zadání).
const HTML_LANG: Record<Locale, string> = { cs: "cs", en: "en", de: "de", uk: "uk" };

/**
 * Náhrada dřívějšího prostého cs/en LanguageToggle (viz zadání "kompaktní
 * menu se 4 jazyky"). Otevírá se přes obyčejný disclosure vzorec (ne
 * role="menu" — plná ARIA menu klávesová navigace by byla nepřiměřená
 * složitost vůči tomu, co zadání skutečně vyžaduje) se skutečnými <a
 * href> odkazy, takže je najde i vyhledávač. Query string a hash aktuální
 * stránky se dopočítávají až po mountu (`useEffect`, čte `window.location`)
 * — server ani první klientský render je neznají, takže hydratace
 * nemůže nesouhlasit (viz zadání "no hydration mismatch").
 */
export default function LanguageMenu() {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const [suffix, setSuffix] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useFocusTrap(open, () => setOpen(false));

  useEffect(() => {
    setSuffix(window.location.search + window.location.hash);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={dict.header.languageMenuLabel}
        title={dict.header.languageMenuLabel}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 text-sm font-bold tracking-wide text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
      >
        <span aria-hidden="true">🌐</span>
        <span>{ROUTE_BADGE[locale]}</span>
      </button>
      {/* `hidden`, ne podmíněné vykreslení — odkazy zůstávají v serverovém
          HTML i zavřené (viz zadání "najde je i vyhledávač"), `hidden`
          atribut je navíc automaticky vyřadí z tab pořadí a přístupnostního
          stromu, dokud se menu neotevře. */}
      <div
        ref={panelRef}
        hidden={!open}
        className="absolute right-0 top-full z-20 mt-1 w-max min-w-[10.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
      >
        {LOCALES.map((targetLocale) => {
          const isCurrent = targetLocale === locale;
          return (
            <a
              key={targetLocale}
              href={localeToRoute[targetLocale] + suffix}
              hrefLang={HTML_LANG[targetLocale]}
              aria-current={isCurrent ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex min-h-[44px] items-center justify-between gap-3 px-3 text-sm ${
                isCurrent ? "bg-gray-50 font-bold text-navy-900" : "text-navy-700 hover:bg-gray-50"
              }`}
            >
              <span>{NATIVE_NAME[targetLocale]}</span>
              {isCurrent && (
                <span aria-hidden="true" className="text-navy-900">
                  ✓
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
