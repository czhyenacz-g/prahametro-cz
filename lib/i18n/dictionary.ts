import type { Locale } from "./types.ts";

// Jednoduchý typovaný slovník cs/en — žádná těžká i18n knihovna (viz
// zadání). Názvy stanic se sem NIKDY nedávají, ty se nepřekládají.
// Delší, převážně serverově vykreslený SEO obsah (úvod, "jak to
// funguje", rozcestník, FAQ) je záměrně MIMO tenhle slovník — viz
// lib/seo/content.ts. Ten sem nepatří, protože tenhle Dictionary
// prochází přes I18nContext do klientského JS bundlu (viz
// I18nProvider.tsx), zatímco SEO obsah je čistě statický a nikdy
// interaktivní, není důvod ho tam táhnout s sebou.
export type Dictionary = {
  header: {
    subtitle: string;
    vulgarAriaLabelOn: string;
    vulgarAriaLabelOff: string;
  };
  finder: {
    /** Stabilní id kořenové <section> pro kotvu z tematického rozcestníku (viz lib/seo/content.ts) — nezávislé na dynamickém (18+) obsahu aria-labelu. */
    sectionId: string;
    heading: string;
    headingVulgar: string;
    ctaLocating: string;
    privacyNote: string;
    status: {
      denied: string;
      unavailable: string;
      timeout: string;
      unsupported: string;
    };
  };
  outsidePrague: {
    title: string;
    body: (stationName: string, distance: string) => string;
    /** Hravá varianta pro uživatele max. 30 km vzdušnou čarou od středu Brna (viz lib/metro/brno.ts). */
    brnoTitle: string;
    brnoBody: (stationName: string, distance: string) => string;
  };
  result: {
    entranceLabel: (label: string) => string;
    wheelchair: string;
    googleMapsLabel: string;
    appleMapsLabel: string;
    mapyComLabel: string;
    googleMapsAriaLabel: string;
    appleMapsAriaLabel: string;
    mapyComAriaLabel: string;
    disclaimer: string;
  };
  map: {
    /** Stabilní, jazykově odlišné id nadpisu mapy (cs "mapa-metra" / en "metro-map") — cíl z tematického rozcestníku. */
    sectionId: string;
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
  };
  /** Panel "Odjezdy" (viz zadání) — plánované GTFS odjezdy, ne poloha vlaků v reálném čase. */
  departures: {
    buttonLabel: string;
    buttonAriaLabel: (stationName: string) => string;
    dialogCloseLabel: string;
    nextHeading: string;
    lastHeading: string;
    towards: (station: string) => string;
    lineLabel: string;
    directionGroupLabel: string;
    sourceLabel: string;
    updatedLabel: string;
    checkInPidLitacka: string;
    loading: string;
    errorTitle: string;
    errorBody: string;
    staleTitle: string;
    staleBody: string;
    noDeparturesForSelection: string;
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
    sectionId: "najit-metro",
    heading: "Kde je nejbližší metro?",
    headingVulgar: "Kde je to zkurvený metro?!!",
    ctaLocating: "Zjišťuji polohu…",
    privacyNote: "Poloha zůstává jen ve vašem zařízení.",
    status: {
      denied:
        "Přístup k poloze byl zamítnutý. Povol ho v nastavení prohlížeče (obvykle ikona zámku/lokace vedle adresního řádku) a zkus to znovu.",
      unavailable: "Polohu se nepodařilo zjistit. Zkontroluj, že máš zapnuté GPS/lokaci, a zkus to znovu.",
      timeout: "Zjišťování polohy trvalo příliš dlouho. Zkus to prosím znovu.",
      unsupported: "Tento prohlížeč geolokaci nepodporuje.",
    },
  },
  outsidePrague: {
    title: "Tady už pražské metro opravdu nejezdí.",
    body: (stationName, distance) => `Nejbližší vstup je u stanice ${stationName}, přibližně ${distance} vzdušnou čarou.`,
    brnoTitle: "Ne, Brno opravdu metro nemá!",
    brnoBody: (stationName, distance) => `Nejbližší pražské metro je ${stationName}, přibližně ${distance} vzdušnou čarou.`,
  },
  result: {
    entranceLabel: (label) => `Vstup ${label}`,
    wheelchair: "Bezbariérový přístup",
    googleMapsLabel: "Google Maps",
    appleMapsLabel: "Apple Maps",
    mapyComLabel: "Mapy.com",
    googleMapsAriaLabel: "Spustit pěší navigaci v Google Maps",
    appleMapsAriaLabel: "Spustit pěší navigaci v Apple Maps",
    mapyComAriaLabel: "Spustit pěší navigaci v Mapy.com",
    disclaimer: "Vzdušná vzdálenost, orientační — skutečnou trasu ukáže navigace.",
  },
  map: {
    sectionId: "mapa-metra",
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
  },
  departures: {
    buttonLabel: "Odjezdy",
    buttonAriaLabel: (stationName) => `Odjezdy ze stanice ${stationName}`,
    dialogCloseLabel: "Zavřít odjezdy",
    nextHeading: "Nejbližší odjezdy",
    lastHeading: "Poslední metro podle jízdního řádu",
    towards: (station) => `směr ${station}`,
    lineLabel: "Linka",
    directionGroupLabel: "Směr",
    sourceLabel: "Jízdní řád PID",
    updatedLabel: "aktualizováno",
    checkInPidLitacka: "Ověřit v PID Lítačce",
    loading: "Načítám odjezdy…",
    errorTitle: "Odjezdy se nyní nepodařilo načíst.",
    errorBody: "Ověřte aktuální spojení v aplikaci PID Lítačka.",
    staleTitle: "Jízdní řád nemusí být aktuální.",
    staleBody: "Ověřte poslední spoj v PID Lítačce.",
    noDeparturesForSelection: "Pro tuhle kombinaci linky a směru teď nejsou žádné odjezdy.",
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
    sectionId: "find-entrance",
    heading: "Where is the nearest metro?",
    headingVulgar: "Where's the fucking metro?!",
    ctaLocating: "Locating…",
    privacyNote: "Your location stays only on your device.",
    status: {
      denied: "Location access was denied. Enable it in your browser settings (usually the lock/location icon next to the address bar) and try again.",
      unavailable: "We couldn't determine your location. Check that GPS/location is turned on and try again.",
      timeout: "Locating took too long. Please try again.",
      unsupported: "This browser doesn't support geolocation.",
    },
  },
  outsidePrague: {
    title: "The Prague Metro really doesn’t run this far.",
    body: (stationName, distance) => `The nearest entrance is at ${stationName}, approximately ${distance} away as the crow flies.`,
    brnoTitle: "No, Brno really doesn’t have a metro!",
    brnoBody: (stationName, distance) => `The nearest Prague Metro entrance is at ${stationName}, approximately ${distance} away as the crow flies.`,
  },
  result: {
    entranceLabel: (label) => `Entrance ${label}`,
    wheelchair: "Wheelchair accessible",
    googleMapsLabel: "Google Maps",
    appleMapsLabel: "Apple Maps",
    mapyComLabel: "Mapy.com",
    googleMapsAriaLabel: "Start walking navigation in Google Maps",
    appleMapsAriaLabel: "Start walking navigation in Apple Maps",
    mapyComAriaLabel: "Start walking navigation in Mapy.com",
    disclaimer: "Straight-line distance, approximate — actual route shown by navigation.",
  },
  map: {
    sectionId: "metro-map",
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
    label: "Advertisement",
  },
  departures: {
    buttonLabel: "Departures",
    buttonAriaLabel: (stationName) => `Departures from ${stationName}`,
    dialogCloseLabel: "Close departures",
    nextHeading: "Next scheduled departures",
    lastHeading: "Last scheduled metro",
    towards: (station) => `towards ${station}`,
    lineLabel: "Line",
    directionGroupLabel: "Direction",
    sourceLabel: "PID timetable",
    updatedLabel: "updated",
    checkInPidLitacka: "Check in PID Lítačka",
    loading: "Loading departures…",
    errorTitle: "Departures could not be loaded right now.",
    errorBody: "Please verify your journey in the PID Lítačka app.",
    staleTitle: "The timetable may be out of date.",
    staleBody: "Please verify the last service in PID Lítačka.",
    noDeparturesForSelection: "There are no departures for this line and direction right now.",
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
