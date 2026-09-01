// Stejná množina hodnot jako Locale (lib/i18n/types.ts) — samostatný
// typ v doméně reklam, ať je zadání čitelné 1:1 a reklamní systém
// nezávisí na budoucím rozšíření i18n Locale o jazyky, které reklamy
// (zatím) nepodporují.
export type Language = "cs" | "en";

// Uzavřená množina ikon pro reklamní kartu (viz zadání redesignu) —
// úmyslně restriktivní union, ne libovolný název React komponenty.
// Mapování hodnota → ikona žije jen v components/ads/AdIcon.tsx.
export type AdIcon = "pharmacy" | "shopping" | "luggage" | "ticket" | "esim" | "transfer";

export type AdCampaign = {
  id: string;
  enabled: boolean;
  languages: Language[];
  title: Partial<Record<Language, string>>;
  description: Partial<Record<Language, string>>;
  cta: Partial<Record<Language, string>>;
  /** null = affiliate odkaz zatím není doplněný (viz zadání). */
  href: string | null;
  /** null = název partnera zatím nezobrazujeme. */
  advertiser: string | null;
  /** Chybí = obecná nálepka (viz DEFAULT_ICON v AdIcon.tsx). */
  icon?: AdIcon;
  /** Konečné kladné číslo — viz lib/ads/weighted-select.ts. */
  weight: number;
  /** ISO 8601, porovnáváno v UTC — viz lib/ads/filter-campaigns.ts. */
  validFrom?: string;
  validTo?: string;
  /** Chybí = kampaň vhodná pro všechny stanice. */
  stationIds?: string[];
};

// Připraveno pro budoucí měření (viz zadání) — v této iteraci se nikam
// neodesílá, jen bezpečné no-op rozhraní (lib/ads/events.ts).
export type AdEvent =
  | { type: "ad_impression"; campaignId: string; language: Language; placement: string }
  | { type: "ad_click"; campaignId: string; language: Language; placement: string };
