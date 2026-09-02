import type { Locale } from "../i18n/types.ts";
import type { FaqItem } from "./content.ts";

export type NightLineCategoryLabels = { tram: string; urbanBus: string; regionalBus: string };

export type NightSeoContent = {
  title: string;
  description: string;
  mainHeading: string;
  ogLocale: "cs_CZ" | "en_US" | "de_DE" | "uk_UA";
  intro: { id: string; heading: string; paragraphs: readonly [string, string] };
  lazarska: { heading: string; body: string };
  /** Šablona pro "Na letiště v noci" (zadání bod 15) — `lines` se doplní až za běhu ze skutečně nalezených letištních linek v index.json, nikdy natvrdo. */
  airport: { heading: string; template: (lines: readonly string[]) => string; noneFound: string };
  lineOverview: { id: string; heading: string; categories: NightLineCategoryLabels; variantsNotice: string };
  faq: { id: string; heading: string; items: readonly FaqItem[] };
};

const cs: NightSeoContent = {
  title: "Noční MHD v Praze – nejbližší tramvaj nebo autobus | KdeJeMetro.cz",
  description: "Najděte nejbližší zastávku noční tramvaje nebo autobusu v Praze, plánované odjezdy a pěší navigaci ke správnému nástupišti.",
  mainHeading: "Kde je nejbližší noční tramvaj nebo autobus?",
  ogLocale: "cs_CZ",
  intro: {
    id: "o-nocni-doprave",
    heading: "Jak cestovat Prahou v noci",
    paragraphs: [
      "Když metro nejezdí, dopravu po Praze zajišťují noční tramvaje a autobusy. KdeJeMetro.cz podle polohy najde nejbližší zastávky s platným spojem pro danou noc a umožní otevřít pěší navigaci ke konkrétnímu označníku.",
      "Páteř noční dopravy tvoří tramvajové linky 91–99, které se setkávají v centru v oblasti Lazarské. Doplňují je městské a příměstské noční autobusy. Konkrétní linky, trasy a odjezdy se načítají z aktuálního jízdního řádu PID.",
    ],
  },
  lazarska: {
    heading: "Noční tramvaje se setkávají na Lazarské",
    body: "Lazarská je hlavním přestupním bodem nočních tramvají v centru Prahy. Před cestou vždy zkontrolujte konkrétní plánovaný odjezd.",
  },
  airport: {
    heading: "Na letiště v noci",
    template: (lines) => `Aktuální noční spojení na Letiště Václava Havla zajišťují linky ${lines.join(", ")}. Ověřte si nejbližší plánovaný odjezd.`,
    noneFound: "Aktuální noční jízdní řád PID teď neuvádí žádnou noční linku obsluhující zastávky u letiště. Ověřte aktuální spojení v aplikaci PID Lítačka.",
  },
  lineOverview: {
    id: "nocni-linky",
    heading: "Aktuální noční linky",
    categories: { tram: "Noční tramvaje", urbanBus: "Městské noční autobusy", regionalBus: "Příměstské noční autobusy" },
    variantsNotice: "Některé spoje mohou mít kvůli výluce odlišnou konečnou — aktuální trasu ověřte v PID Lítačce.",
  },
  faq: {
    id: "caste-dotazy-nocni",
    heading: "Časté dotazy",
    items: [
      {
        question: "Kdy v Praze jezdí noční tramvaje a autobusy?",
        answer: "Noční doprava obvykle nahrazuje denní provoz přibližně mezi půlnocí a ranním začátkem provozu MHD. Přesné časy se liší podle linky, dne v týdnu a aktuálních výluk.",
      },
      {
        question: "Kde najdu nejbližší noční zastávku?",
        answer: "Po povolení polohy aplikace okamžitě ukáže tři nejbližší zastávkové skupiny s platným nočním spojem pro danou noc, seřazené podle vzdušné vzdálenosti.",
      },
      {
        question: "Jezdí v Praze metro celou noc?",
        answer: "Ne. Pražské metro celou noc běžně nejezdí — po skončení provozu ho nahrazují noční tramvaje a autobusy.",
      },
      {
        question: "Kde přestupují noční tramvaje?",
        answer: "Hlavním přestupním bodem nočních tramvajových linek 91–99 je zastávka Lazarská v centru Prahy.",
      },
      {
        question: "Jak se dostanu v noci na pražské letiště?",
        answer: "Letištní noční spojení se odvozuje z aktuálního jízdního řádu PID — konkrétní linky vidíte v přehledu níže. Vždy si ověřte nejbližší plánovaný odjezd.",
      },
      {
        question: "Platí v nočních spojích běžná jízdenka PID?",
        answer: "Tarifní podmínky nočních linek se řídí aktuálním sazebníkem PID — ověřte si je prosím v oficiálních zdrojích PID nebo v aplikaci PID Lítačka.",
      },
      {
        question: "Jsou zobrazené odjezdy aktuální?",
        answer: "Zobrazené odjezdy jsou plánované podle jízdního řádu PID, ne poloha vozidel v reálném čase. Skutečný odjezd se může lišit, zejména kvůli výlukám.",
      },
      {
        question: "Ukládá web moji polohu?",
        answer: "Ne. Poloha se zpracovává pouze ve vašem prohlížeči a nikam se neodesílá ani neukládá.",
      },
    ],
  },
};

