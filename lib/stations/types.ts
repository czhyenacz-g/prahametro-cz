import type { MetroLine } from "../metro/types.ts";

/**
 * Externí odkaz průvodce stanicí — VŠECHNY URL žijí centrálně v
 * konfiguraci stanice (lib/stations/guides.ts), komponenty je jen
 * vykreslují podle `id`.
 */
export type GuideLink = {
  id: string;
  label: string;
  url: string;
  provider: "DPP" | "PID" | "Florenc.cz";
  type: "departures" | "accessibility" | "elevator-status" | "node-map" | "open-data";
  /** True = odkaz otevře přímo tuhle zastávku/stanici, false = obecný rozcestník, kde je potřeba ji vybrat. */
  direct: boolean;
  /** ISO datum, kdy byl odkaz při implementaci skutečně otevřen a zkontrolován — null = neověřeno. */
  verifiedAt: string | null;
  /** Upozornění zobrazené u odkazu (např. tabule obsahuje i jiná nádraží). */
  note?: string;
};

/** Sekce stránky, na které mohou mířit cíle "Kam potřebujete?" a interní kotvy. */
export type GuideSectionId = "mapa" | "stanoviste" | "prestup" | "bezbarierovost" | "dobre-vedet" | "otazky" | "zdroje";

export type GuideDestinationAction =
  /** Skok na sekci této stránky. */
  | { kind: "section"; sectionId: GuideSectionId }
  /** Externí odkaz z `links` (typicky odjezdy). */
  | { kind: "link"; linkId: string }
  /** Pěší navigace k místu podle NÁZVU (mapová služba ho dohledá) — žádné ručně odhadnuté souřadnice. */
  | { kind: "place"; query: string }
  /** Stanoviště, ze kterého podle aktuálních GTFS dat odjíždí daná linka (dohledá se při renderu z data/station-area-stops.json). */
  | { kind: "route"; routeName: string };

export type GuideDestination = {
  id: string;
  label: string;
  action: GuideDestinationAction;
};

export type GuideTextSection = {
  id: Extract<GuideSectionId, "prestup" | "bezbarierovost" | "dobre-vedet">;
  heading: string;
  paragraphs: readonly string[];
  /** id z `links` — zdroj tvrzení v sekci. */
  sourceIds: readonly string[];
};

export type GuideFaqItem = {
  question: string;
  answer: string;
  /** Volitelný odkaz pod odpovědí — interní kotva nebo id z `links`. */
  more?: { label: string; sectionId: GuideSectionId } | { label: string; linkId: string };
};

export type StationGuide = {
  slug: string;
  /** PID stationId (shodné s data/metro-entrances.json). */
  stationId: string;
  name: string;
  lines: readonly MetroLine[];
  seoTitle: string;
  seoDescription: string;
  h1: string;
  /** Jedna věta pod H1 (nad přehybem). */
  lead: string;
  /** Doplňující úvodní odstavec. */
  intro: string;
  /** Krátký popis hlavního užitku pro přehled /stanice. */
  overviewSummary: string;
  destinations: readonly GuideDestination[];
  /** Hlavní akce nad přehybem — první je primární. */
  actions: readonly GuideDestination[];
  sections: readonly GuideTextSection[];
  /** Nadpis/úvod sekce povrchových stanovišť — null = sekci nezobrazovat. */
  platforms: { heading: string; intro: string } | null;
  faq: readonly GuideFaqItem[];
  links: readonly GuideLink[];
};
