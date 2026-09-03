import type { Locale } from "./types.ts";
import { czechPlaceCount, englishPlaceCount, germanPlaceCount, ukrainianPlaceCount } from "../parking/pluralize.ts";
// Pozn. k `freeOfTotal`: `totalPlacesText` dostává hotový skloněný tvar
// od volajícího (components/parking/), NE od tohohle slovníku — pro
// němčinu je to záměrně dativní tvar `germanPlaceCountDative` (po "von"
// potřebuje "-n": "von 3 Plätzen"), zatímco `capacityLabel`/`staleNotice`
// používají prostý `germanPlaceCount` (bez předložky, žádný pád navíc).

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
    /** Accessible name tlačítka jazykového menu (components/i18n/LanguageMenu.tsx) — v AKTUÁLNÍM jazyce, na rozdíl od nativních názvů cílových jazyků v samotném menu (ty jsou vždy ve svém vlastním jazyce, viz LanguageMenu.tsx). */
    languageMenuLabel: string;
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
    /** Nenápadný odkaz na noční sekci v patičce (zadání bod 3) — cíl viz lib/i18n/night-routes.ts, ne tenhle slovník. */
    nightTransportLink: string;
  };
  /** P+R sekce pod mapou metra — viz lib/parking/. */
  parkAndRide: {
    /** Stabilní id sekce pro `aria-controls` na tlačítku pod mapou. */
    sectionId: string;
    /** Krátký badge "P+R" u karty nalezené stanice — text stejný ve všech jazycích, viz zadání. */
    badgeLabel: string;
    badgeAriaLabel: (station: string) => string;
    toggleShow: string;
    toggleHide: string;
    heading: string;
    subtitle: string;
    /** "u stanice {station}" pod jménem P+R v kartě. */
    nearStation: (station: string) => string;
    /** Vzdušná vzdálenost OD UŽIVATELE k P+R (ne k metru) — jen když je poloha známá. */
    distanceFromYou: (distance: string) => string;
    /** "{free} z {totalPlacesText} míst volných" — `totalPlacesText` už je správně skloněný tvar (viz lib/parking/pluralize.ts). */
    freeOfTotal: (free: number, totalPlacesText: string) => string;
    unmeasuredNotice: string;
    /** "Kapacita: {placesText}" — `placesText` už skloněný tvar. */
    capacityLabel: (placesText: string) => string;
    /** "Poslední známý stav: {free} míst volných" u zastaralého měření. */
    staleNotice: (free: number) => string;
    /** "Aktualizováno před {n} minutami" — správně skloněné přímo pro daný jazyk (viz implementace níže). */
    updatedAgoMinutes: (minutes: number) => string;
    loadErrorNotice: string;
    drivingGoogleMapsAriaLabel: string;
    drivingAppleMapsAriaLabel: string;
    drivingMapyComAriaLabel: string;
    sourceLabel: string;
    sourceLinkLabel: string;
    disclaimerOccupancy: string;
    disclaimerNoReservation: string;
  };
};

