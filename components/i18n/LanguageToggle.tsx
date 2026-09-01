"use client";

import { useI18n } from "./I18nContext.ts";

// Popisek je záměrně v CÍLOVÉM jazyce (ne v aktuálním) — běžný vzorec
// pro přepínače jazyka, viz zadání: v češtině nabízí anglický popisek
// "Switch to English", v angličtině český "Přepnout do češtiny". Proto
// tenhle text NENÍ ve slovníku (ten je vždy v aktuálním jazyce).
export default function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const isCs = locale === "cs";
  const label = isCs ? "Switch to English" : "Přepnout do češtiny";
  const flag = isCs ? "🇬🇧" : "🇨🇿";

  return (
    <button
      type="button"
      onClick={() => setLocale(isCs ? "en" : "cs")}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-xl shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
    >
      <span aria-hidden="true">{flag}</span>
    </button>
  );
}
