import type { Locale } from "../i18n/types.ts";
import { PRAGUE_PRICES, SMS_NUMBER_DISPLAY, TARIFF_YEAR } from "./tariff.ts";

export { DURATION_LABEL, formatPrice } from "./picker-text.ts";

/**
 * Texty stránky jízdenek ve všech jazycích (cs/en/de/uk). Fakta (ceny,
 * kódy, pravidla) jsou VŽDY z ověřeného tarifu v lib/tickets/tariff.ts —
 * tady jen jejich znění. Bez JSX, aby šly testovat; odkazy uvnitř textu
 * jsou `Rich` segmenty a vykresluje je components/tickets/TicketsPage.tsx.
 * Server-only obsah — do klientského bundlu jde jen
 * lib/tickets/picker-text.ts.
 */
export type RichSegment = string | { text: string; href: string; external?: boolean };
export type Rich = readonly RichSegment[];

export type TicketsText = {
  seo: { title: string; description: string; h1: string; ogLocale: "cs_CZ" | "en_US" | "de_DE" | "uk_UA" };
  breadcrumb: string;
  intro: string;
  quick: {
    app: { title: string; text: string };
    sms: { title: string; text: string };
    machine: { title: string; text: string };
    from: (price: string) => string;
  };
  verifiedNote: (date: string) => string;
  sms: { heading: string; intro: string; knowHeading: string; know: readonly string[] };
  prices: {
    heading: string;
    caption: string;
    columns: { duration: string; app: string; paper: string; sms: string };
    note: string;
    discounts: Rich;
  };
  litacka: { heading: string; intro: string; whenHeading: string; when: readonly Rich[]; cta: string; ctaNote: string };
  noApp: { heading: string; items: readonly Rich[]; cardNote: Rich };
  validity: { heading: string; intro: Rich; items: readonly { term: string; description: string }[] };
  pid: { heading: string; text: string; links: readonly { text: string; href: string }[] };
  faqHeading: string;
  faq: readonly { question: string; answer: Rich }[];
  sources: { heading: string; note: (date: string) => string; labels: readonly string[] };
  footer: { haveTicket: Rich; findMetro: string };
  header: { findMetroAria: string };
};

const P30 = PRAGUE_PRICES[0];
const P90 = PRAGUE_PRICES[1];
const PID_TARIFF_URL = "https://pid.cz/jizdne-a-tarif/";

export function formatTicketDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (locale === "en") return `${day} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1]} ${year}`;
  if (locale === "cs") return `${day}. ${month}. ${year}`;
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