const cs: Dictionary = {
  header: {
    subtitle: "Najdi nejbližší vstup a nech se k němu navigovat.",
    languageMenuLabel: "Vybrat jazyk",
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
    nightTransportLink: "Noční MHD",
  },
  parkAndRide: {
    sectionId: "pr-parkoviste",
    badgeLabel: "P+R",
    badgeAriaLabel: (station) => `Zobrazit P+R parkoviště u stanice ${station}`,
    toggleShow: "Zobrazit P+R parkoviště",
    toggleHide: "Skrýt P+R parkoviště",
    heading: "P+R parkoviště u pražského metra",
    subtitle: "Zaparkujte u metra a pokračujte do centra veřejnou dopravou.",
    nearStation: (station) => `u stanice ${station}`,
    distanceFromYou: (distance) => `${distance} od vás vzdušnou čarou`,
    freeOfTotal: (free, totalPlacesText) => `${free} z ${totalPlacesText} volných`,
    unmeasuredNotice: "Obsazenost se online nesleduje",
    capacityLabel: (placesText) => `Kapacita: ${placesText}`,
    staleNotice: (free) => `Poslední známý stav: ${czechPlaceCount(free)} volných`,
    updatedAgoMinutes: (minutes) => `Aktualizováno před ${minutes} ${minutes === 1 ? "minutou" : "minutami"}`,
    loadErrorNotice: "Aktuální obsazenost se nepodařilo načíst.",
    drivingGoogleMapsAriaLabel: "Spustit navigaci autem v Google Maps",
    drivingAppleMapsAriaLabel: "Spustit navigaci autem v Apple Maps",
    drivingMapyComAriaLabel: "Spustit navigaci autem v Mapy.com",
    sourceLabel: "Zdroj údajů o parkování: Golemio / Hlavní město Praha",
    sourceLinkLabel: "Parking.praha.eu",
    disclaimerOccupancy: "Obsazenost se může změnit během jízdy.",
    disclaimerNoReservation: "Parkovací místo nelze předem rezervovat.",
  },
};

const en: Dictionary = {
  header: {
    subtitle: "Find the nearest entrance and navigate to it.",
    languageMenuLabel: "Choose language",
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
    nightTransportLink: "Night transport",
  },
  parkAndRide: {
    sectionId: "park-and-ride",
    badgeLabel: "P+R",
    badgeAriaLabel: (station) => `Show P+R parking near ${station}`,
    toggleShow: "Show P+R parking",
    toggleHide: "Hide P+R parking",
    heading: "P+R parking near Prague Metro",
    subtitle: "Park near the metro and continue to the city centre by public transport.",
    nearStation: (station) => `near ${station}`,
    distanceFromYou: (distance) => `${distance} from you as the crow flies`,
    freeOfTotal: (free, totalPlacesText) => `${free} of ${totalPlacesText} free`,
    unmeasuredNotice: "Occupancy is not monitored online",
    capacityLabel: (placesText) => `Capacity: ${placesText}`,
    staleNotice: (free) => `Last known status: ${englishPlaceCount(free)} free`,
    updatedAgoMinutes: (minutes) => `Updated ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`,
    loadErrorNotice: "Current occupancy could not be loaded.",
    drivingGoogleMapsAriaLabel: "Start driving navigation in Google Maps",
    drivingAppleMapsAriaLabel: "Start driving navigation in Apple Maps",
    drivingMapyComAriaLabel: "Start driving navigation in Mapy.com",
    sourceLabel: "Parking data source: Golemio / City of Prague",
    sourceLinkLabel: "Parking.praha.eu",
    disclaimerOccupancy: "Occupancy may change while you're driving.",
    disclaimerNoReservation: "Parking spaces cannot be reserved in advance.",
  },
};

