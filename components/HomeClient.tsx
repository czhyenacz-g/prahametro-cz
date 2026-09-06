"use client";

import { useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation.ts";
import { useMetroFinderResults } from "../hooks/useMetroFinderResults.ts";
import type { AdCampaign } from "../lib/ads/types.ts";
import { computeHighlightedStationIds } from "../lib/metro/highlighted-stations.ts";
import { emitParkingEvent } from "../lib/parking/events.ts";
import { parkAndRideDataset } from "../lib/parking/load-park-and-ride.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import FinderSection from "./FinderSection.tsx";
import MetroMap from "./map/MetroMap.tsx";
import ParkAndRideSection from "./parking/ParkAndRideSection.tsx";

// Jediný client wrapper, který drží geolokační stav sdílený mezi hero
// sekcí s výsledky (FinderSection) a mapou (MetroMap, "Najít vstupy
// této stanice" potřebuje stejnou polohu, pokud už ji máme) — a teď i
// stav P+R sekce (otevřeno/zavřeno + která stanice byla vyžádaná přes
// badge), protože badge žije hluboko ve FinderSection/MetroMap, ale
// sekce samotná je jejich společný sourozenec pod mapou.
export default function HomeClient({ entrances, promotionCampaigns }: { entrances: MetroEntrance[]; promotionCampaigns: AdCampaign[] }) {
  const { status, locate, setDemoPosition } = useGeolocation();
  const position = status.kind === "success" ? { lat: status.lat, lon: status.lon } : null;

  const [parkAndRideOpen, setParkAndRideOpen] = useState(false);
  const [parkAndRideFocusStationId, setParkAndRideFocusStationId] = useState<string | null>(null);

  // Jediné volání hooku pro celou appku — FinderSection dostává výsledky
  // (karty) jako props, MetroMap zvýraznění (viz níže), ať neběží dvě
  // nezávislé instance efektu/generation-counteru pro stejné hledání.
  const finder = useMetroFinderResults(entrances, position);

  // Po úspěšném (i částečném) routingu zvýrazni stanice odpovídající
  // AKTUÁLNĚ zobrazeným třem výsledkům (viz zadání bod 15) — dokud
  // routing neuspěl (preliminaryResults, mimo Prahu, bez API klíče,
  // selhání), zachovej přesně původní vzdušný výpočet tří nejbližších
  // RŮZNÝCH stanic (computeHighlightedStationIds), beze změny.
  const highlightedStationIds = finder.routedStationIds ?? computeHighlightedStationIds(position, entrances);

  function openParkAndRideForStation(stationId: string) {
    emitParkingEvent({ type: "pr_badge_click", stationId });
    setParkAndRideOpen(true);
    setParkAndRideFocusStationId(stationId);
  }

  return (
    <>
      <FinderSection
        entrances={entrances}
        status={status}
        onLocate={locate}
        onDemoSelect={setDemoPosition}
        onOpenParkAndRide={openParkAndRideForStation}
        promotionCampaigns={promotionCampaigns}
        results={finder.results}
        isRefining={finder.isRefining}
        outsidePragueStatus={finder.outsidePragueStatus}
        closestOverall={finder.closestOverall}
        routingAttempted={finder.routingAttempted}
      />
      <MetroMap
        entrances={entrances}
        position={position}
        onRequestLocation={locate}
        highlightedStationIds={highlightedStationIds}
        onOpenParkAndRide={openParkAndRideForStation}
      />
      {/* Sekce se vůbec nevykreslí, dokud data/park-and-ride.json neobsahuje
          žádné P+R (viz scripts/import-park-and-ride.ts — bez
          GOLEMIO_API_KEY zůstává prázdný placeholder) — appka tak zůstává
          beze změny, dokud import poprvé neproběhne s platným tokenem. */}
      {parkAndRideDataset.parkAndRides.length > 0 && (
        <div className="pb-6">
          <ParkAndRideSection
            open={parkAndRideOpen}
            onToggle={() => setParkAndRideOpen((v) => !v)}
            position={position}
            focusStationId={parkAndRideFocusStationId}
            onFocusHandled={() => setParkAndRideFocusStationId(null)}
          />
        </div>
      )}
    </>
  );
}
