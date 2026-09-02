"use client";

import { TriangleAlert } from "lucide-react";

/**
 * Zjednodušená varianta components/OutsidePragueNotice.tsx pro noční
 * sekci — JEDNA obecná hláška bez jména nejbližší stanice/vzdálenosti a
 * BEZ brněnského vtipu (zadání bod 24 — "nepřidávej brněnský vtip na
 * noční stránku, pokud by zbytečně komplikoval scope"). Vizuálně stejný
 * jazyk (oranžová informační karta), jen menší rozsah obsahu.
 */
export default function NightOutsidePragueNotice({ message }: { message: string }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-sm dark:border-orange-900/60 dark:bg-orange-950/40">
      <TriangleAlert aria-hidden="true" size={26} strokeWidth={2.25} className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" />
      <p className="text-base font-bold text-orange-900 dark:text-orange-200 sm:text-lg">{message}</p>
    </div>
  );
}