const de: Dictionary = {
  header: {
    subtitle: "Finden Sie den nächsten Eingang und lassen Sie sich zu Fuß dorthin navigieren.",
    languageMenuLabel: "Sprache auswählen",
    vulgarAriaLabelOn: "Derben Modus deaktivieren",
    vulgarAriaLabelOff: "Derben Modus aktivieren",
  },
  finder: {
    sectionId: "naechste-metro",
    heading: "Wo ist die nächste Metro?",
    headingVulgar: "Wo ist die verdammte Metro?!!",
    ctaLocating: "Standort wird ermittelt…",
    privacyNote: "Ihr Standort bleibt ausschließlich auf Ihrem Gerät.",
    status: {
      denied:
        "Der Zugriff auf den Standort wurde verweigert. Aktivieren Sie ihn in den Browsereinstellungen (meist das Schloss-/Standortsymbol neben der Adressleiste) und versuchen Sie es erneut.",
      unavailable: "Ihr Standort konnte nicht ermittelt werden. Prüfen Sie, ob GPS/Standort aktiviert ist, und versuchen Sie es erneut.",
      timeout: "Die Standortermittlung hat zu lange gedauert. Bitte versuchen Sie es erneut.",
      unsupported: "Dieser Browser unterstützt keine Standortbestimmung.",
    },
  },
  outsidePrague: {
    title: "Hier fährt die Prager Metro wirklich nicht mehr.",
    body: (stationName, distance) => `Der nächste Eingang befindet sich an der Station ${stationName}, ungefähr ${distance} Luftlinie entfernt.`,
    brnoTitle: "Nein, Brno hat wirklich keine Metro!",
    brnoBody: (stationName, distance) => `Die nächste Prager Metrostation ist ${stationName}, ungefähr ${distance} Luftlinie entfernt.`,
  },
  result: {
    entranceLabel: (label) => `Eingang ${label}`,
    wheelchair: "Barrierefrei zugänglich",
    googleMapsLabel: "Google Maps",
    appleMapsLabel: "Apple Maps",
    mapyComLabel: "Mapy.com",
    googleMapsAriaLabel: "Fußgängernavigation in Google Maps starten",
    appleMapsAriaLabel: "Fußgängernavigation in Apple Maps starten",
    mapyComAriaLabel: "Fußgängernavigation in Mapy.com starten",
    disclaimer: "Luftlinie, ungefähr — die tatsächliche Route zeigt die Navigation.",
  },
  map: {
    sectionId: "metroplan",
    heading: "Metroplan",
    subtitle: "Zoomen Sie in die Karte, verschieben Sie sie und tippen Sie auf eine Station, um Details anzuzeigen.",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    resetView: "Ansicht zurücksetzen",
    ariaLabel: "Schematischer Plan der Prager Metro, Linien A, B und C",
    stationAriaLabel: (name, lines) => `Station ${name}, Linie ${lines}`,
    closeSheet: "Schließen",
    findEntrances: "Eingänge dieser Station anzeigen",
    needLocation: "Um die Eingänge nach Entfernung zu sortieren, ermitteln Sie zuerst Ihren Standort.",
    getLocation: "Standort ermitteln",
  },
  ad: {
    label: "Werbung",
  },
  departures: {
    buttonLabel: "Abfahrten",
    buttonAriaLabel: (stationName) => `Abfahrten ab Station ${stationName}`,
    dialogCloseLabel: "Abfahrten schließen",
    nextHeading: "Nächste planmäßige Abfahrten",
    lastHeading: "Letzte planmäßige Metro",
    towards: (station) => `Richtung ${station}`,
    lineLabel: "Linie",
    directionGroupLabel: "Richtung",
    sourceLabel: "PID-Fahrplan",
    updatedLabel: "aktualisiert",
    checkInPidLitacka: "In PID Lítačka prüfen",
    loading: "Abfahrten werden geladen…",
    errorTitle: "Die Abfahrten konnten derzeit nicht geladen werden.",
    errorBody: "Bitte überprüfen Sie Ihre Verbindung in der App PID Lítačka.",
    staleTitle: "Der Fahrplan ist möglicherweise nicht aktuell.",
    staleBody: "Bitte überprüfen Sie die letzte Verbindung in PID Lítačka.",
    noDeparturesForSelection: "Für diese Linie und Richtung gibt es momentan keine Abfahrten.",
  },
  footer: {
    privacy: "Ihr Standort wird ausschließlich in Ihrem Browser verarbeitet und von dieser Website nicht übertragen.",
    dataLabel: "Verkehrsdaten:",
    licenseWord: "Lizenz",
    disclaimer: "Inoffizielles Projekt, nicht mit DPP oder PID verbunden.",
    nightTransportLink: "Nachtverkehr",
  },
  parkAndRide: {
    sectionId: "pr-parkplaetze",
    badgeLabel: "P+R",
    badgeAriaLabel: (station) => `P+R-Parkplätze bei ${station} anzeigen`,
    toggleShow: "P+R-Parkplätze anzeigen",
    toggleHide: "P+R-Parkplätze ausblenden",
    heading: "P+R-Parkplätze bei der Prager Metro",
    subtitle: "Parken Sie bei der Metro und fahren Sie mit öffentlichen Verkehrsmitteln weiter ins Zentrum.",
    nearStation: (station) => `bei Station ${station}`,
    distanceFromYou: (distance) => `${distance} von Ihnen Luftlinie`,
    freeOfTotal: (free, totalPlacesText) => `${free} von ${totalPlacesText} frei`,
    unmeasuredNotice: "Die Auslastung wird nicht online erfasst",
    capacityLabel: (placesText) => `Kapazität: ${placesText}`,
    staleNotice: (free) => `Letzter bekannter Stand: ${germanPlaceCount(free)} frei`,
    updatedAgoMinutes: (minutes) => `Aktualisiert vor ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`,
    loadErrorNotice: "Die aktuelle Auslastung konnte nicht geladen werden.",
    drivingGoogleMapsAriaLabel: "Autonavigation in Google Maps starten",
    drivingAppleMapsAriaLabel: "Autonavigation in Apple Maps starten",
    drivingMapyComAriaLabel: "Autonavigation in Mapy.com starten",
    sourceLabel: "Quelle der Parkdaten: Golemio / Stadt Prag",
    sourceLinkLabel: "Parking.praha.eu",
    disclaimerOccupancy: "Die Auslastung kann sich während der Fahrt ändern.",
    disclaimerNoReservation: "Parkplätze können nicht im Voraus reserviert werden.",
  },
};