const cs: TicketsText = {
  seo: {
    title: `Jízdenky MHD Praha ${TARIFF_YEAR} – ceny, SMS a kde koupit | KdeJeMetro`,
    description:
      "Jak koupit jízdenku na metro, tramvaj nebo autobus v Praze? Ceny jízdenek, SMS jízdenka, PID Lítačka, platba kartou a pravidla označování.",
    h1: "Jak koupit jízdenku na MHD v Praze?",
    ogLocale: "cs_CZ",
  },
  breadcrumb: "Jízdenky",
  intro: "Metrem, tramvají i autobusem jezdíte v Praze na společné jízdenky PID. Koupíte je v aplikaci PID Lítačka, pomocí SMS nebo v automatu. Vyberte si:",
  quick: {
    app: { title: "Aplikace PID Lítačka", text: "Nejlevnější. Platí 1 minutu po nákupu." },
    sms: { title: "SMS jízdenka", text: "Bez aplikace, jen z českého čísla." },
    machine: { title: "Automat nebo terminál", text: "Mincemi nebo kartou, papírová jízdenka." },
    from: (price) => `od ${price}`,
  },
  verifiedNote: (date) => `Plnocenné jízdné pro Prahu, ověřeno podle PID a DPP ${date}.`,
  sms: {
    heading: "Připravit SMS jízdenku",
    intro: "Vyberte platnost a otevřete si předvyplněnou SMS. Odeslání i platba probíhají u vašeho operátora, ne na tomto webu.",
    knowHeading: "Co je dobré vědět o SMS jízdence",
    know: [
      "Koupíte ji jen z čísla českého operátora; se zahraniční SIM nefunguje.",
      "Musíte mít u operátora aktivní službu Premium SMS a být v dosahu mobilního signálu.",
      "Jízdenka přijde přibližně do dvou minut. Platí od chvíle, kdy ji dostanete.",
      "Platí jako přestupní jen v Praze (pásma P, 0, B). Neplatí ve vlacích PID, na příměstských linkách ve vnějších pásmech ani na lince AE.",
      `U jízdenek na 24 a 72 hodin je potřeba objednávku potvrdit SMS „Ano“ na ${SMS_NUMBER_DISPLAY}, zpoplatněnou podle tarifu operátora.`,
      "Operátor může za vyřízení účtovat další poplatek. PID označuje SMS jako nejméně výhodný způsob nákupu.",
      "Když jízdenku v době platnosti smažete, duplikát za 3 Kč získáte SMS DPTA na číslo 900 06 03.",
    ],
  },
  prices: {
    heading: `Ceny jízdenek v Praze (${TARIFF_YEAR})`,
    caption: "Plnocenné jízdné pro cestování po Praze (pásma P, 0, B), dospělí od 15 do 60 let.",
    columns: { duration: "Platnost", app: "PID Lítačka", paper: "Papírová", sms: "SMS" },
    note: "Jízdenka v aplikaci PID Lítačka je vždy nejlevnější. SMS jízdenka je u 30 a 90 minut dražší než papírová, u 24 a 72 hodin stojí stejně. Hodí se, když nechcete instalovat aplikaci a máte české telefonní číslo.",
    discounts: [
      "Děti do 15 let a senioři od 65 let jezdí v Praze zdarma (s prokázáním nároku), senioři 60–65 let mají zvýhodněné jízdné. Podmínky a zvýhodněné ceny najdete v ",
      { text: "ceníku PID", href: PID_TARIFF_URL, external: true },
      ".",
    ],
  },
  litacka: {
    heading: "Jízdenka v aplikaci PID Lítačka",
    intro:
      "PID Lítačka je oficiální aplikace Pražské integrované dopravy. Vyhledáte v ní spojení a koupíte elektronickou jízdenku pro Prahu i pro další cesty po PID — jen si vyberte správnou jízdenku.",
    whenHeading: "Kdy jízdenka začne platit",
    when: [
      ["Při volbě „Ihned po nákupu“ jízdenka platí 1 minutu po zakoupení. Kupte ji tedy nejpozději minutu před vstupem do metra nebo před odjezdem spoje."],
      ["Jízdenka koupená „do zásoby“ (aktivace „Později ručně“) neplatí, dokud ji neaktivujete."],
      ["Jízdenka aktivovaná až ve vozidle nebo po výzvě revizora se za platnou neuznává."],
      ["K aktivaci potřebujete datové připojení; potom už ho po dobu platnosti nepotřebujete."],
    ],
    cta: "Otevřít PID Lítačku",
    ctaNote: "Otevře se oficiální web PID Lítačky (app.pidlitacka.cz) v novém panelu.",
  },
  noApp: {
    heading: "Kde koupit jízdenku bez aplikace?",
    items: [
      [
        "Automaty na jízdenky najdete ve vestibulech metra, na zastávkách a na letišti. Tlačítkové automaty berou jen mince, dotykové mince i platební karty. Jízdenku z automatu musíte před vstupem do metra nebo do vozidla označit.",
      ],
      ["Dotykové samoobslužné terminály přijímají platební karty. Jízdenka z nich má už natištěný čas a pásmo, takže se neoznačuje."],
      [
        "V tramvaji, autobusu a trolejbusu koupíte jízdenku na 30 minut, 90 minut nebo 24 hodin v terminálu jen bezkontaktní platbou (v tramvaji uprostřed vozu, v autobusu a trolejbusu u druhých dveří). Platí hned od nákupu, neoznačuje se.",
      ],
      ["Infocentra DPP, trafiky a obchody prodávají papírové jízdenky bez časového razítka — ty je nutné označit."],
    ],
    cardNote: ["Kartou v Praze platíte nákup jízdenky, ne samotnou jízdu. V metru se neodbavíte jen přiložením platební karty — do metra vstupujete až s platnou jízdenkou."],
  },
  validity: {
    heading: "Kdy musím mít platnou jízdenku?",
    intro: [
      "Do přepravního prostoru metra smíte vstoupit a do tramvaje či autobusu nastoupit jen s platnou jízdenkou. Kdy jízdenka začne platit, záleží na tom, jakou máte:",
    ],
    items: [
      {
        term: "Papírová jízdenka bez razítka",
        description: "Platí od označení v označovači. Označte ji jednou, při vstupu do metra nebo hned po nástupu do vozidla. Opakované označení ji znehodnotí.",
      },
      { term: "Jízdenka s natištěným časem", description: "Z terminálu, od řidiče nebo z pokladny Českých drah. Platí od nákupu a neoznačuje se." },
      { term: "Jízdenka v PID Lítačce", description: "Platí 1 minutu po aktivaci „Ihned po nákupu“, nebo od času, který si při aktivaci nastavíte." },
      { term: "SMS jízdenka", description: "Platí až od doručení SMS s jízdenkou. Samotné odeslání objednávky nestačí." },
    ],
  },
  pid: {
    heading: "Co je PID?",
    text: "Pražská integrovaná doprava (PID) je společný dopravní systém Prahy a Středočeského kraje: metro, tramvaje, autobusy, vybrané vlaky a další doprava jezdí na stejné jízdenky. Ceny na této stránce platí pro Prahu (pásma P, 0, B); pro cesty mimo Prahu platí jiné jízdenky podle tarifních pásem.",
    links: [
      { text: "pid.cz", href: "https://pid.cz/" },
      { text: "Jízdné a tarif PID", href: PID_TARIFF_URL },
    ],
  },
  faqHeading: "Časté otázky",
  faq: [
    {
      question: "Kolik stojí jízdenka na metro v Praze?",
      answer: [
        `Základní jízdenka na 30 minut stojí ${P30.paper} Kč (papírová), ${P30.app} Kč v aplikaci PID Lítačka a ${P30.sms} Kč jako SMS. Jízdenka na 90 minut stojí ${P90.paper} Kč, ${P90.app} Kč v aplikaci a ${P90.sms} Kč jako SMS. Jde o plnocenné jízdné pro dospělé od 15 do 60 let; všechny ceny jsou v `,
        { text: "tabulce", href: "#ceny" },
        ".",
      ],
    },
    {
      question: "Jak koupit SMS jízdenku v Praze?",
      answer: [
        `Z českého telefonního čísla s aktivní službou Premium SMS pošlete text DPT42 (30 minut), DPT55 (90 minut), DPT150 (24 hodin) nebo DPT350 (72 hodin) na číslo ${SMS_NUMBER_DISPLAY}. Jízdenka přijde zpět SMS zprávou přibližně do dvou minut. U jízdenek na 24 a 72 hodin je potřeba objednávku potvrdit SMS „Ano“. Zprávu si můžete `,
        { text: "připravit tady na stránce", href: "#sms" },
        ".",
      ],
    },
    { question: "Na jaké číslo poslat SMS jízdenku?", answer: [`Na číslo ${SMS_NUMBER_DISPLAY} (bez mezery 90206). Text zprávy je DPT a cena jízdenky, například DPT42.`] },
    {
      question: "Platí SMS jízdenka i v metru?",
      answer: [
        "Ano. SMS jízdenka platí jako přestupní v Praze v pásmech P, 0 a B — v metru, tramvajích, autobusech i trolejbusech. Do metra ale smíte vstoupit až s již přijatou SMS jízdenkou. Neplatí ve vlacích PID, na příměstských linkách ve vnějších pásmech ani na lince AE na letiště.",
      ],
    },
    {
      question: "Kde koupit jízdenku na metro kartou?",
      answer: [
        "Kartou zaplatíte v dotykových jízdenkových automatech (tlačítkové automaty berou jen mince) a v dotykových samoobslužných terminálech. V tramvajích, autobusech a trolejbusech koupíte jízdenku na 30 minut, 90 minut nebo 24 hodin v terminálu jen bezkontaktní platbou. Kartou platíte i v aplikaci PID Lítačka. Samotné přiložení karty jízdenku nenahrazuje.",
      ],
    },
    {
      question: "Musím jízdenku označit?",
      answer: [
        "Jen papírovou jízdenku, na které není natištěno datum, čas a pásmo — tedy jízdenku z tlačítkového nebo dotykového automatu, z infocentra nebo z trafiky. Označuje se jednou, před vstupem do přepravního prostoru metra nebo hned po nástupu do tramvaje či autobusu. Jízdenky z terminálů, z pokladny Českých drah a od řidiče už časové razítko mají; jízdenka v aplikaci a SMS jízdenka se neoznačují.",
      ],
    },
    {
      question: "Kdy začíná platit SMS jízdenka?",
      answer: ["Až ve chvíli, kdy vám přijde SMS s jízdenkou — ne po odeslání objednávky. Do té doby nesmíte vstoupit do metra ani nastoupit do vozidla."],
    },
    {
      question: "Mohu jet na jednu jízdenku metrem i tramvají?",
      answer: [
        "Ano. Jízdenky na 30 a 90 minut i na 24 a 72 hodin platí ve všech druzích dopravy PID a během jejich platnosti můžete neomezeně přestupovat. Výjimkou je linka AE na letiště; jízdenky na 30 a 90 minut navíc neplatí na lanové dráze na Petřín.",
      ],
    },
    {
      question: "Platí pražská jízdenka také na letiště?",
      answer: [
        "Ano, na autobusy 59 (z ",
        { text: "Nádraží Veleslavín", href: "/stanice/nadrazi-veleslavin" },
        ") a 100 (ze ",
        { text: "Zličína", href: "/stanice/zlicin" },
        `) platí běžná jízdenka PID; PID doporučuje 90minutovou (${P90.paper} Kč, v aplikaci ${P90.app} Kč, SMS ${P90.sms} Kč). Na lince AE (Airport Express) platí zvláštní tarif 200 Kč — běžná ani SMS jízdenka tam neplatí.`,
      ],
    },
    {
      question: "Funguje SMS jízdenka se zahraniční SIM?",
      answer: ["Ne. SMS jízdenku lze koupit jen z čísla českého mobilního operátora. Se zahraniční SIM použijte aplikaci PID Lítačka nebo automat."],
    },
  ],
  sources: {
    heading: "Oficiální zdroje",
    note: (date) => `Ceny a pravidla jsme ověřili ${date}. KdeJeMetro.cz jízdenky neprodává; při rozporu platí podmínky PID a DPP.`,
    labels: [
      "Jízdné a tarif (ceník jízdného v Praze)",
      "Jak pořídit jízdenku",
      "SMS jízdenka",
      "Ceník jízdného DPP",
      "Mobilní aplikace PID Lítačka (aktivace jízdenky)",
      "Tarifní pásma a přestupnost jízdenek",
      "Doprava na letiště a nádraží",
    ],
  },
  footer: {
    haveTicket: ["Máte jízdenku? ", { text: "Najděte nejbližší metro", href: "/#najit-metro" }, " nebo si projděte ", { text: "průvodce stanicemi", href: "/stanice" }, "."],
    findMetro: "Najít nejbližší metro",
  },
  header: { findMetroAria: "Najít nejbližší metro podle polohy" },
};

