"use client";

import { Ticket } from "lucide-react";
import { useI18n } from "./i18n/I18nContext.ts";
import { TICKETS_PATH } from "../lib/tickets/tariff.ts";

/**
 * Odkaz na stránku jízdenek (/jizdenky-praha) v hlavičce. Na mobilu se
 * vedle jazykového menu nevejde bez zkrácení značky, proto dvě umístění:
 * `"inline"` = vedle jazykového menu od šířky `sm`, `"row"` = vlastní
 * řádek pod značkou jen na mobilu. Vždy je viditelné právě jedno (to
 * druhé má `display: none`, takže ho nečte ani čtečka). Tap target min.
 * 44 px jako ostatní tlačítka hlavičky. Stránka je jen česky — ostatní
 * jazyky mají přeložený popisek, `hrefLang="cs"` a v accessible name
 * upozornění, že stránka je česky.
 */
export default function HeaderTicketsLink({ placement }: { placement: "inline" | "row" }) {
  const { dict } = useI18n();
  const visibility = placement === "inline" ? "hidden sm:inline-flex" : "inline-flex sm:hidden";

  return (
    <a
      href={TICKETS_PATH}
      hrefLang="cs"
      aria-label={dict.header.ticketsLinkAriaLabel}
      title={dict.header.ticketsLinkAriaLabel}
      className={`${visibility} h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700`}
    >
      <Ticket aria-hidden="true" size={20} strokeWidth={2.25} />
      {dict.header.ticketsLink}
    </a>
  );
}
