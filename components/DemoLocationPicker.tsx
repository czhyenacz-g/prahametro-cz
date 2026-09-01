"use client";

import { demoHeading } from "../lib/i18n/demo-dictionary.ts";
import type { Locale } from "../lib/i18n/types.ts";
import type { DemoPosition } from "../lib/metro/demo-positions.ts";

export type DemoLocationPickerProps = {
  positions: DemoPosition[];
  onSelect: (lat: number, lon: number) => void;
  locale: Locale;
};

// Jen pro vývoj/prezentaci (viz zadání) — page.tsx tuhle komponentu
// vůbec nevykreslí mimo development, takže se "nezobrazí v production
// buildu" (stejný ověřený vzorec jako placeholder reklamní komponenty).
// Nadpis se bere z demo-dictionary.ts, NE z hlavního Dictionary — viz
// komentář tam, proč (tree-shaking jednotlivého pole ze sdíleného
// objektu nefunguje, samostatný modul ano). Jména předvoleb se
// nepřekládají — jsou to názvy míst/stanic.
export default function DemoLocationPicker({ positions, onSelect, locale }: DemoLocationPickerProps) {
  if (positions.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-dashed border-gray-300 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{demoHeading[locale]}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {positions.map((position) => (
          <button
            key={position.label}
            type="button"
            onClick={() => onSelect(position.lat, position.lon)}
            className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:border-gray-900"
          >
            {position.label}
          </button>
        ))}
      </div>
    </div>
  );
}