const en: TicketsText = {
  seo: {
    title: `Prague Public Transport Tickets ${TARIFF_YEAR} – Prices, SMS & Where to Buy | KdeJeMetro`,
    description:
      "How to buy a ticket for the metro, tram or bus in Prague: ticket prices, SMS ticket, the PID Lítačka app, paying by card and when to validate your ticket.",
    h1: "How to buy a public transport ticket in Prague",
    ogLocale: "en_US",
  },
  breadcrumb: "Tickets",
  intro: "Metro, trams and buses in Prague all use the same PID tickets. You can buy them in the PID Lítačka app, by SMS or from a ticket machine. Choose:",
  quick: {
    app: { title: "PID Lítačka app", text: "Cheapest. Valid 1 minute after purchase." },
    sms: { title: "SMS ticket", text: "Czech SIM card only." },
    machine: { title: "Machine or terminal", text: "Coins or card, paper ticket." },
    from: (price) => `from ${price}`,
  },
  verifiedNote: (date) => `Full fare for Prague, checked against PID and DPP on ${date}.`,
  sms: {
    heading: "Prepare an SMS ticket",
    intro: "Choose the validity and open a pre-filled text message. Sending and payment go through your mobile operator, not through this website.",
    knowHeading: "Good to know about SMS tickets",
    know: [
      "Only works from a Czech mobile number — not with a foreign SIM card.",
      "Premium SMS must be enabled with your operator and you need mobile signal.",
      "The ticket arrives within about two minutes. It is valid from the moment you receive it.",
      "Valid only in Prague (zones P, 0, B), with transfers. Not valid on PID trains, on suburban lines in the outer zones or on the AE airport line.",
      `For 24-hour and 72-hour tickets you must confirm the order by replying "Ano" (yes) to ${SMS_NUMBER_DISPLAY}; this message is charged by your operator.`,
      "Your operator may charge an extra fee. PID calls SMS the least favourable way to buy a ticket.",
      "If you delete the ticket while it is valid, text DPTA to 900 06 03 for a duplicate (CZK 3).",
    ],
  },
  prices: {
    heading: `Ticket prices in Prague (${TARIFF_YEAR})`,
    caption: "Full fare for travel within Prague (zones P, 0, B), adults aged 15 to 60.",
    columns: { duration: "Validity", app: "PID Lítačka", paper: "Paper", sms: "SMS" },
    note: "A ticket in the PID Lítačka app is always the cheapest. SMS tickets cost more than paper tickets for 30 and 90 minutes and the same for 24 and 72 hours. SMS is handy if you have a Czech number and don't want to install an app.",
    discounts: [
      "Children under 15 and seniors aged 65+ travel free in Prague (proof of entitlement required); seniors aged 60–65 get a reduced fare. Conditions and reduced prices are in the ",
      { text: "PID fare list (in Czech)", href: PID_TARIFF_URL, external: true },
      ".",
    ],
  },
  litacka: {
    heading: "Ticket in the PID Lítačka app",
    intro:
      "PID Lítačka is the official app of Prague Integrated Transport (PID). You can plan your journey and buy an electronic ticket for Prague and for other PID trips — just pick the right ticket. The app is also available in English.",
    whenHeading: "When the ticket becomes valid",
    when: [
      ['With "Immediately after purchase" activation the ticket is valid 1 minute after you buy it. Buy it at least a minute before entering the metro or before your bus or tram leaves.'],
      ['A ticket bought "for later" (manual activation) is not valid until you activate it.'],
      ["A ticket activated only inside the vehicle or after a ticket inspector asks for it is not accepted."],
      ["You need mobile data to activate a ticket; after that you don't need it while the ticket is valid."],
    ],
    cta: "Open PID Lítačka",
    ctaNote: "Opens the official PID Lítačka website (app.pidlitacka.cz) in a new tab.",
  },
  noApp: {
    heading: "Where to buy a ticket without the app",
    items: [
      [
        "Ticket machines are in metro station halls, at stops and at the airport. Button machines take coins only; touch-screen machines take coins and payment cards. A ticket from a machine must be validated before you enter the metro or board a vehicle.",
      ],
      ["Touch-screen self-service terminals accept payment cards. Their tickets already show the time and zone, so you don't validate them."],
      [
        "In trams, buses and trolleybuses you can buy a 30-minute, 90-minute or 24-hour ticket at the terminal, contactless only (in trams in the middle of the vehicle, in buses and trolleybuses by the second door). It is valid immediately and isn't validated.",
      ],
      ["DPP information centres, newsagents and shops sell paper tickets without a time stamp — these must be validated."],
    ],
    cardNote: [
      "In Prague you pay by card for the ticket, not for the ride itself. You can't simply tap a bank card to travel on the metro — you must already have a valid ticket when you enter.",
    ],
  },
  validity: {
    heading: "When do I need a valid ticket?",
    intro: ["You may enter the metro's paid area or board a tram or bus only with a valid ticket. When your ticket starts to be valid depends on the type:"],
    items: [
      {
        term: "Paper ticket without a time stamp",
        description: "Valid from validation in the yellow validator. Validate it once — when entering the metro or right after boarding. Validating it again makes it invalid.",
      },
      { term: "Ticket with a printed time", description: "From a terminal, a driver or a Czech Railways counter. Valid from purchase, no validation." },
      { term: "Ticket in PID Lítačka", description: 'Valid 1 minute after "Immediately after purchase" activation, or from the time you set when activating.' },
      { term: "SMS ticket", description: "Valid only once you receive the SMS with the ticket. Sending the order is not enough." },
    ],
  },
  pid: {
    heading: "What is PID?",
    text: "Prague Integrated Transport (PID) is the shared transport system of Prague and the Central Bohemian Region: metro, trams, buses, selected trains and other services all use the same tickets. Prices on this page are for Prague (zones P, 0, B); trips outside Prague need other tickets according to the fare zones.",
    links: [
      { text: "pid.cz", href: "https://pid.cz/" },
      { text: "PID fares (in Czech)", href: PID_TARIFF_URL },
    ],
  },
  faqHeading: "Frequently asked questions",
  faq: [
    {
      question: "How much is a metro ticket in Prague?",
      answer: [
        `A basic 30-minute ticket costs CZK ${P30.paper} (paper), CZK ${P30.app} in the PID Lítačka app and CZK ${P30.sms} by SMS. A 90-minute ticket costs CZK ${P90.paper}, CZK ${P90.app} in the app and CZK ${P90.sms} by SMS. These are full fares for adults aged 15–60; see the `,
        { text: "price table", href: "#ceny" },
        ".",
      ],
    },
    {
      question: "How do I buy an SMS ticket in Prague?",
      answer: [
        `From a Czech mobile number with Premium SMS enabled, text DPT42 (30 minutes), DPT55 (90 minutes), DPT150 (24 hours) or DPT350 (72 hours) to ${SMS_NUMBER_DISPLAY}. The ticket arrives by SMS within about two minutes. 24-hour and 72-hour tickets must be confirmed by replying "Ano". You can `,
        { text: "prepare the message on this page", href: "#sms" },
        ".",
      ],
    },
    { question: "What number do I send the SMS ticket to?", answer: [`${SMS_NUMBER_DISPLAY} (90206 without the space). The text is DPT plus the ticket price, for example DPT42.`] },
    {
      question: "Is the SMS ticket valid on the metro?",
      answer: [
        "Yes. The SMS ticket is valid in Prague zones P, 0 and B with transfers — on the metro, trams, buses and trolleybuses. But you may enter the metro only once you have received the SMS ticket. It is not valid on PID trains, suburban lines in the outer zones or the AE airport line.",
      ],
    },
    {
      question: "Where can I buy a metro ticket by card?",
      answer: [
        "You can pay by card at touch-screen ticket machines (button machines take coins only) and at touch-screen self-service terminals. In trams, buses and trolleybuses the on-board terminal sells 30-minute, 90-minute and 24-hour tickets, contactless only. You also pay by card in the PID Lítačka app. Tapping your card alone is not a ticket.",
      ],
    },
    {
      question: "Do I have to validate my ticket?",
      answer: [
        "Only a paper ticket without a printed date, time and zone — i.e. from a button or touch-screen machine, an information centre or a newsagent. Validate it once, before entering the metro's paid area or right after boarding a tram or bus. Tickets from terminals, Czech Railways counters and drivers already have a time stamp; app and SMS tickets are never validated.",
      ],
    },
    {
      question: "When does an SMS ticket start to be valid?",
      answer: ["Only when you receive the SMS with the ticket — not when you send the order. Until then you may not enter the metro or board a vehicle."],
    },
    {
      question: "Can I use one ticket for both the metro and a tram?",
      answer: [
        "Yes. 30- and 90-minute tickets as well as 24- and 72-hour tickets are valid on all PID transport and you can transfer as often as you like while they are valid. The exception is the AE airport line; 30- and 90-minute tickets are also not valid on the Petřín funicular.",
      ],
    },
    {
      question: "Is a Prague ticket valid to the airport?",
      answer: [
        `Yes, a regular PID ticket is valid on bus 59 (from Nádraží Veleslavín) and bus 100 (from Zličín); PID recommends the 90-minute ticket (CZK ${P90.paper}, CZK ${P90.app} in the app, CZK ${P90.sms} by SMS). The AE (Airport Express) has its own fare of CZK 200 — regular and SMS tickets are not valid there.`,
      ],
    },
    {
      question: "Does the SMS ticket work with a foreign SIM card?",
      answer: ["No. SMS tickets can only be bought from a Czech mobile operator's number. With a foreign SIM, use the PID Lítačka app or a ticket machine."],
    },
  ],
  sources: {
    heading: "Official sources",
    note: (date) => `We checked prices and rules on ${date}. KdeJeMetro.cz does not sell tickets; if anything differs, the PID and DPP conditions apply. Sources are in Czech.`,
    labels: [
      "Fares and tariff (Prague fare list)",
      "How to buy a ticket",
      "SMS ticket",
      "DPP fare list",
      "PID Lítačka mobile app (ticket activation)",
      "Fare zones and transfers",
      "Transport to the airport and stations",
    ],
  },
  footer: {
    haveTicket: ["Got your ticket? ", { text: "Find the nearest metro", href: "/en#find-entrance" }, "."],
    findMetro: "Find the nearest metro",
  },
  header: { findMetroAria: "Find the nearest metro by location" },
};

