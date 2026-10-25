import { ArrowRight, Signpost } from "lucide-react";
import { STATIONS_PATH } from "../../lib/stations/guides.ts";

/**
 * Nenápadný odkaz na průvodce stanicemi pod hlavní funkcí homepage —
 * jen česká verze (průvodci jsou jen česky), stejný kartový styl jako
 * components/seo/SeoContent.tsx.
 */
export default function StationGuidesTeaser() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6">
      <a
        href={STATIONS_PATH}
        className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-navy-700 sm:p-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
          <Signpost aria-hidden="true" size={20} strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-gray-900">Průvodce stanicemi metra</span>
          <span className="block text-sm text-gray-600">Najděte správný výstup, přestup nebo návazný autobus.</span>
        </span>
        <ArrowRight aria-hidden="true" size={20} className="shrink-0 text-navy-700" />
      </a>
    </div>
  );
}
