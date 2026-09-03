"use client";

import { useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation.ts";
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

  // Tři nejbližší RŮZNÉ stanice pro jemné podtržení v mapě (viz zadání)
  // — čistě derivované z `position` při každém renderu (levný výpočet
  // nad ~60 vstupy, useMemo by tu jen zbytečně komplikoval závislosti
  // bez reálného přínosu), takže se samo přepočítá/vyprázdní při každé
  // změně polohy (nové hledání, demo poloha, chyba) beze zvláštní
  // stavové logiky navíc.
  const highlightedStationIds = computeHighlightedStationIds(position, entrances);

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