const de: TicketsText = {
  seo: {
    title: `Fahrkarten ÖPNV Prag ${TARIFF_YEAR} – Preise, SMS & Kauf | KdeJeMetro`,
    description:
      "Wie kauft man in Prag eine Fahrkarte für Metro, Straßenbahn oder Bus? Fahrpreise, SMS-Ticket, die App PID Lítačka, Kartenzahlung und Entwertung.",
    h1: "Wie kaufe ich in Prag eine Fahrkarte für den ÖPNV?",
    ogLocale: "de_DE",
  },
  breadcrumb: "Fahrkarten",
  intro: "Metro, Straßenbahn und Bus fahren in Prag mit denselben PID-Fahrkarten. Sie kaufen sie in der App PID Lítačka, per SMS oder am Automaten. Wählen Sie:",
  quick: {
    app: { title: "App PID Lítačka", text: "Am günstigsten. Gültig 1 Minute nach dem Kauf." },
    sms: { title: "SMS-Ticket", text: "Nur mit tschechischer SIM-Karte." },
    machine: { title: "Automat oder Terminal", text: "Münzen oder Karte, Papierfahrkarte." },
    from: (price) => `ab ${price}`,
  },
  verifiedNote: (date) => `Normaltarif für Prag, geprüft bei PID und DPP am ${date}.`,
  sms: {
    heading: "SMS-Ticket vorbereiten",
    intro: "Wählen Sie die Gültigkeit und öffnen Sie eine vorausgefüllte SMS. Versand und Bezahlung laufen über Ihren Mobilfunkanbieter, nicht über diese Website.",
    knowHeading: "Gut zu wissen zum SMS-Ticket",
    know: [
      "Nur von einer tschechischen Mobilnummer — mit ausländischer SIM-Karte funktioniert es nicht.",
      "Premium-SMS muss bei Ihrem Anbieter aktiviert sein und Sie brauchen Mobilfunkempfang.",
      "Das Ticket kommt in etwa zwei Minuten. Es gilt ab dem Moment, in dem Sie es erhalten.",
      "Gilt nur in Prag (Zonen P, 0, B) mit Umsteigen. Nicht gültig in PID-Zügen, auf Regionallinien in den Außenzonen und auf der Flughafenlinie AE.",
      `Für 24- und 72-Stunden-Tickets müssen Sie die Bestellung mit der SMS „Ano“ (ja) an ${SMS_NUMBER_DISPLAY} bestätigen; diese SMS kostet nach Tarif Ihres Anbieters.`,
      "Ihr Anbieter kann eine zusätzliche Gebühr berechnen. PID bezeichnet die SMS als ungünstigste Kaufart.",
      "Wenn Sie das Ticket während der Gültigkeit löschen, erhalten Sie mit der SMS DPTA an 900 06 03 ein Duplikat (3 CZK).",
    ],
  },
  prices: {
    heading: `Fahrpreise in Prag (${TARIFF_YEAR})`,
    caption: "Normaltarif für Fahrten in Prag (Zonen P, 0, B), Erwachsene von 15 bis 60 Jahren.",
    columns: { duration: "Gültigkeit", app: "PID Lítačka", paper: "Papier", sms: "SMS" },
    note: "Die Fahrkarte in der App PID Lítačka ist immer am günstigsten. Das SMS-Ticket ist für 30 und 90 Minuten teurer als Papier, für 24 und 72 Stunden gleich teuer. Es lohnt sich, wenn Sie eine tschechische Nummer haben und keine App installieren möchten.",
    discounts: [
      "Kinder unter 15 Jahren und Senioren ab 65 fahren in Prag kostenlos (mit Nachweis), Senioren von 60 bis 65 haben einen ermäßigten Tarif. Bedingungen und ermäßigte Preise finden Sie in der ",
      { text: "PID-Preisliste (auf Tschechisch)", href: PID_TARIFF_URL, external: true },
      ".",
    ],
  },
  litacka: {
    heading: "Fahrkarte in der App PID Lítačka",
    intro:
      "PID Lítačka ist die offizielle App des Prager Integrierten Verkehrs (PID). Sie finden darin Verbindungen und kaufen eine elektronische Fahrkarte für Prag und weitere Fahrten im PID — wählen Sie einfach die richtige Fahrkarte.",
    whenHeading: "Ab wann die Fahrkarte gilt",
    when: [
      ["Bei der Aktivierung „Sofort nach dem Kauf“ gilt die Fahrkarte 1 Minute nach dem Kauf. Kaufen Sie sie also spätestens eine Minute vor dem Betreten der Metro oder vor der Abfahrt."],
      ["Eine „auf Vorrat“ gekaufte Fahrkarte (manuelle Aktivierung) gilt erst, wenn Sie sie aktivieren."],
      ["Eine erst im Fahrzeug oder nach Aufforderung durch den Kontrolleur aktivierte Fahrkarte wird nicht anerkannt."],
      ["Für die Aktivierung brauchen Sie mobile Daten; danach während der Gültigkeit nicht mehr."],
    ],
    cta: "PID Lítačka öffnen",
    ctaNote: "Öffnet die offizielle Website von PID Lítačka (app.pidlitacka.cz) in einem neuen Tab.",
  },
  noApp: {
    heading: "Wo kaufe ich eine Fahrkarte ohne App?",
    items: [
      [
        "Fahrkartenautomaten finden Sie in den Metro-Vestibülen, an Haltestellen und am Flughafen. Tastenautomaten nehmen nur Münzen, Touchscreen-Automaten Münzen und Zahlungskarten. Eine Fahrkarte vom Automaten müssen Sie vor dem Betreten der Metro oder beim Einsteigen entwerten.",
      ],
      ["Touchscreen-Selbstbedienungsterminals akzeptieren Zahlungskarten. Deren Fahrkarten tragen bereits Uhrzeit und Zone und werden nicht entwertet."],
      [
        "In Straßenbahn, Bus und Obus kaufen Sie am Terminal eine Fahrkarte für 30 Minuten, 90 Minuten oder 24 Stunden, nur kontaktlos (in der Straßenbahn in der Wagenmitte, im Bus und Obus an der zweiten Tür). Sie gilt sofort und wird nicht entwertet.",
      ],
      ["DPP-Infozentren, Kioske und Geschäfte verkaufen Papierfahrkarten ohne Zeitstempel — diese müssen entwertet werden."],
    ],
    cardNote: [
      "Mit der Karte bezahlen Sie in Prag den Kauf der Fahrkarte, nicht die Fahrt selbst. In der Metro reicht es nicht, die Bankkarte hinzuhalten — Sie brauchen beim Betreten bereits eine gültige Fahrkarte.",
    ],
  },
  validity: {
    heading: "Wann brauche ich eine gültige Fahrkarte?",
    intro: ["Den kontrollierten Bereich der Metro dürfen Sie nur mit gültiger Fahrkarte betreten und in Straßenbahn oder Bus nur damit einsteigen. Ab wann sie gilt, hängt von der Art ab:"],
    items: [
      {
        term: "Papierfahrkarte ohne Zeitstempel",
        description: "Gilt ab der Entwertung im Entwerter. Einmal entwerten — beim Betreten der Metro oder gleich nach dem Einsteigen. Erneutes Entwerten macht sie ungültig.",
      },
      { term: "Fahrkarte mit aufgedruckter Zeit", description: "Vom Terminal, vom Fahrer oder vom Schalter der Tschechischen Bahn. Gilt ab Kauf, wird nicht entwertet." },
      { term: "Fahrkarte in PID Lítačka", description: "Gilt 1 Minute nach der Aktivierung „Sofort nach dem Kauf“ oder ab der Zeit, die Sie bei der Aktivierung wählen." },
      { term: "SMS-Ticket", description: "Gilt erst ab Erhalt der SMS mit dem Ticket. Das Absenden der Bestellung reicht nicht." },
    ],
  },
  pid: {
    heading: "Was ist PID?",
    text: "Der Prager Integrierte Verkehr (PID) ist das gemeinsame Verkehrssystem von Prag und Mittelböhmen: Metro, Straßenbahnen, Busse, ausgewählte Züge und weitere Verkehrsmittel fahren mit denselben Fahrkarten. Die Preise auf dieser Seite gelten für Prag (Zonen P, 0, B); für Fahrten außerhalb Prags gelten andere Fahrkarten nach Tarifzonen.",
    links: [
      { text: "pid.cz", href: "https://pid.cz/" },
      { text: "PID-Fahrpreise (auf Tschechisch)", href: PID_TARIFF_URL },
    ],
  },
  faqHeading: "Häufige Fragen",
  faq: [
    {
      question: "Was kostet eine Metro-Fahrkarte in Prag?",
      answer: [
        `Die Grundfahrkarte für 30 Minuten kostet ${P30.paper} CZK (Papier), ${P30.app} CZK in der App PID Lítačka und ${P30.sms} CZK per SMS. Die Fahrkarte für 90 Minuten kostet ${P90.paper} CZK, ${P90.app} CZK in der App und ${P90.sms} CZK per SMS. Das ist der Normaltarif für Erwachsene von 15 bis 60 Jahren; alle Preise finden Sie in der `,
        { text: "Tabelle", href: "#ceny" },
        ".",
      ],
    },
    {
      question: "Wie kaufe ich in Prag ein SMS-Ticket?",
      answer: [
        `Senden Sie von einer tschechischen Nummer mit aktivierter Premium-SMS den Text DPT42 (30 Minuten), DPT55 (90 Minuten), DPT150 (24 Stunden) oder DPT350 (72 Stunden) an ${SMS_NUMBER_DISPLAY}. Das Ticket kommt in etwa zwei Minuten per SMS. 24- und 72-Stunden-Tickets müssen mit „Ano“ bestätigt werden. Sie können die Nachricht `,
        { text: "hier auf der Seite vorbereiten", href: "#sms" },
        ".",
      ],
    },
    { question: "An welche Nummer schicke ich das SMS-Ticket?", answer: [`An ${SMS_NUMBER_DISPLAY} (ohne Leerzeichen 90206). Der Text ist DPT plus Fahrpreis, zum Beispiel DPT42.`] },
    {
      question: "Gilt das SMS-Ticket auch in der Metro?",
      answer: [
        "Ja. Das SMS-Ticket gilt in Prag in den Zonen P, 0 und B mit Umsteigen — in Metro, Straßenbahn, Bus und Obus. Die Metro dürfen Sie aber erst betreten, wenn Sie das SMS-Ticket erhalten haben. Nicht gültig in PID-Zügen, auf Regionallinien in den Außenzonen und auf der Flughafenlinie AE.",
      ],
    },
    {
      question: "Wo kaufe ich eine Metro-Fahrkarte mit Karte?",
      answer: [
        "Mit Karte zahlen Sie an Touchscreen-Fahrkartenautomaten (Tastenautomaten nehmen nur Münzen) und an Touchscreen-Selbstbedienungsterminals. In Straßenbahn, Bus und Obus verkauft das Terminal Fahrkarten für 30 Minuten, 90 Minuten und 24 Stunden, nur kontaktlos. Auch in der App PID Lítačka zahlen Sie mit Karte. Das bloße Hinhalten der Karte ersetzt keine Fahrkarte.",
      ],
    },
    {
      question: "Muss ich die Fahrkarte entwerten?",
      answer: [
        "Nur eine Papierfahrkarte ohne aufgedrucktes Datum, Uhrzeit und Zone — also vom Tasten- oder Touchscreen-Automaten, aus dem Infozentrum oder vom Kiosk. Sie wird einmal entwertet, vor dem Betreten des kontrollierten Bereichs der Metro oder gleich nach dem Einsteigen in Straßenbahn oder Bus. Fahrkarten vom Terminal, vom Bahnschalter oder vom Fahrer haben bereits einen Zeitstempel; App- und SMS-Tickets werden nie entwertet.",
      ],
    },
    {
      question: "Ab wann gilt das SMS-Ticket?",
      answer: ["Erst wenn Sie die SMS mit dem Ticket erhalten — nicht nach dem Absenden der Bestellung. Bis dahin dürfen Sie weder die Metro betreten noch einsteigen."],
    },
    {
      question: "Kann ich mit einer Fahrkarte Metro und Straßenbahn fahren?",
      answer: [
        "Ja. Fahrkarten für 30 und 90 Minuten sowie für 24 und 72 Stunden gelten in allen PID-Verkehrsmitteln und Sie können während der Gültigkeit beliebig umsteigen. Ausnahme ist die Flughafenlinie AE; 30- und 90-Minuten-Fahrkarten gelten außerdem nicht auf der Standseilbahn auf den Petřín.",
      ],
    },
    {
      question: "Gilt die Prager Fahrkarte auch zum Flughafen?",
      answer: [
        `Ja, in den Bussen 59 (ab Nádraží Veleslavín) und 100 (ab Zličín) gilt die normale PID-Fahrkarte; PID empfiehlt die 90-Minuten-Fahrkarte (${P90.paper} CZK, in der App ${P90.app} CZK, per SMS ${P90.sms} CZK). Auf der Linie AE (Airport Express) gilt ein eigener Tarif von 200 CZK — normale und SMS-Tickets gelten dort nicht.`,
      ],
    },
    {
      question: "Funktioniert das SMS-Ticket mit einer ausländischen SIM-Karte?",
      answer: ["Nein. SMS-Tickets können nur von der Nummer eines tschechischen Mobilfunkanbieters gekauft werden. Mit ausländischer SIM nutzen Sie die App PID Lítačka oder einen Automaten."],
    },
  ],
  sources: {
    heading: "Offizielle Quellen",
    note: (date) =>
      `Preise und Regeln haben wir am ${date} geprüft. KdeJeMetro.cz verkauft keine Fahrkarten; im Zweifel gelten die Bedingungen von PID und DPP. Die Quellen sind auf Tschechisch.`,
    labels: [
      "Fahrpreise und Tarif (Preisliste Prag)",
      "Wie kauft man eine Fahrkarte",
      "SMS-Ticket",
      "DPP-Preisliste",
      "Mobile App PID Lítačka (Aktivierung der Fahrkarte)",
      "Tarifzonen und Umsteigen",
      "Verkehr zum Flughafen und zu den Bahnhöfen",
    ],
  },
  footer: {
    haveTicket: ["Fahrkarte gekauft? ", { text: "Nächste Metro finden", href: "/de#naechste-metro" }, "."],
    findMetro: "Nächste Metro finden",
  },
  header: { findMetroAria: "Nächste Metro nach Standort finden" },
};

