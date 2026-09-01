"use client";

import { useCallback, useState } from "react";
import { mapGeolocationErrorCode, type GeolocationStatus } from "../lib/metro/geolocation-state.ts";

const TIMEOUT_MS = 10_000;

/**
 * Tenký wrapper nad navigator.geolocation — logiku "co znamená který
 * chybový kód" má v lib/metro/geolocation-state.ts (testovatelné bez
 * DOM). Poloha se nikam neodesílá ani neloguje, jen se drží v React
 * stavu (viz zadání "výpočty probíhají pouze v prohlížeči").
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>({ kind: "idle" });

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "unsupported" });
      return;
    }

    setStatus({ kind: "locating" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus({
          kind: "success",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      (error) => {
        setStatus({ kind: mapGeolocationErrorCode(error.code) });
      },
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 }
    );
  }, []);

  const setDemoPosition = useCallback((lat: number, lon: number) => {
    setStatus({ kind: "success", lat, lon, accuracyMeters: 5 });
  }, []);

  const reset = useCallback(() => setStatus({ kind: "idle" }), []);

  return { status, locate, setDemoPosition, reset };
}