const en: NightSeoContent = {
  title: "Prague Night Transport – Nearest Night Tram or Bus | KdeJeMetro.cz",
  description: "Find the nearest night tram or bus stop in Prague, check scheduled departures and open walking directions to the correct boarding point.",
  mainHeading: "Find the nearest night tram or bus in Prague",
  ogLocale: "en_US",
  intro: {
    id: "about-night-transport",
    heading: "Getting around Prague at night",
    paragraphs: [
      "When the metro is closed, Prague is served by night trams and buses. KdeJeMetro.cz uses your device location to find the nearest stops with scheduled service for the relevant night and lets you open walking directions to the correct boarding point.",
      "Night tram lines 91–99 form the backbone of Prague night transport and meet in the city centre around Lazarská. They are supplemented by urban and regional night buses. Current lines, routes and scheduled departures are generated from official PID timetable data.",
    ],
  },
  lazarska: {
    heading: "Night trams meet at Lazarská",
    body: "Lazarská is the main interchange point for Prague night trams in the city centre. Always check the scheduled departure for your specific journey.",
  },
  airport: {
    heading: "Getting to the airport at night",
    template: (lines) => `Current night service to Václav Havel Airport is provided by lines ${lines.join(", ")}. Check the nearest scheduled departure before you travel.`,
    noneFound: "The current PID night timetable doesn't currently list a night line serving the airport stops. Please check the PID Lítačka app for the latest connections.",
  },
  lineOverview: {
    id: "night-lines",
    heading: "Current night lines",
    categories: { tram: "Night trams", urbanBus: "City night buses", regionalBus: "Regional night buses" },
    variantsNotice: "Some services may end at a different terminus due to a diversion — check the current route in PID Lítačka.",
  },
  faq: {
    id: "faq-night",
    heading: "Frequently asked questions",
    items: [
      {
        question: "When do night trams and buses run in Prague?",
        answer: "Night transport typically replaces daytime service roughly between midnight and the early-morning start of regular service. Exact times vary by line, day of week and current diversions.",
      },
      {
        question: "Where can I find the nearest night stop?",
        answer: "Once you allow location access, the app instantly shows the three nearest stop groups with a valid night service for that night, sorted by straight-line distance.",
      },
      {
        question: "Does the Prague Metro run all night?",
        answer: "No. The Prague Metro doesn't normally run all night — once it closes, night trams and buses take over.",
      },
      {
        question: "Where do night trams interchange?",
        answer: "The main interchange point for night tram lines 91–99 is the Lazarská stop in the city centre.",
      },
      {
        question: "How do I get to the Prague airport at night?",
        answer: "Airport night service is derived from the current PID timetable — the specific lines are shown in the overview below. Always check the nearest scheduled departure.",
      },
      {
        question: "Is a regular PID ticket valid on night services?",
        answer: "Night line fare rules follow the current official PID tariff — please check the official PID sources or the PID Lítačka app.",
      },
      {
        question: "Are the departures shown up to date?",
        answer: "The departures shown are scheduled according to the PID timetable, not real-time vehicle positions. The actual departure may differ, especially during diversions.",
      },
      {
        question: "Does the site store my location?",
        answer: "No. Your location is processed only in your browser and is never sent anywhere or stored.",
      },
    ],
  },
};

