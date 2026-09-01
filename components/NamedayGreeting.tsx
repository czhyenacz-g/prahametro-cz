"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatNamedaySentence, getCzechNamedays, getMsUntilNextPragueMidnight } from "../lib/namedays/get-czech-nameday.ts";

// Přání se v angličtině nikdy nezobrazuje (viz components/ads/AdSlot.tsx —
// vykresluje se jen jako český fallback), proto text NENÍ ve sdíleném
// i18n Dictionary (ten by jinak vyžadoval i anglický ekvivalent, který
// ale k ničemu není — přání anglickou variantu nemá a mít nemá).
const HEADING = "Přejeme vám krásný den";

/**
 * Fallback informační karta pro `cs`, když pro daný jazyk není žádná
 * způsobilá reklama (viz AdSlot.tsx) — NENÍ reklama, žádný CTA/odkaz/
 * tracking. Vykresluje se vždy až po mountu (AdSlot ji nikdy nevrátí
 * dřív, než useSelectedAd doběhne z `pending` stavu), takže tahle
 * komponenta nikdy neběží při SSR a nepotřebuje vlastní hydration-safe
 * "null napřed" krok — `new Date()` na prvním renderu je tu bezpečné.
 */
export default function NamedayGreeting() {
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useEffect(() => {
    // Lehké řešení bez intervalu tikajícího každou sekundu/minutu (viz
    // zadání) — jeden timeout naplánovaný přesně na příští pražskou
    // půlnoc, po jeho odpálení se referenceDate posune a efekt sám
    // naplánuje další (závislost na referenceDate). Úklid při
    // odmountování/změně přes návratovou funkci.
    const ms = getMsUntilNextPragueMidnight(referenceDate);
    const timer = setTimeout(() => setReferenceDate(new Date()), ms);
    return () => clearTimeout(timer);
  }, [referenceDate]);

  const sentence = formatNamedaySentence(getCzechNamedays(referenceDate));

  return (
    <aside aria-label={HEADING} className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700">
          <CalendarDays size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900">{HEADING}</p>
          {/* aria-live jen tady a jen "polite" (viz zadání) — smysluplné kvůli tichému přechodu jmen po půlnoci, žádná urgentní zpráva. */}
          <p className="mt-0.5 text-sm text-gray-700" aria-live="polite">
            {sentence}
          </p>
        </div>
      </div>
    </aside>
  );
}
