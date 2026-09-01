import type { Locale } from "../i18n/types.ts";

/** "Jízdní řád PID · aktualizováno {datum}" (viz zadání) — datum v Europe/Prague, čitelný lokální formát, ne technický ISO řetězec. Neplatný vstup -> prázdný řetězec, nespadne. */
export function formatUpdatedDate(generatedAtIso: string, locale: Locale): string {
  const date = new Date(generatedAtIso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-US", { dateStyle: "medium", timeZone: "Europe/Prague" }).format(date);
}