const de: NightSeoContent = {
  title: "Nachtverkehr in Prag – nächste Nachttram oder Bus | KdeJeMetro.cz",
  description: "Finden Sie die nächste Haltestelle einer Nachttram oder eines Nachtbusses in Prag, planmäßige Abfahrten und den Fußweg zum richtigen Einstieg.",
  mainHeading: "Finden Sie die nächste Nachttram oder den nächsten Nachtbus in Prag",
  ogLocale: "de_DE",
  intro: {
    id: "ueber-nachtverkehr",
    heading: "Nachts unterwegs in Prag",
    paragraphs: [
      "Wenn die Metro geschlossen ist, wird Prag von Nachttrams und Nachtbussen bedient. KdeJeMetro.cz nutzt den Standort Ihres Geräts, um die nächsten Haltestellen mit planmäßigem Verkehr für die betreffende Nacht zu finden, und öffnet den Fußweg zum richtigen Einstieg.",
      "Das Rückgrat des Nachtverkehrs bilden die Nachttramlinien 91–99, die sich im Stadtzentrum bei Lazarská treffen. Ergänzt werden sie durch städtische und regionale Nachtbusse. Aktuelle Linien, Routen und Abfahrten werden aus dem offiziellen PID-Fahrplan erzeugt.",
    ],
  },
  lazarska: {
    heading: "Nachttrams treffen sich an der Lazarská",
    body: "Lazarská ist der wichtigste Umsteigepunkt der Prager Nachttrams im Stadtzentrum. Prüfen Sie vor der Fahrt immer die konkrete planmäßige Abfahrt.",
  },
  airport: {
    heading: "Nachts zum Flughafen",
    template: (lines) => `Die aktuelle Nachtverbindung zum Flughafen Václav Havel wird von den Linien ${lines.join(", ")} bedient. Prüfen Sie die nächste planmäßige Abfahrt.`,
    noneFound: "Der aktuelle PID-Nachtfahrplan weist derzeit keine Nachtlinie zu den Flughafenhaltestellen aus. Bitte prüfen Sie die aktuellen Verbindungen in der App PID Lítačka.",
  },
  lineOverview: {
    id: "nachtlinien",
    heading: "Aktuelle Nachtlinien",
    categories: { tram: "Nachttramlinien", urbanBus: "Städtische Nachtbuslinien", regionalBus: "Regionale Nachtbuslinien" },
    variantsNotice: "Einige Fahrten können wegen einer Umleitung an einer anderen Endstation enden — prüfen Sie die aktuelle Route in PID Lítačka.",
  },
  faq: {
    id: "haeufige-fragen-nacht",
    heading: "Häufig gestellte Fragen",
    items: [
      {
        question: "Wann fahren Nachttrams und Nachtbusse in Prag?",
        answer: "Der Nachtverkehr ersetzt in der Regel den Tagesverkehr etwa zwischen Mitternacht und dem frühmorgendlichen Beginn des regulären Betriebs. Die genauen Zeiten variieren je nach Linie, Wochentag und aktuellen Umleitungen.",
      },
      {
        question: "Wo finde ich die nächste Nachthaltestelle?",
        answer: "Sobald Sie den Standortzugriff erlauben, zeigt die App sofort die drei nächsten Haltestellengruppen mit gültiger Nachtverbindung für diese Nacht, sortiert nach Luftlinie.",
      },
      {
        question: "Fährt die Prager Metro die ganze Nacht?",
        answer: "Nein. Die Prager Metro fährt normalerweise nicht die ganze Nacht — nach Betriebsschluss übernehmen Nachttrams und Nachtbusse.",
      },
      {
        question: "Wo steigen Nachttrams um?",
        answer: "Der wichtigste Umsteigepunkt der Nachttramlinien 91–99 ist die Haltestelle Lazarská im Stadtzentrum.",
      },
      {
        question: "Wie komme ich nachts zum Prager Flughafen?",
        answer: "Die nächtliche Flughafenverbindung wird aus dem aktuellen PID-Fahrplan abgeleitet — die konkreten Linien sehen Sie in der Übersicht unten. Prüfen Sie immer die nächste planmäßige Abfahrt.",
      },
      {
        question: "Gilt ein normales PID-Ticket in den Nachtverbindungen?",
        answer: "Die Tarifregeln der Nachtlinien richten sich nach dem aktuellen offiziellen PID-Tarif — bitte prüfen Sie die offiziellen PID-Quellen oder die App PID Lítačka.",
      },
      {
        question: "Sind die angezeigten Abfahrten aktuell?",
        answer: "Die angezeigten Abfahrten sind planmäßig laut PID-Fahrplan, keine Echtzeit-Fahrzeugpositionen. Die tatsächliche Abfahrt kann abweichen, insbesondere bei Umleitungen.",
      },
      {
        question: "Speichert die Website meinen Standort?",
        answer: "Nein. Ihr Standort wird nur in Ihrem Browser verarbeitet und nirgendwohin gesendet oder gespeichert.",
      },
    ],
  },
};

