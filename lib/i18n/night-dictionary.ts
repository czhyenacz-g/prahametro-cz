import type { Locale } from "./types.ts";

// Samostatný slovník JEN pro interaktivní texty noční sekce — záměrně
// MIMO lib/i18n/dictionary.ts (ten prochází přes I18nContext do
// klientského JS bundlu na VŠECH stránkách včetně homepage, viz
// komentář tam). Night stránky ale I18nProvider/I18nContext PŘESTO
// používají (kvůli AdSlot/useSelectedAd/LanguageMenu) a hodně obecných
// textů (chybové stavy geolokace, popisky navigačních tlačítek, "Odkud
// jede" apod.) přímo přebírají z hlavního `dict` — viz
// components/night/*.tsx. Tenhle slovník nese jen texty, které v hlavním
// Dictionary NEEXISTUJÍ.
export type NightDictionary = {
  cta: string;
  subtitle: string;
  privacyNote: string;
  backToMetroLink: string;
  themeToggleToNight: string;
  themeToggleToLight: string;
  outsidePrague: string;
  noNightServiceTonight: string;
  duringDayNotice: string;
  scheduledDeparturesLabel: string;
  towardsLabel: (headsign: string) => string;
  platformLabel: (code: string) => string;
  datasetErrorTitle: string;
  datasetErrorBody: string;
};

const cs: NightDictionary = {
  cta: "Kde je nejbližší noční spoj?",
  subtitle: "Najdi nejbližší noční tramvaj nebo autobus a nech se k ní navigovat.",
  privacyNote: "Poloha zůstává jen ve vašem zařízení.",
  backToMetroLink: "Najít nejbližší metro",
  themeToggleToNight: "Zapnout noční vzhled",
  themeToggleToLight: "Zapnout světlý vzhled",
  outsidePrague: "Tady už pražská noční doprava opravdu nejezdí.",
  noNightServiceTonight: "Pro tuhle noc se v okolí nepodařilo najít žádný platný noční spoj.",
  duringDayNotice: "Zobrazené spoje patří nadcházející noci.",
  scheduledDeparturesLabel: "Plánované odjezdy",
  towardsLabel: (headsign) => `směr ${headsign}`,
  platformLabel: (code) => `nástupiště ${code}`,
  datasetErrorTitle: "Data noční dopravy se teď nepodařilo načíst.",
  datasetErrorBody: "Zkuste to prosím znovu, nebo ověřte spojení v aplikaci PID Lítačka.",
};

const en: NightDictionary = {
  cta: "Find the nearest night transport",
  subtitle: "Find the nearest night tram or bus and get walking directions to it.",
  privacyNote: "Your location stays only on your device.",
  backToMetroLink: "Find the nearest metro",
  themeToggleToNight: "Switch to night theme",
  themeToggleToLight: "Switch to light theme",
  outsidePrague: "Prague night transport really doesn't reach this far.",
  noNightServiceTonight: "No valid night service could be found nearby for this night.",
  duringDayNotice: "The departures shown belong to the upcoming night.",
  scheduledDeparturesLabel: "Scheduled departures",
  towardsLabel: (headsign) => `towards ${headsign}`,
  platformLabel: (code) => `platform ${code}`,
  datasetErrorTitle: "Night transport data couldn't be loaded right now.",
  datasetErrorBody: "Please try again, or check your connection in the PID Lítačka app.",
};

const de: NightDictionary = {
  cta: "Nächste Nachtverbindung finden",
  subtitle: "Finden Sie die nächste Nachttram oder den nächsten Nachtbus und lassen Sie sich zu Fuß dorthin navigieren.",
  privacyNote: "Ihr Standort bleibt ausschließlich auf Ihrem Gerät.",
  backToMetroLink: "Nächste Metro finden",
  themeToggleToNight: "Nachtansicht aktivieren",
  themeToggleToLight: "Helle Ansicht aktivieren",
  outsidePrague: "Hier fährt der Prager Nachtverkehr wirklich nicht mehr.",
  noNightServiceTonight: "Für diese Nacht konnte in der Nähe keine gültige Nachtverbindung gefunden werden.",
  duringDayNotice: "Die angezeigten Abfahrten gehören zur kommenden Nacht.",
  scheduledDeparturesLabel: "Planmäßige Abfahrten",
  towardsLabel: (headsign) => `Richtung ${headsign}`,
  platformLabel: (code) => `Steig ${code}`,
  datasetErrorTitle: "Die Daten des Nachtverkehrs konnten gerade nicht geladen werden.",
  datasetErrorBody: "Bitte versuchen Sie es erneut oder prüfen Sie die Verbindung in der App PID Lítačka.",
};

const uk: NightDictionary = {
  cta: "Знайти найближчий нічний транспорт",
  subtitle: "Знайдіть найближчий нічний трамвай або автобус і відкрийте до нього пішохідний маршрут.",
  privacyNote: "Дані про ваше місцезнаходження залишаються лише на вашому пристрої.",
  backToMetroLink: "Знайти найближче метро",
  themeToggleToNight: "Увімкнути нічний вигляд",
  themeToggleToLight: "Увімкнути світлий вигляд",
  outsidePrague: "Сюди празький нічний транспорт справді не їздить.",
  noNightServiceTonight: "На цю ніч поблизу не вдалося знайти жодного дійсного нічного сполучення.",
  duringDayNotice: "Показані відправлення належать до найближчої ночі.",
  scheduledDeparturesLabel: "Заплановані відправлення",
  towardsLabel: (headsign) => `у напрямку ${headsign}`,
  platformLabel: (code) => `платформа ${code}`,
  datasetErrorTitle: "Наразі не вдалося завантажити дані нічного транспорту.",
  datasetErrorBody: "Спробуйте, будь ласка, ще раз або перевірте сполучення в застосунку PID Lítačka.",
};

const nightDictionaries: Record<Locale, NightDictionary> = { cs, en, de, uk };

export function getNightDictionary(locale: Locale): NightDictionary {
  return nightDictionaries[locale];
}
