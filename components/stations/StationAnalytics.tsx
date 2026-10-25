"use client";

import { useEffect } from "react";
import { emitStationEvent, stationEventFromDataset } from "../../lib/stations/events.ts";

/**
 * Jediný klientský kousek analytiky průvodce stanicí — odkazy samotné
 * zůstávají serverově vykreslené (`<a data-station-event=…>`), tady se
 * jen deleguje klik z celého dokumentu. Zobrazení stránky měří
 * `<Analytics />` z layoutu automaticky. Nic nevykresluje.
 */
export default function StationAnalytics() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-station-event]") : null;
      if (!target) return;
      // <summary> rozbalovací navigace: počítat jen otevření, ne zavření.
      if (target.tagName === "SUMMARY" && target.parentElement instanceof HTMLDetailsElement && target.parentElement.open) return;
      const stationEvent = stationEventFromDataset({ ...target.dataset });
      if (stationEvent) emitStationEvent(stationEvent);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
