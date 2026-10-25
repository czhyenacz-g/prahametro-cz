import { ArrowRight, Ticket } from "lucide-react";
import { TICKETS_PATH } from "../../lib/tickets/tariff.ts";

/**
 * Odkaz na /jizdenky-praha. `variant="home"` = nenápadná karta pod hlavní
 * funkcí homepage (stejný styl jako StationGuidesTeaser), `"station"` =
 * jednotný blok na stránkách průvodců stanicemi. Jen česky.
 */
export default function TicketsTeaser({ variant }: { variant: "home" | "station" }) {
  if (variant === "home") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <a
          href={TICKETS_PATH}
          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-navy-700 sm:p-5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
            <Ticket aria-hidden="true" size={20} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-gray-900">Jak koupit jízdenku na metro?</span>
            <span className="block text-sm text-gray-600">Ceny jízdenek, SMS jízdenka a PID Lítačka.</span>
          </span>
          <ArrowRight aria-hidden="true" size={20} className="shrink-0 text-navy-700" />
        </a>
      </div>
    );
  }

  return (
    <aside aria-labelledby="jizdenka-heading" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 id="jizdenka-heading" className="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">
        <Ticket aria-hidden="true" size={20} className="text-navy-700" />
        Potřebujete jízdenku?
      </h2>
      <p className="mt-1 text-sm text-gray-700 sm:text-base">Zjistěte ceny a možnosti nákupu jízdenek na metro, tramvaj nebo autobus.</p>
      <a
        href={TICKETS_PATH}
        className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-navy-900 hover:border-navy-700 hover:bg-gray-50"
      >
        Jak koupit jízdenku
        <ArrowRight aria-hidden="true" size={16} />
      </a>
    </aside>
  );
}
