"use client";

import { useI18n } from "./I18nContext.ts";

// Popisek je záměrně v CÍLOVÉM jazyce (ne v aktuálním) — běžný vzorec
// pro přepínače jazyka, viz zadání: v češtině nabízí anglický popisek
// "Switch to English", v angličtině český "Přepnout do češtiny". Proto
// tenhle text NENÍ ve slovníku (ten je vždy v aktuálním jazyce).
// Textový kód cílového jazyka (CZ/EN) místo vlajky — jasnější a
// jednoznačnější než emoji vlajka (ta navíc technicky značí zemi, ne
// jazyk).
export default function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const isCs = locale === "cs";
  const label = isCs ? "Switch to English" : "Přepnout do češtiny";
  const targetCode = isCs ? "EN" : "CZ";

  return (
    <button
      type="button"
      onClick={() => setLocale(isCs ? "en" : "cs")}
      aria-label={label}
      title={label}
      className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-2.5 text-sm font-bold tracking-wide text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
    >
      {targetCode}
    </button>
  );
}
