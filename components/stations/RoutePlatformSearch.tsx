"use client";

import { useId, useMemo, useState } from "react";
import { Navigation, Search } from "lucide-react";
import type { StationAreaPlatform } from "../../lib/stations/area-stops-types.ts";
import { findRoutePlatformMatches, normalizeRouteQuery, platformAnchorId } from "../../lib/stations/build-guide-view.ts";
import { buildPlaceLinks } from "../../lib/stations/place-links.ts";

const LINK_CLASS =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-navy-900 hover:border-navy-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900";

/**
 * Vyhledání stanoviště podle čísla linky nad mapou průvodce (Letňany).
 * Data jsou stejná jako v seznamu stanovišť (data/station-area-stops.json
 * z PID GTFS) — nic se nedopočítává ani nehádá. Klik na navigaci emituje
 * `station_navigation_click` přes data-* atributy (StationAnalytics).
 */
export default function RoutePlatformSearch({ platforms, slug, label }: { platforms: readonly StationAreaPlatform[]; slug: string; label: string }) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const route = normalizeRouteQuery(value);
  const matches = useMemo(() => (route ? findRoutePlatformMatches(platforms, route) : []), [platforms, route]);
  const multiple = matches.length > 1;

  return (
    <div className="mt-3 rounded-xl border-2 border-navy-900 bg-navy-50 p-3 sm:p-4">
      <label htmlFor={inputId} className="block text-base font-bold text-navy-900">
        {label}
      </label>
      <div className="relative mt-2">
        <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="např. 413"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-[48px] w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-lg font-semibold text-gray-900 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
        />
      </div>

      <div aria-live="polite" className="mt-3">
        {route && matches.length === 0 && (
          <p className="text-sm text-gray-800 sm:text-base">
            Linka <strong>{route}</strong> podle aktuálního jízdního řádu PID z této stanice neodjíždí.{" "}
            <a href="#stanoviste" className="font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900">
              Zobrazit všechna stanoviště
            </a>
          </p>
        )}
        {matches.length > 0 && (
          <ul className="flex flex-col gap-3">
            {multiple && <li className="text-sm text-gray-700">Linka {route} odjíždí z více stanovišť — vyberte podle směru.</li>}
            {matches.map(({ platform, headsigns }) => {
              const anchor = platformAnchorId(platform.code);
              const links = buildPlaceLinks({ kind: "coordinates", lat: platform.lat, lon: platform.lon });
              const destinationId = `linka-${route}-${anchor}`;
              const data = (provider: string) => ({ "data-station-event": "station_navigation_click", "data-station-slug": slug, "data-destination-id": destinationId, "data-provider": provider });
              return (
                <li key={anchor} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border-2 border-navy-900 bg-white px-1.5 text-lg font-extrabold text-navy-900">
                      {platform.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-900">
                        Linka {route}: stanoviště {platform.code}
                      </p>
                      {headsigns.length > 0 && <p className="text-sm text-gray-700">Směr {headsigns.join(", ")}</p>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a href={links.google} target="_blank" rel="noopener noreferrer" className={LINK_CLASS} {...data("google")}>
                      <Navigation aria-hidden="true" size={16} />
                      Pěší navigace
                    </a>
                    <a href={links.mapy} target="_blank" rel="noopener noreferrer" className={LINK_CLASS} {...data("mapy")}>
                      Bod na Mapy.com
                    </a>
                    <a href={`#${anchor}`} className={LINK_CLASS}>
                      V seznamu stanovišť
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