const uk: TicketsText = {
  seo: {
    title: `Квитки на громадський транспорт у Празі ${TARIFF_YEAR} – ціни, SMS і де купити | KdeJeMetro`,
    description:
      "Як купити квиток на метро, трамвай чи автобус у Празі? Ціни квитків, SMS-квиток, застосунок PID Lítačka, оплата карткою та компостування.",
    h1: "Як купити квиток на громадський транспорт у Празі?",
    ogLocale: "uk_UA",
  },
  breadcrumb: "Квитки",
  intro: "Метро, трамваї та автобуси в Празі працюють за спільними квитками PID. Їх можна купити в застосунку PID Lítačka, через SMS або в автоматі. Оберіть:",
  quick: {
    app: { title: "Застосунок PID Lítačka", text: "Найдешевше. Діє через 1 хвилину після покупки." },
    sms: { title: "SMS-квиток", text: "Лише з чеською SIM-карткою." },
    machine: { title: "Автомат або термінал", text: "Монети або картка, паперовий квиток." },
    from: (price) => `від ${price}`,
  },
  verifiedNote: (date) => `Повний тариф для Праги, перевірено за даними PID і DPP ${date}.`,
  sms: {
    heading: "Підготувати SMS-квиток",
    intro: "Оберіть термін дії та відкрийте заповнене SMS. Надсилання й оплата відбуваються через вашого оператора, а не на цьому сайті.",
    knowHeading: "Що варто знати про SMS-квиток",
    know: [
      "Купити можна лише з номера чеського оператора; з іноземною SIM-карткою не працює.",
      "У оператора має бути активована послуга Premium SMS, і потрібен мобільний сигнал.",
      "Квиток приходить приблизно за дві хвилини. Він діє з моменту, коли ви його отримали.",
      "Діє з пересадками лише в Празі (зони P, 0, B). Не діє в поїздах PID, на приміських лініях у зовнішніх зонах і на лінії AE до аеропорту.",
      `Для квитків на 24 і 72 години замовлення треба підтвердити SMS «Ano» (так) на ${SMS_NUMBER_DISPLAY}; це повідомлення платне за тарифом оператора.`,
      "Оператор може стягнути додаткову плату. PID називає SMS найменш вигідним способом покупки.",
      "Якщо ви видалите квиток під час дії, дублікат за 3 Kč отримаєте, надіславши SMS DPTA на 900 06 03.",
    ],
  },
  prices: {
    heading: `Ціни квитків у Празі (${TARIFF_YEAR})`,
    caption: "Повний тариф для поїздок Прагою (зони P, 0, B), дорослі від 15 до 60 років.",
    columns: { duration: "Термін дії", app: "PID Lítačka", paper: "Паперовий", sms: "SMS" },
    note: "Квиток у застосунку PID Lítačka завжди найдешевший. SMS-квиток на 30 і 90 хвилин дорожчий за паперовий, на 24 і 72 години коштує так само. Він зручний, якщо у вас чеський номер і ви не хочете встановлювати застосунок.",
    discounts: [
      "Діти до 15 років і пенсіонери від 65 років їздять у Празі безкоштовно (з підтвердженням права), пенсіонери 60–65 років мають пільговий тариф. Умови та пільгові ціни — у ",
      { text: "тарифах PID (чеською)", href: PID_TARIFF_URL, external: true },
      ".",
    ],
  },
  litacka: {
    heading: "Квиток у застосунку PID Lítačka",
    intro:
      "PID Lítačka — офіційний застосунок Празького інтегрованого транспорту (PID). У ньому можна знайти маршрут і купити електронний квиток для Праги та інших поїздок PID — просто оберіть правильний квиток. Застосунок доступний і українською.",
    whenHeading: "Коли квиток починає діяти",
    when: [
      ["Під час активації «Одразу після покупки» квиток діє через 1 хвилину після покупки. Купуйте його щонайменше за хвилину до входу в метро або до відправлення."],
      ["Квиток, куплений «про запас» (ручна активація), не діє, доки ви його не активуєте."],
      ["Квиток, активований лише у транспорті або після вимоги контролера, не визнається дійсним."],
      ["Для активації потрібен мобільний інтернет; після цього під час дії квитка він не потрібен."],
    ],
    cta: "Відкрити PID Lítačka",
    ctaNote: "Відкриється офіційний сайт PID Lítačka (app.pidlitacka.cz) у новій вкладці.",
  },
  noApp: {
    heading: "Де купити квиток без застосунку?",
    items: [
      [
        "Автомати з продажу квитків є у вестибюлях метро, на зупинках і в аеропорту. Кнопкові автомати приймають лише монети, сенсорні — монети й платіжні картки. Квиток з автомата треба закомпостувати перед входом у метро або в транспорт.",
      ],
      ["Сенсорні термінали самообслуговування приймають платіжні картки. На їхніх квитках уже надруковані час і зона, тож їх не компостують."],
      [
        "У трамваї, автобусі й тролейбусі квиток на 30 хвилин, 90 хвилин або 24 години можна купити в терміналі лише безконтактно (у трамваї посередині вагона, в автобусі й тролейбусі біля других дверей). Він діє одразу, компостувати не треба.",
      ],
      ["Інфоцентри DPP, кіоски й магазини продають паперові квитки без штампу часу — їх треба закомпостувати."],
    ],
    cardNote: [
      "Карткою в Празі ви оплачуєте покупку квитка, а не саму поїздку. У метро не можна просто прикласти банківську картку — входити треба вже з дійсним квитком.",
    ],
  },
  validity: {
    heading: "Коли потрібен дійсний квиток?",
    intro: ["Входити в платну зону метро і сідати в трамвай чи автобус можна лише з дійсним квитком. Коли квиток починає діяти, залежить від його типу:"],
    items: [
      {
        term: "Паперовий квиток без штампу",
        description: "Діє з моменту компостування. Закомпостуйте його один раз — при вході в метро або одразу після посадки. Повторне компостування робить його недійсним.",
      },
      { term: "Квиток з надрукованим часом", description: "З термінала, від водія або з каси Чеських залізниць. Діє з моменту покупки, не компостується." },
      { term: "Квиток у PID Lítačka", description: "Діє через 1 хвилину після активації «Одразу після покупки» або з часу, який ви встановите під час активації." },
      { term: "SMS-квиток", description: "Діє лише після отримання SMS з квитком. Самого надсилання замовлення недостатньо." },
    ],
  },
  pid: {
    heading: "Що таке PID?",
    text: "Празький інтегрований транспорт (PID) — спільна транспортна система Праги та Середньочеського краю: метро, трамваї, автобуси, окремі поїзди та інший транспорт працюють за одними квитками. Ціни на цій сторінці діють для Праги (зони P, 0, B); для поїздок за межі Праги потрібні інші квитки за тарифними зонами.",
    links: [
      { text: "pid.cz", href: "https://pid.cz/" },
      { text: "Тарифи PID (чеською)", href: PID_TARIFF_URL },
    ],
  },
  faqHeading: "Часті запитання",
  faq: [
    {
      question: "Скільки коштує квиток на метро в Празі?",
      answer: [
        `Базовий квиток на 30 хвилин коштує ${P30.paper} Kč (паперовий), ${P30.app} Kč у застосунку PID Lítačka і ${P30.sms} Kč через SMS. Квиток на 90 хвилин коштує ${P90.paper} Kč, ${P90.app} Kč у застосунку і ${P90.sms} Kč через SMS. Це повний тариф для дорослих від 15 до 60 років; усі ціни — у `,
        { text: "таблиці", href: "#ceny" },
        ".",
      ],
    },
    {
      question: "Як купити SMS-квиток у Празі?",
      answer: [
        `З чеського номера з активованою послугою Premium SMS надішліть текст DPT42 (30 хвилин), DPT55 (90 хвилин), DPT150 (24 години) або DPT350 (72 години) на номер ${SMS_NUMBER_DISPLAY}. Квиток прийде SMS приблизно за дві хвилини. Квитки на 24 і 72 години треба підтвердити відповіддю «Ano». Повідомлення можна `,
        { text: "підготувати на цій сторінці", href: "#sms" },
        ".",
      ],
    },
    { question: "На який номер надсилати SMS-квиток?", answer: [`На номер ${SMS_NUMBER_DISPLAY} (без пробілу 90206). Текст повідомлення — DPT і ціна квитка, наприклад DPT42.`] },
    {
      question: "Чи діє SMS-квиток у метро?",
      answer: [
        "Так. SMS-квиток діє з пересадками в Празі в зонах P, 0 і B — у метро, трамваях, автобусах і тролейбусах. Але входити в метро можна лише після отримання SMS-квитка. Він не діє в поїздах PID, на приміських лініях у зовнішніх зонах і на лінії AE до аеропорту.",
      ],
    },
    {
      question: "Де купити квиток на метро карткою?",
      answer: [
        "Карткою можна заплатити в сенсорних автоматах (кнопкові приймають лише монети) і в сенсорних терміналах самообслуговування. У трамваях, автобусах і тролейбусах термінал продає квитки на 30 хвилин, 90 хвилин і 24 години лише безконтактно. Карткою також платите в застосунку PID Lítačka. Саме прикладання картки квиток не замінює.",
      ],
    },
    {
      question: "Чи треба компостувати квиток?",
      answer: [
        "Лише паперовий квиток без надрукованої дати, часу й зони — тобто з кнопкового чи сенсорного автомата, з інфоцентру або з кіоску. Компостують його один раз — перед входом у платну зону метро або одразу після посадки в трамвай чи автобус. Квитки з терміналів, каси Чеських залізниць і від водія вже мають штамп часу; квитки в застосунку та SMS-квитки не компостують.",
      ],
    },
    {
      question: "Коли SMS-квиток починає діяти?",
      answer: ["Лише тоді, коли ви отримаєте SMS з квитком, — а не після надсилання замовлення. До того входити в метро чи сідати в транспорт не можна."],
    },
    {
      question: "Чи можна з одним квитком їхати і метро, і трамваєм?",
      answer: [
        "Так. Квитки на 30 і 90 хвилин, а також на 24 і 72 години діють у всіх видах транспорту PID, і під час їхньої дії можна необмежено пересідати. Виняток — лінія AE до аеропорту; квитки на 30 і 90 хвилин також не діють на фунікулері на Петршин.",
      ],
    },
    {
      question: "Чи діє празький квиток до аеропорту?",
      answer: [
        `Так, в автобусах 59 (від Nádraží Veleslavín) і 100 (від Zličín) діє звичайний квиток PID; PID радить квиток на 90 хвилин (${P90.paper} Kč, у застосунку ${P90.app} Kč, через SMS ${P90.sms} Kč). На лінії AE (Airport Express) діє окремий тариф 200 Kč — звичайні та SMS-квитки там не діють.`,
      ],
    },
    {
      question: "Чи працює SMS-квиток з іноземною SIM-карткою?",
      answer: ["Ні. SMS-квиток можна купити лише з номера чеського мобільного оператора. З іноземною SIM-карткою скористайтеся застосунком PID Lítačka або автоматом."],
    },
  ],
  sources: {
    heading: "Офіційні джерела",
    note: (date) => `Ціни та правила ми перевірили ${date}. KdeJeMetro.cz не продає квитки; у разі розбіжностей діють умови PID і DPP. Джерела чеською мовою.`,
    labels: [
      "Проїзд і тариф (ціни в Празі)",
      "Як придбати квиток",
      "SMS-квиток",
      "Ціни DPP",
      "Мобільний застосунок PID Lítačka (активація квитка)",
      "Тарифні зони та пересадки",
      "Транспорт до аеропорту та вокзалів",
    ],
  },
  footer: {
    haveTicket: ["Маєте квиток? ", { text: "Знайдіть найближче метро", href: "/ua#znaity-metro" }, "."],
    findMetro: "Знайти найближче метро",
  },
  header: { findMetroAria: "Знайти найближче метро за місцезнаходженням" },
};

