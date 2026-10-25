import Link from "next/link";
import { LocateFixed } from "lucide-react";
import { STATIONS_PATH } from "../../lib/stations/guides.ts";
import { TICKETS_PATH } from "../../lib/tickets/tariff.ts";

/**
 * Hlavička průvodců stanicemi — stejná značka a rozměry jako
 * components/AppHeader.tsx, ale BEZ H1 (ten má každá stránka vlastní) a
 * bez jazykového menu (průvodci jsou jen česky). Značka vede zpět na
 * hlavní funkci — hledání nejbližšího vstupu.
 */
export default function StationHeader() {
  return (
    <header className="px-4 pt-5 sm:pt-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
        <Link href="/" className="truncate text-lg font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          KdeJeMetro.cz
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href={STATIONS_PATH}
            className="hidden min-h-[44px] items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-700 shadow-sm hover:bg-gray-50 sm:inline-flex"
          >
            Stanice
          </a>
          <a
            href={TICKETS_PATH}
            className="hidden min-h-[44px] items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-700 shadow-sm hover:bg-gray-50 sm:inline-flex"
          >
            Jízdenky
          </a>
          <Link
            href="/#najit-metro"
            aria-label="Najít nejbližší metro podle polohy"
            title="Najít nejbližší metro podle polohy"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
          >
            <LocateFixed aria-hidden="true" size={20} strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </header>
  );
}