const uk: NightSeoContent = {
  title: "Нічний транспорт у Празі – найближчий трамвай або автобус | KdeJeMetro.cz",
  description: "Знайдіть найближчу зупинку нічного трамвая або автобуса в Празі, перевірте заплановані відправлення та відкрийте піший маршрут.",
  mainHeading: "Знайдіть найближчий нічний трамвай або автобус у Празі",
  ogLocale: "uk_UA",
  intro: {
    id: "pro-nichnyi-transport",
    heading: "Як пересуватися Прагою вночі",
    paragraphs: [
      "Коли метро не працює, Прагу обслуговують нічні трамваї та автобуси. KdeJeMetro.cz за вашим місцезнаходженням знаходить найближчі зупинки з дійсним сполученням на цю ніч і дозволяє відкрити піший маршрут до потрібної платформи.",
      "Основу нічного транспорту складають трамвайні лінії 91–99, які сходяться в центрі біля зупинки Lazarská. Їх доповнюють міські та приміські нічні автобуси. Актуальні лінії, маршрути та відправлення завантажуються з офіційного розкладу PID.",
    ],
  },
  lazarska: {
    heading: "Нічні трамваї сходяться на Lazarská",
    body: "Lazarská — головний пересадковий вузол нічних трамваїв у центрі Праги. Перед поїздкою завжди перевіряйте конкретне заплановане відправлення.",
  },
  airport: {
    heading: "Нічне сполучення до аеропорту",
    template: (lines) => `Наразі нічне сполучення до аеропорту Вацлава Гавела забезпечують лінії ${lines.join(", ")}. Перевірте найближче заплановане відправлення.`,
    noneFound: "Актуальний нічний розклад PID наразі не містить жодної нічної лінії, що обслуговує зупинки біля аеропорту. Перевірте актуальне сполучення в застосунку PID Lítačka.",
  },
  lineOverview: {
    id: "nichni-linii",
    heading: "Актуальні нічні лінії",
    categories: { tram: "Нічні трамваї", urbanBus: "Міські нічні автобуси", regionalBus: "Приміські нічні автобуси" },
    variantsNotice: "Через обмеження руху деякі рейси можуть закінчуватися на іншій кінцевій — перевірте актуальний маршрут у PID Lítačka.",
  },
  faq: {
    id: "chasti-zapytannia-nich",
    heading: "Часті запитання",
    items: [
      {
        question: "Коли в Празі їздять нічні трамваї та автобуси?",
        answer: "Нічний транспорт зазвичай замінює денне сполучення приблизно з півночі до раннього ранкового початку звичайного руху. Точний час залежить від лінії, дня тижня та поточних обмежень.",
      },
      {
        question: "Де знайти найближчу нічну зупинку?",
        answer: "Щойно ви дозволите доступ до місцезнаходження, застосунок одразу покаже три найближчі групи зупинок із дійсним нічним сполученням на цю ніч, відсортовані за відстанню по прямій.",
      },
      {
        question: "Чи їздить празьке метро всю ніч?",
        answer: "Ні. Празьке метро зазвичай не працює всю ніч — після завершення руху його замінюють нічні трамваї та автобуси.",
      },
      {
        question: "Де пересідають нічні трамваї?",
        answer: "Головний пересадковий вузол нічних трамвайних ліній 91–99 — зупинка Lazarská в центрі Праги.",
      },
      {
        question: "Як дістатися вночі до празького аеропорту?",
        answer: "Нічне сполучення до аеропорту визначається на основі актуального розкладу PID — конкретні лінії показані в переліку нижче. Завжди перевіряйте найближче заплановане відправлення.",
      },
      {
        question: "Чи діє на нічних рейсах звичайний квиток PID?",
        answer: "Тарифні умови нічних ліній визначаються актуальним офіційним тарифом PID — перевірте, будь ласка, офіційні джерела PID або застосунок PID Lítačka.",
      },
      {
        question: "Чи актуальні показані відправлення?",
        answer: "Показані відправлення заплановані згідно з розкладом PID, а не є реальним положенням транспорту. Фактичне відправлення може відрізнятися, особливо під час обмежень руху.",
      },
      {
        question: "Чи зберігає сайт моє місцезнаходження?",
        answer: "Ні. Ваше місцезнаходження обробляється лише у вашому браузері й нікуди не надсилається та не зберігається.",
      },
    ],
  },
};

const nightSeoContents: Record<Locale, NightSeoContent> = { cs, en, de, uk };

export function getNightSeoContent(locale: Locale): NightSeoContent {
  return nightSeoContents[locale];
}