export const TICKETS_TEXT: Record<Locale, TicketsText> = { cs, en, de, uk };

export function getTicketsText(locale: Locale): TicketsText {
  return TICKETS_TEXT[locale];
}

/** Foto automatů v sekci #bez-aplikace — Wikimedia Commons, CC BY-SA 4.0 (zmenšeno do public/images). */
export const TICKET_MACHINE_PHOTO = {
  src: "/images/pid-ticket-machine.webp",
  width: 600,
  height: 1234,
  author: "Silver Dovelet",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Prague_public_transit_ticket_machine_02.jpg",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
} as const;

export const TICKET_MACHINE_PHOTO_TEXT: Record<Locale, { alt: string; caption: string; credit: string }> = {
  cs: {
    alt: "Žlutý dotykový automat na jízdenky PID s nápisem Jízdenky/Tickets ve stanici metra a vedle něj menší automat na platbu bezkontaktní kartou",
    caption: "Vpravo dotykový automat na mince i platební karty, vlevo menší automat jen pro bezkontaktní platbu kartou.",
    credit: "Foto",
  },
  en: {
    alt: "Yellow PID touch-screen ticket machine labelled Jízdenky/Tickets in a metro station, next to a smaller contactless card machine",
    caption: "Right: touch-screen machine for coins and payment cards. Left: smaller machine for contactless card payment only.",
    credit: "Photo",
  },
  de: {
    alt: "Gelber PID-Fahrkartenautomat mit Touchscreen und der Aufschrift Jízdenky/Tickets in einer Metrostation, daneben ein kleinerer Automat für kontaktlose Kartenzahlung",
    caption: "Rechts: Touchscreen-Automat für Münzen und Zahlungskarten. Links: kleinerer Automat nur für kontaktlose Kartenzahlung.",
    credit: "Foto",
  },
  uk: {
    alt: "Жовтий сенсорний автомат квитків PID з написом Jízdenky/Tickets на станції метро, поруч менший автомат для безконтактної оплати карткою",
    caption: "Праворуч — сенсорний автомат для монет і платіжних карток, ліворуч — менший автомат лише для безконтактної оплати карткою.",
    credit: "Фото",
  },
};
