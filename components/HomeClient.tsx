"use client";

import { useGeolocation } from "../hooks/useGeolocation.ts";
import { computeHighlightedStationIds } from "../lib/metro/highlighted-stations.ts";
import type { MetroEntrance } from "../lib/metro/types.ts";
import FinderSection from "./FinderSection.tsx";
import MetroMap from "./map/MetroMap.tsx";

// Jediný client wrapper, který drží geolokační stav sdílený mezi hero
// sekcí s výsledky (FinderSection) a mapou (MetroMap, "Najít vstupy
// této stanice" potřebuje stejnou polohu, pokud už ji máme).
export default function HomeClient({ entrances }: { entrances: MetroEntrance[] }) {
  const { status, locate, setDemoPosition } = useGeolocation();
  const position = status.kind === "success" ? { lat: status.lat, lon: status.lon } : null;

  // Tři nejbližší RŮZNÉ stanice pro jemné podtržení v mapě (viz zadání)
  // — čistě derivované z `position` při každém renderu (levný výpočet
  // nad ~60 vstupy, useMemo by tu jen zbytečně komplikoval závislosti
  // bez reálného přínosu), takže se samo přepočítá/vyprázdní při každé
  // změně polohy (nové hledání, demo poloha, chyba) beze zvláštní
  // stavové logiky navíc.
  const highlightedStationIds = computeHighlightedStationIds(position, entrances);

  return (
    <>
      <FinderSection entrances={entrances} status={status} onLocate={locate} onDemoSelect={setDemoPosition} />
      <MetroMap entrances={entrances} position={position} onRequestLocation={locate} highlightedStationIds={highlightedStationIds} />
    </>
  );
}