const uk: Dictionary = {
  header: {
    subtitle: "Знайдіть найближчий вхід і відкрийте пішохідний маршрут до нього.",
    languageMenuLabel: "Вибрати мову",
    vulgarAriaLabelOn: "Вимкнути грубий режим",
    vulgarAriaLabelOff: "Увімкнути грубий режим",
  },
  finder: {
    sectionId: "znaity-metro",
    heading: "Де найближче метро?",
    headingVulgar: "Де це довбане метро?!!",
    ctaLocating: "Визначення місцезнаходження…",
    privacyNote: "Дані про ваше місцезнаходження залишаються лише на вашому пристрої.",
    status: {
      denied:
        "Доступ до місцезнаходження заборонено. Дозвольте його в налаштуваннях браузера (зазвичай іконка замка/локації біля адресного рядка) і спробуйте ще раз.",
      unavailable: "Не вдалося визначити місцезнаходження. Перевірте, чи увімкнено GPS/локацію, і спробуйте ще раз.",
      timeout: "Визначення місцезнаходження тривало надто довго. Спробуйте, будь ласка, ще раз.",
      unsupported: "Цей браузер не підтримує геолокацію.",
    },
  },
  outsidePrague: {
    title: "Сюди празьке метро справді не їздить.",
    body: (stationName, distance) => `Найближчий вхід розташований біля станції ${stationName}, приблизно за ${distance} по прямій.`,
    brnoTitle: "Ні, у Брно справді немає метро!",
    brnoBody: (stationName, distance) => `Найближча станція празького метро — ${stationName}, приблизно за ${distance} по прямій.`,
  },
  result: {
    entranceLabel: (label) => `Вхід ${label}`,
    wheelchair: "Безбар'єрний доступ",
    googleMapsLabel: "Google Maps",
    appleMapsLabel: "Apple Maps",
    mapyComLabel: "Mapy.com",
    googleMapsAriaLabel: "Відкрити пішохідний маршрут у Google Maps",
    appleMapsAriaLabel: "Відкрити пішохідний маршрут в Apple Maps",
    mapyComAriaLabel: "Відкрити пішохідний маршрут у Mapy.com",
    disclaimer: "Відстань по прямій, орієнтовно — фактичний маршрут покаже навігація.",
  },
  map: {
    sectionId: "skhema-metro",
    heading: "Схема метро",
    subtitle: "Збільшуйте й пересувайте схему та натисніть на станцію, щоб переглянути деталі.",
    zoomIn: "Збільшити",
    zoomOut: "Зменшити",
    resetView: "Скинути перегляд",
    ariaLabel: "Схематична карта празького метро, лінії A, B і C",
    stationAriaLabel: (name, lines) => `Станція ${name}, лінія ${lines}`,
    closeSheet: "Закрити",
    findEntrances: "Знайти входи цієї станції",
    needLocation: "Щоб відсортувати входи за відстанню, спершу визначте своє місцезнаходження.",
    getLocation: "Визначити місцезнаходження",
  },
  ad: {
    label: "Реклама",
  },
  departures: {
    buttonLabel: "Відправлення",
    buttonAriaLabel: (stationName) => `Відправлення зі станції ${stationName}`,
    dialogCloseLabel: "Закрити інформацію про відправлення",
    nextHeading: "Найближчі заплановані відправлення",
    lastHeading: "Останній запланований поїзд метро",
    towards: (station) => `у напрямку ${station}`,
    lineLabel: "Лінія",
    directionGroupLabel: "Напрямок",
    sourceLabel: "Розклад PID",
    updatedLabel: "оновлено",
    checkInPidLitacka: "Перевірити в PID Lítačka",
    loading: "Завантаження відправлень…",
    errorTitle: "Наразі не вдалося завантажити дані про відправлення.",
    errorBody: "Перевірте актуальне сполучення в застосунку PID Lítačka.",
    staleTitle: "Розклад може бути неактуальним.",
    staleBody: "Перевірте останній рейс у PID Lítačka.",
    noDeparturesForSelection: "Для цієї лінії та напрямку зараз немає відправлень.",
  },
  footer: {
    privacy: "Дані про ваше місцезнаходження обробляються лише у вашому браузері й не передаються цим сайтом.",
    dataLabel: "Транспортні дані:",
    licenseWord: "ліцензія",
    disclaimer: "Неофіційний проєкт, не пов’язаний із DPP або PID.",
    nightTransportLink: "Нічний транспорт",
  },
  parkAndRide: {
    sectionId: "pr-parkuvannia",
    badgeLabel: "P+R",
    badgeAriaLabel: (station) => `Показати паркування P+R біля станції ${station}`,
    toggleShow: "Показати паркування P+R",
    toggleHide: "Приховати паркування P+R",
    heading: "Паркування P+R біля празького метро",
    subtitle: "Припаркуйтеся біля метро і продовжте до центру громадським транспортом.",
    nearStation: (station) => `біля станції ${station}`,
    distanceFromYou: (distance) => `${distance} від вас по прямій`,
    freeOfTotal: (free, totalPlacesText) => `${free} з ${totalPlacesText} вільно`,
    unmeasuredNotice: "Заповненість онлайн не відстежується",
    capacityLabel: (placesText) => `Місткість: ${placesText}`,
    staleNotice: (free) => `Останній відомий стан: ${ukrainianPlaceCount(free)} вільно`,
    updatedAgoMinutes: (minutes) => `Оновлено ${minutes} ${minutes === 1 ? "хвилину" : minutes >= 2 && minutes <= 4 ? "хвилини" : "хвилин"} тому`,
    loadErrorNotice: "Не вдалося завантажити поточну заповненість.",
    drivingGoogleMapsAriaLabel: "Відкрити автомобільну навігацію в Google Maps",
    drivingAppleMapsAriaLabel: "Відкрити автомобільну навігацію в Apple Maps",
    drivingMapyComAriaLabel: "Відкрити автомобільну навігацію в Mapy.com",
    sourceLabel: "Джерело даних про паркування: Golemio / Місто Прага",
    sourceLinkLabel: "Parking.praha.eu",
    disclaimerOccupancy: "Заповненість може змінитися під час поїздки.",
    disclaimerNoReservation: "Паркомісце не можна забронювати заздалегідь.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { cs, en, de, uk };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Hlavní hláška — vulgar mode mění JEN tenhle jeden text (viz zadání). */
export function getMainHeading(locale: Locale, vulgar: boolean): string {
  const dict = getDictionary(locale);
  return vulgar ? dict.finder.headingVulgar : dict.finder.heading;
}
