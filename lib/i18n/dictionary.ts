import type { Locale } from "./types.ts";

// Jednoduchý typovaný slovník cs/en — žádná těžká i18n knihovna (viz
// zadání). Názvy stanic se sem NIKDY nedávají, ty se nepřekládají.
export type Dictionary = {
  header: {
    subtitle: string;
    vulgarAriaLabelOn: string;
    vulgarAriaLabelOff: string;
  };
  finder: {
    heading: string;
    headingVulgar: string;
    cta: string;
    ctaLocating: string;
    privacyNote: string;
    status: {
      denied: string;
      unavailable: string;
      timeout: string;
      unsupported: string;
      lowAccuracy: (accuracyMeters: number) => string;
    };
  };
  outsidePrague: {
    title: string;
    body: (stationName: string, distance: string) => string;
  };
  result: {
    entranceLabel: (label: string) => string;
    wheelchair: string;
    googleMapsLabel: string;
    mapyComLabel: string;
    googleMapsAriaLabel: string;
    mapyComAriaLabel: string;
    disclaimer: string;
  };
  map: {
    heading: string;
    subtitle: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    ariaLabel: string;
    stationAriaLabel: (stationName: string, lines: string) => string;
    closeSheet: string;
    findEntrances: string;
    needLocation: string;
    getLocation: string;
  };
  ad: {
    label: string;
    title: string;
    cta: string;
  };
  footer: {
    privacy: string;
    dataLabel: string;
    licenseWord: string;
    disclaimer: string;
  };
};

const cs: Dictionary = {
  header: {
    subtitle: "Najdi nejbližší vstup a nech se k němu navigovat.",
    vulgarAriaLabelOn: "Vypnout vulgární režim",
    vulgarAriaLabelOff: "Zapnout vulgární režim",
  },
  finder: {
    heading: "Kde je nejbližší metro?",
    headingVulgar: "Kde je to zkurvený metro?!!",
    cta: "Najít nejbližší metro",
    ctaLocating: "Zjišťuji polohu…",
    privacyNote: "Poloha zůstává jen ve vašem zařízení.",
    status: {
      denied:
        "Přístup k poloze byl zamítnutý. Povol ho v nastavení prohlížeče (obvykle ikona zámku/lokace vedle adresního řádku) a zkus to znovu.",
      unavailable: "Polohu se nepodařilo zjistit. Zkontroluj, že máš zapnuté GPS/lokaci, a zkus to znovu.",
      timeout: "Zjišťování polohy trvalo příliš dlouho. Zkus to prosím znovu.",
      unsupported: "Tento prohlížeč geolokaci nepodporuje.",
      lowAccuracy: (m) => `Poloha je přibližná (±${Math.round(m)} m).`,
    },
  },
  outsidePrague: {
    title: "Jste pravděpodobně mimo Prahu",
    body: (stationName, distance) => `Nejbližší vstup je ${stationName}, přibližně ${distance} vzdušnou čarou.`,
  },
  result: {
    entranceLabel: (label) => `Vstup ${label}`,
    wheelchair: "Bezbariérový přístup",
    googleMapsLabel: "Google Maps",
    mapyComLabel: "Mapy.com",
    googleMapsAriaLabel: "Spustit pěší navigaci v Google Maps",
    mapyComAriaLabel: "Spustit pěší navigaci v Mapy.com",
    disclaimer: "Vzdušná vzdálenost, orientační — skutečnou trasu ukáže navigace.",
  },
  map: {
    heading: "Mapa metra",
    subtitle: "Přibliž si mapu, posuň prstem, klepni na stanici pro detail.",
    zoomIn: "Přiblížit",
    zoomOut: "Oddálit",
    resetView: "Obnovit pohled",
    ariaLabel: "Schematická mapa pražského metra, linky A, B a C",
    stationAriaLabel: (name, lines) => `Stanice ${name}, linka ${lines}`,
    closeSheet: "Zavřít",
    findEntrances: "Najít vstupy této stanice",
    needLocation: "Pro seřazení vstupů podle vzdálenosti nejdřív zjisti svou polohu.",
    getLocation: "Zjistit polohu",
  },
  ad: {
    label: "Reklama",
    title: "Prostor pro partnera poblíž metra",
    cta: "Zjistit více",
  },
  footer: {
    privacy: "Polohu zpracovává pouze váš prohlížeč a web ji nikam neodesílá.",
    dataLabel: "Dopravní data:",
    licenseWord: "licence",
    disclaimer: "Neoficiální projekt, nesouvisí s DPP ani PID.",
  },
};

const en: Dictionary = {
  header: {
    subtitle: "Find the nearest entrance and navigate to it.",
    vulgarAriaLabelOn: "Disable crude mode",
    vulgarAriaLabelOff: "Enable crude mode",
  },
  finder: {
    heading: "Where is the nearest metro?",
    headingVulgar: "Where's the fucking metro?!",
    cta: "Find nearest metro",
    ctaLocating: "Locating…",
    privacyNote: "Your location stays only on your device.",
    status: {
      denied: "Location access was denied. Enable it in your browser settings (usually the lock/location icon next to the address bar) and try again.",
      unavailable: "We couldn't determine your location. Check that GPS/location is turned on and try again.",
      timeout: "Locating took too long. Please try again.",
      unsupported: "This browser doesn't support geolocation.",
      lowAccuracy: (m) => `Your location is approximate (±${Math.round(m)} m).`,
    },
  },
  outsidePrague: {
    title: "You are probably outside Prague",
    body: (stationName, distance) => `The nearest entrance is at ${stationName}, approximately ${distance} away as the crow flies.`,
  },
  result: {
    entranceLabel: (label) => `Entrance ${label}`,
    wheelchair: "Wheelchair accessible",
    googleMapsLabel: "Google Maps",
    mapyComLabel: "Mapy.com",
    googleMapsAriaLabel: "Start walking navigation in Google Maps",
    mapyComAriaLabel: "Start walking navigation in Mapy.com",
    disclaimer: "Straight-line distance, approximate — actual route shown by navigation.",
  },
  map: {
    heading: "Metro map",
    subtitle: "Pinch to zoom, drag to pan, tap a station for details.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset view",
    ariaLabel: "Schematic map of the Prague metro, lines A, B and C",
    stationAriaLabel: (name, lines) => `Station ${name}, line ${lines}`,
    closeSheet: "Close",
    findEntrances: "Find entrances of this station",
    needLocation: "Get your location first to sort entrances by distance.",
    getLocation: "Get my location",
  },
  ad: {
    label: "Ad",
    title: "Space for a partner near the metro",
    cta: "Learn more",
  },
  footer: {
    privacy: "Your location is processed only by your browser and is never sent anywhere.",
    dataLabel: "Transit data:",
    licenseWord: "license",
    disclaimer: "Unofficial project, not affiliated with DPP or PID.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { cs, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Hlavní hláška — vulgar mode mění JEN tenhle jeden text (viz zadání). */
export function getMainHeading(locale: Locale, vulgar: boolean): string {
  const dict = getDictionary(locale);
  return vulgar ? dict.finder.headingVulgar : dict.finder.heading;
}
