import type { GuideLink, StationGuide } from "./types.ts";

// Průvodci osmi pilotními stanicemi (/stanice/*). Faktická tvrzení v
// textech vycházejí z odkazů v `links` každé stanice (hlavně
// bezbariérové stránky DPP) — nic dynamického (odjezdy, stav výtahů,
// výluky) tu není opsané, jen se na to odkazuje. Polohy vstupů a
// stanovišť a linky na stanovištích se do stránek doplňují až při
// renderu z PID GTFS dat (data/metro-entrances.json,
// data/station-area-stops.json), ne z tohohle souboru.

/** Den, kdy byly odkazy s tímto datem při implementaci skutečně otevřeny a zkontrolovány. */
const VERIFIED = "2026-10-25";

function dppAccessibility(path: string, stationLabel: string): GuideLink {
  return {
    id: "dpp-bezbarierovost",
    label: `DPP – bezbariérový přístup, ${stationLabel}`,
    url: `https://www.dpp.cz/cestovani/bezbarierove-cestovani/metro/${path}`,
    provider: "DPP",
    type: "accessibility",
    direct: true,
    verifiedAt: VERIFIED,
  };
}

const DPP_ELEVATOR_STATUS: GuideLink = {
  id: "dpp-stav-vytahu",
  label: "DPP – aktuální stav výtahů a plošin",
  url: "https://www.dpp.cz/cestovani/bezbarierove-cestovani/stav-vytahu-a-plosin",
  provider: "DPP",
  type: "elevator-status",
  direct: false,
  verifiedAt: VERIFIED,
  note: "Přehled všech stanic, stanici je potřeba v seznamu najít.",
};

function pidBoard(stopQuery: string, stopLabel: string): GuideLink {
  return {
    id: "pid-odjezdy",
    label: `PID – zastávková tabla ${stopLabel}`,
    url: `https://pid.cz/zastavkova-tabla/?stop=${encodeURIComponent(stopQuery).replace(/%20/g, "+")}&tab=1`,
    provider: "PID",
    type: "departures",
    direct: true,
    verifiedAt: VERIFIED,
  };
}

function pidNodeMap(file: string, stationLabel: string): GuideLink {
  return {
    id: "pid-mapa-uzlu",
    label: `PID – mapa přestupního uzlu ${stationLabel} (PDF)`,
    url: `https://pid.cz/wp-content/uploads/mapy/uzly-praha/${file}_MU.pdf`,
    provider: "PID",
    type: "node-map",
    direct: true,
    verifiedAt: VERIFIED,
  };
}

const PID_OPEN_DATA: GuideLink = {
  id: "pid-gtfs",
  label: "PID otevřená data (GTFS) – polohy vstupů a stanovišť",
  url: "https://pid.cz/o-systemu/opendata/",
  provider: "PID",
  type: "open-data",
  direct: false,
  verifiedAt: VERIFIED,
};

export const STATION_GUIDES: readonly StationGuide[] = [
  {
    slug: "florenc",
    stationId: "U689S1",
    name: "Florenc",
    lines: ["B", "C"],
    seoTitle: "Metro Florenc – autobusové nádraží, odjezdy a přestup | KdeJeMetro",
    seoDescription:
      "Jak se dostat z metra Florenc na autobusové nádraží? Odjezdy autobusů, mapa, přestup mezi linkami B a C a bezbariérový přístup.",
    h1: "Metro Florenc – autobusy, výstupy a přestup B/C",
    lead: "Florenc propojuje linky metra B a C a navazuje na autobusové nádraží s dálkovými a regionálními spoji.",
    intro:
      "Pokud pokračujete dálkovým autobusem, otevřete si odjezdovou tabuli autobusového nádraží a zkontrolujte, odkud váš spoj skutečně odjíždí. Mapa níže ukazuje všechny vstupy do metra podle dat PID.",
    overviewSummary: "Odjezdy z autobusového nádraží, přestup B/C a bezbariérová cesta přes povrch.",
    destinations: [
      { id: "autobusove-nadrazi", label: "Autobusové nádraží Florenc", action: { kind: "place", query: "Autobusové nádraží Florenc, Praha" } },
      { id: "odjezdy-dalkove", label: "Odjezdy dálkových autobusů", action: { kind: "link", linkId: "florenc-odjezdy" } },
      { id: "prestup", label: "Přestup mezi B a C", action: { kind: "section", sectionId: "prestup" } },
      { id: "tramvaje", label: "Tramvaje a autobusy MHD", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "odjezdy-dalkove", label: "Zobrazit odjezdy autobusů", action: { kind: "link", linkId: "florenc-odjezdy" } },
      { id: "najit-nadrazi", label: "Autobusové nádraží v mapách", action: { kind: "place", query: "Autobusové nádraží Florenc, Praha" } },
      { id: "mapa", label: "Mapa vstupů", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Než pojedete dálkovým autobusem",
        paragraphs: [
          "Název nádraží nestačí — před odjezdem si ověřte konkrétní nástupiště a případné změny spoje na odjezdové tabuli provozovatele nádraží.",
          "Odjezdová tabule na florenc.cz zobrazuje společně spoje z Florence i z Holešovic. Vždy zkontrolujte, ze kterého místa váš spoj skutečně odjíždí.",
        ],
        sourceIds: ["florenc-odjezdy"],
      },
      {
        id: "prestup",
        heading: "Přestup mezi linkami B a C",
        paragraphs: [
          "Bezbariérový přestup mezi linkami B a C vede přes povrch: z nástupiště linky C výtahy nahoru na ulici, po povrchu k výtahům linky B a jimi dolů (a stejně opačně).",
          "Výtahy linky C ústí na povrchu poblíž zastávky povrchové MHD ve směru na Žižkov, výtahy linky B u křižovatky ulic Na Florenci a Sokolovská.",
        ],
        sourceIds: ["dpp-bezbarierovost"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Linka C: dva navazující výtahy spojují ulici s podchodem v úrovni vestibulu a vestibul s nástupištěm. Linka B: první výtah vede z ulice do přestupní chodby, druhý z jejího čela na nástupiště.",
          "Výtahy linky B mají propojený informační systém, který při poruše oznámí přerušení bezbariérové cesty už u přivolávacího tlačítka. Aktuální provoz výtahů si přesto ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Zastávky tramvají a autobusů MHD",
      intro: "Stanoviště povrchové MHD u stanice Florenc podle jízdního řádu PID. Dálkové autobusy odjíždějí z autobusového nádraží — jejich nástupiště najdete na odjezdové tabuli nádraží.",
    },
    faq: [
      {
        question: "Kudy z metra Florenc na autobusové nádraží?",
        answer:
          "Mapa níže ukazuje vstupy do metra a zastávky MHD podle dat PID. Samotné nádraží si otevřete v mapové aplikaci přes položku Autobusové nádraží Florenc v sekci Kam potřebujete — odtud si v ní spustíte pěší trasu.",
        more: { label: "Mapa vstupů", sectionId: "mapa" },
      },
      {
        question: "Kde zjistím odjezdy dálkových autobusů?",
        answer: "Na odjezdové tabuli provozovatele nádraží na florenc.cz. Tabule obsahuje i spoje z Holešovic, proto kontrolujte místo odjezdu.",
        more: { label: "Odjezdy na florenc.cz", linkId: "florenc-odjezdy" },
      },
      {
        question: "Jak zjistím číslo nástupiště?",
        answer: "Číslo nástupiště dálkového spoje uvádí odjezdová tabule nádraží. KdeJeMetro.cz čísla nástupišť dálkových spojů nepřebírá, protože se mohou měnit.",
        more: { label: "Odjezdy na florenc.cz", linkId: "florenc-odjezdy" },
      },
      {
        question: "Jak přestoupit mezi linkami B a C?",
        answer: "Ve stanici vedou přestupní chodby se schody a eskalátory. Bezbariérový přestup vede přes povrch — viz sekce Přestup.",
        more: { label: "Přestup mezi B a C", sectionId: "prestup" },
      },
      {
        question: "Je přestup bezbariérový?",
        answer: "Ano, ale jen přes povrch: výtahem z jedné linky na ulici a dalším výtahem k druhé lince. Podzemní bezbariérové propojení obou linek podle DPP neexistuje.",
        more: { label: "Bezbariérový přístup", sectionId: "bezbarierovost" },
      },
    ],
    links: [
      {
        id: "florenc-odjezdy",
        label: "Florenc.cz – odjezdy z autobusového nádraží",
        url: "https://www.florenc.cz/odjezdy",
        provider: "Florenc.cz",
        type: "departures",
        direct: true,
        verifiedAt: VERIFIED,
        note: "Tabule obsahuje spoje z Florence i Holešovic.",
      },
      pidBoard("Florenc", "Florenc"),
      pidNodeMap("Florenc", "Florenc"),
      dppAccessibility("trasa-b/Florenc-b-c", "Florenc (B/C)"),
      DPP_ELEVATOR_STATUS,
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "cerny-most",
    stationId: "U897S1",
    name: "Černý Most",
    lines: ["B"],
    seoTitle: "Metro Černý Most – autobusy, stanoviště a odjezdy | KdeJeMetro",
    seoDescription:
      "Kde najít autobus na Černém Mostě? Mapa stanovišť, odjezdy PID, výstupy z metra a navigace k autobusovému terminálu.",
    h1: "Metro Černý Most – autobusový terminál a odjezdy",
    lead: "Černý Most je konečná linky B a velký přestupní uzel autobusů — rozhoduje číslo stanoviště.",
    intro:
      "Autobusový terminál má mnoho stanovišť. Níže najdete, ze kterého stanoviště podle jízdního řádu PID odjíždí vaše linka, a jejich polohu na mapě.",
    overviewSummary: "Které stanoviště autobusového terminálu, mapa stanovišť a odjezdy PID.",
    destinations: [
      { id: "terminal", label: "Autobusový terminál – stanoviště", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "odjezdy", label: "Odjezdy autobusů PID", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "mapa-uzlu", label: "Mapa terminálu (PDF)", action: { kind: "link", linkId: "pid-mapa-uzlu" } },
      { id: "vystupy", label: "Výstupy z metra", action: { kind: "section", sectionId: "mapa" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "odjezdy", label: "Zobrazit odjezdy autobusů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "stanoviste", label: "Najít stanoviště linky", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "mapa", label: "Mapa vstupů a stanovišť", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Co je dobré vědět",
        paragraphs: [
          "Terminál má mnoho stanovišť a jedna linka může odjíždět z různých stanovišť podle směru. Na zastávkové tabuli PID lze vybrat konkrétní stanoviště a zobrazit jen jeho odjezdy.",
          "Přiřazení linek ke stanovištím se může změnit — seznam níže se proto denně přebírá z jízdního řádu PID a před cestou ho ověřte na tabuli.",
        ],
        sourceIds: ["pid-odjezdy", "pid-gtfs"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Stanice má dvě boční nástupiště (koleje uprostřed). Jeden výtah spojuje nástupiště ve směru do centra s horní částí vestibulu u lávky přes ulici Chlumeckou.",
          "Druhý výtah spojuje úroveň autobusového terminálu a nástupiště ve směru z centra s horní částí vestibulu. Mezi nástupišti se bez schodů přestupuje výtahy přes horní část vestibulu.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Stanoviště autobusového terminálu",
      intro: "Ze kterého stanoviště odjíždí která linka — podle aktuálního jízdního řádu PID. Klepnutím na stanoviště otevřete pěší navigaci přímo k němu.",
    },
    faq: [
      {
        question: "Kde najdu autobusové stanoviště?",
        answer: "V sekci Stanoviště najdete kód každého stanoviště, linky, které z něj odjíždějí, a navigaci přímo k němu. Polohu ukazuje i mapa.",
        more: { label: "Stanoviště terminálu", sectionId: "stanoviste" },
      },
      {
        question: "Kde jsou aktuální odjezdy?",
        answer: "Na zastávkové tabuli PID pro zastávku Černý Most. Lze v ní vybrat i konkrétní stanoviště.",
        more: { label: "Odjezdy na pid.cz", linkId: "pid-odjezdy" },
      },
      {
        question: "Jak se dostat z metra k autobusu?",
        answer: "Najděte v seznamu stanoviště své linky a otevřete navigaci. Bez schodů vede k terminálu výtah z nástupiště ve směru z centra (přes horní část vestibulu).",
        more: { label: "Bezbariérový přístup", sectionId: "bezbarierovost" },
      },
      {
        question: "Kde najdu mapu terminálu?",
        answer: "PID vydává mapu přestupního uzlu Černý Most ve formátu PDF. Polohy stanovišť z dat PID ukazuje i mapa na této stránce.",
        more: { label: "Mapa uzlu (PDF)", linkId: "pid-mapa-uzlu" },
      },
    ],
    links: [
      { ...pidBoard("Černý Most", "Černý Most"), url: "https://pid.cz/zastavkova-tabla/?stanoviste=&stop=%C4%8Cern%C3%BD+Most&tab=1" },
      pidNodeMap("Cerny-Most", "Černý Most"),
      dppAccessibility("trasa-b/Cerny-most", "Černý Most"),
      DPP_ELEVATOR_STATUS,
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "mustek",
    stationId: "U1072S1",
    name: "Můstek",
    lines: ["A", "B"],
    seoTitle: "Metro Můstek – výstupy, přestup A/B a mapa | KdeJeMetro",
    seoDescription:
      "Kudy vystoupit z metra Můstek? Přehled vstupů, přestupu mezi linkami A a B, orientace na Václavském náměstí a mapa okolí.",
    h1: "Metro Můstek – výstupy a přestup A/B",
    lead: "Můstek propojuje linky A a B a má vstupy rozeseté po centru — správný výstup ušetří cestu po povrchu.",
    intro:
      "Stanice má několik vestibulů s mnoha vstupy. Mapa níže ukazuje polohu každého vstupu podle dat PID, takže si vyberete ten nejblíž svému cíli ještě ve stanici.",
    overviewSummary: "Který z mnoha vstupů zvolit, přestup A/B a výtah z dolní části Václavského náměstí.",
    destinations: [
      { id: "vaclavske-namesti", label: "Václavské náměstí", action: { kind: "place", query: "Václavské náměstí, Praha" } },
      { id: "na-prikope", label: "Na Příkopě", action: { kind: "place", query: "Na Příkopě, Praha" } },
      { id: "prestup-a", label: "Přestup na linku A", action: { kind: "section", sectionId: "prestup" } },
      { id: "prestup-b", label: "Přestup na linku B", action: { kind: "section", sectionId: "prestup" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "mapa", label: "Mapa všech vstupů", action: { kind: "section", sectionId: "mapa" } },
      { id: "vytah", label: "Kde je výtah", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Co je dobré vědět",
        paragraphs: [
          "Vstupy do Můstku jsou rozmístěné na několika místech centra. Podle cíle se vyplatí zvolit správný vestibul už na nástupišti — orientujte se podle informačních tabulí ve stanici a podle mapy vstupů níže.",
          "Tramvajová zastávka u stanice se jmenuje Václavské náměstí.",
        ],
        sourceIds: ["pid-gtfs"],
      },
      {
        id: "prestup",
        heading: "Přestup mezi linkami A a B",
        paragraphs: [
          "Linky A a B se ve stanici kříží a přestupuje se přestupní chodbou. Bez schodů lze přestoupit výtahem č. 429, který spojuje úroveň přestupní chodby s nástupišti obou linek.",
        ],
        sourceIds: ["dpp-bezbarierovost"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Dvojice výtahů č. 425 a 426 má vstup v dolní části Václavského náměstí a vede z ulice do přestupní chodby. Navazující výtah č. 429 pokračuje na nástupiště linek A i B.",
          "Na nástupištích obou linek je u prvního vozu nástupní rampa. Aktuální provoz výtahů ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Tramvajová zastávka Václavské náměstí",
      intro: "Stanoviště tramvají u stanice Můstek podle jízdního řádu PID.",
    },
    faq: [
      {
        question: "Kudy vystoupit z metra Můstek na Václavské náměstí?",
        answer:
          "Podívejte se na mapu vstupů — ukazuje skutečnou polohu každého vstupu podle dat PID. Výtahy pro cestu bez schodů ústí v dolní části Václavského náměstí.",
        more: { label: "Mapa vstupů", sectionId: "mapa" },
      },
      {
        question: "Jak přestoupit mezi linkami A a B?",
        answer: "Přestupní chodbou ve stanici. Bez schodů pomůže výtah č. 429 mezi přestupní chodbou a nástupišti obou linek.",
        more: { label: "Přestup", sectionId: "prestup" },
      },
      {
        question: "Kde jsou vstupy do stanice Můstek?",
        answer: "Seznam i mapa níže ukazují všechny vstupy, které eviduje PID. Ke každému můžete otevřít pěší navigaci.",
        more: { label: "Seznam vstupů", sectionId: "mapa" },
      },
      {
        question: "Jak se dostat na povrch bez schodů?",
        answer: "Výtahem č. 429 z nástupiště do přestupní chodby a dále výtahy č. 425 nebo 426 do dolní části Václavského náměstí.",
        more: { label: "Bezbariérový přístup", sectionId: "bezbarierovost" },
      },
    ],
    links: [
      dppAccessibility("trasa-b/mustek-A-b", "Můstek (A/B)"),
      DPP_ELEVATOR_STATUS,
      pidBoard("Václavské náměstí", "Václavské náměstí"),
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "muzeum",
    stationId: "U400S1",
    name: "Muzeum",
    lines: ["A", "C"],
    seoTitle: "Metro Muzeum – přestup A/C, výstupy a výtahy | KdeJeMetro",
    seoDescription:
      "Jak přestoupit na metru Muzeum? Výstupy k Národnímu muzeu, přestup mezi linkami A a C, bezbariérové trasy a mapa.",
    h1: "Metro Muzeum – přestup A/C a výstupy",
    lead: "Muzeum propojuje linky A a C u Národního muzea a horní části Václavského náměstí.",
    intro:
      "Výtahy linek A a C nejsou v podzemí propojené, takže bezbariérový přestup vede po povrchu. Níže najdete, kde který výtah ústí, a mapu všech vstupů.",
    overviewSummary: "Přestup A/C, kde ústí výtahy obou linek a proč bezbariérový přestup vede po povrchu.",
    destinations: [
      { id: "narodni-muzeum", label: "Národní muzeum", action: { kind: "place", query: "Národní muzeum, Václavské náměstí, Praha" } },
      { id: "vaclavske-namesti", label: "Václavské náměstí", action: { kind: "place", query: "Václavské náměstí, Praha" } },
      { id: "prestup-a", label: "Přestup na linku A", action: { kind: "section", sectionId: "prestup" } },
      { id: "prestup-c", label: "Přestup na linku C", action: { kind: "section", sectionId: "prestup" } },
      { id: "bezbarierovy", label: "Bezbariérová trasa", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "bezbarierovy", label: "Přestup bez schodů", action: { kind: "section", sectionId: "bezbarierovost" } },
      { id: "mapa", label: "Mapa vstupů", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "prestup",
        heading: "Přestup mezi linkami A a C",
        paragraphs: [
          "Mezi nástupišti linek A a C se přestupuje eskalátory a chodbami uvnitř stanice.",
          "Pro cestu bez schodů to neplatí: výtahy každé linky vedou jen na její nástupiště. Přestup s kočárkem nebo na vozíku proto vede po povrchu — viz Bezbariérový přístup.",
        ],
        sourceIds: ["dpp-bezbarierovost"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Linka A: výtahy (č. 289 a 290) z nástupiště ústí na povrchu v prostoru mezi ulicí Vinohradskou a budovou Národního muzea. Na nástupiště linky C nevedou.",
          "Linka C: výtah (č. 025) z nástupiště ústí v parku mezi ulicemi Washingtonova a Wilsonova, směrem ke stanici Hlavní nádraží. Na nástupiště linky A nevede.",
          "Bezbariérový přestup: výtahem jedné linky na povrch, po povrchu k výtahu druhé linky a jím dolů. Aktuální dostupnost výtahů ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Zastávky tramvají a autobusů",
      intro: "Stanoviště povrchové MHD zastávky Muzeum podle jízdního řádu PID.",
    },
    faq: [
      {
        question: "Jak přestoupit mezi A a C na Muzeu?",
        answer: "Uvnitř stanice eskalátory a chodbami. Bez schodů jen přes povrch, protože výtahy obou linek nejsou v podzemí propojené.",
        more: { label: "Přestup", sectionId: "prestup" },
      },
      {
        question: "Lze přestoupit bez schodů?",
        answer:
          "Ano, ale po povrchu: výtah linky A ústí mezi Vinohradskou a Národním muzeem, výtah linky C v parku mezi Washingtonovou a Wilsonovou ulicí.",
        more: { label: "Bezbariérový přístup", sectionId: "bezbarierovost" },
      },
      {
        question: "Kudy k Národnímu muzeu?",
        answer: "Muzeum si otevřete v mapové aplikaci přes sekci Kam potřebujete a porovnejte s polohou vstupů na mapě níže. Výtahy linky A ústí přímo u budovy muzea (směr Vinohradská).",
        more: { label: "Mapa vstupů", sectionId: "mapa" },
      },
      {
        question: "Kde jsou výtahy?",
        answer: "Výtahy linky A u Národního muzea (směr Vinohradská), výtah linky C v parku u Washingtonovy ulice. Provoz ověříte na stránce DPP o stavu výtahů.",
        more: { label: "Stav výtahů (DPP)", linkId: "dpp-stav-vytahu" },
      },
    ],
    links: [
      dppAccessibility("trasa-a/muzeum-A-c", "Muzeum (A/C)"),
      DPP_ELEVATOR_STATUS,
      pidBoard("Muzeum", "Muzeum"),
      pidNodeMap("Muzeum", "Muzeum"),
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "nadrazi-veleslavin",
    stationId: "U462S1",
    name: "Nádraží Veleslavín",
    lines: ["A"],
    seoTitle: "Metro Nádraží Veleslavín – letiště, linka 59 a odjezdy | KdeJeMetro",
    seoDescription:
      "Jak z metra Nádraží Veleslavín na letiště Praha? Přestup na linku 59, aktuální odjezdy, vstupy a mapa zastávek.",
    h1: "Nádraží Veleslavín – přestup z metra na letiště",
    lead: "Z Nádraží Veleslavín na lince A jezdí na Letiště Václava Havla linka 59.",
    intro:
      "Níže najdete stanoviště, ze kterého podle jízdního řádu PID odjíždí linka 59 směr Letiště, jeho polohu vůči vstupům do metra a odkaz na aktuální odjezdy.",
    overviewSummary: "Přestup z linky A na linku 59 na letiště — které stanoviště a aktuální odjezdy.",
    destinations: [
      { id: "letiste", label: "Letiště Václava Havla (linka 59)", action: { kind: "route", routeName: "59" } },
      { id: "odjezdy", label: "Odjezdy návazných spojů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "tramvaje", label: "Tramvajové zastávky", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "linka-59", label: "Kde nastoupit na 59", action: { kind: "route", routeName: "59" } },
      { id: "odjezdy", label: "Zobrazit odjezdy", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "mapa", label: "Mapa vstupů a zastávek", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Cesta na letiště",
        paragraphs: [
          "Linka 59 jezdí mezi Nádražím Veleslavín a Letištěm. Před cestou si na zastávkové tabuli ověřte nejbližší odjezd a směr jízdy a podle letenky si zjistěte, ke kterému terminálu potřebujete.",
          "KdeJeMetro.cz neuvádí dobu jízdy ani interval — aktuální odjezdy ukazuje tabule PID.",
        ],
        sourceIds: ["pid-gtfs", "pid-odjezdy"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Stanice má jeden výtah (č. 471) mezi nástupištěm metra a ulicí. Na povrchu ústí na chodníku poblíž ulice Evropské — s kufrem nebo kočárkem tak vyjedete na ulici bez schodů.",
          "Na nástupišti je u prvního vozu nástupní rampa. Aktuální provoz výtahu ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Zastávky autobusů, tramvají a linky 59",
      intro: "Stanoviště zastávky Nádraží Veleslavín a linky, které z nich podle jízdního řádu PID odjíždějí.",
    },
    faq: [
      {
        question: "Jak se dostanu z metra na letiště?",
        answer: "Přestupte z linky A na linku 59 směr Letiště. Stanoviště a navigaci k němu najdete v sekci Zastávky.",
        more: { label: "Stanoviště linky 59", sectionId: "stanoviste" },
      },
      {
        question: "Kde nastoupím na linku 59?",
        answer: "Na stanovišti zastávky Nádraží Veleslavín, které je v seznamu zastávek označené linkou 59. Údaj se denně přebírá z jízdního řádu PID.",
        more: { label: "Stanoviště", sectionId: "stanoviste" },
      },
      {
        question: "Kde zjistím nejbližší odjezd?",
        answer: "Na zastávkové tabuli PID pro zastávku Nádraží Veleslavín.",
        more: { label: "Odjezdy na pid.cz", linkId: "pid-odjezdy" },
      },
      {
        question: "Jak se dostanu k zastávce s kufrem?",
        answer: "Výtahem č. 471 z nástupiště metra na ulici — ústí na chodníku u ulice Evropské. Provoz výtahu ověřte u DPP.",
        more: { label: "Bezbariérový přístup", sectionId: "bezbarierovost" },
      },
    ],
    links: [
      pidBoard("Nádraží Veleslavín", "Nádraží Veleslavín"),
      pidNodeMap("Nadrazi-Veleslavin", "Nádraží Veleslavín"),
      dppAccessibility("trasa-a/nadrazi-veleslavin", "Nádraží Veleslavín"),
      DPP_ELEVATOR_STATUS,
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "zlicin",
    stationId: "U1141S1",
    name: "Zličín",
    lines: ["B"],
    seoTitle: "Metro Zličín – letiště, autobus 100 a odjezdy | KdeJeMetro",
    seoDescription:
      "Metro Zličín: kde nastoupit na autobus 100 na letiště, kde najít autobusová stanoviště a jak zobrazit aktuální odjezdy.",
    h1: "Metro Zličín – autobus 100 a návazná doprava",
    lead: "Zličín je konečná linky B a přestupní uzel autobusů — včetně linky 100 na Letiště Václava Havla.",
    intro:
      "Níže najdete, ze kterého stanoviště podle jízdního řádu PID odjíždí linka 100 a ostatní autobusy, a jejich polohu vůči vstupu do metra.",
    overviewSummary: "Kde nastoupit na autobus 100 na letiště a ostatní autobusová stanoviště.",
    destinations: [
      { id: "letiste", label: "Autobus 100 na letiště", action: { kind: "route", routeName: "100" } },
      { id: "odjezdy", label: "Odjezdy autobusů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "stanoviste", label: "Autobusová stanoviště", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "vystupy", label: "Výstupy z metra", action: { kind: "section", sectionId: "mapa" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "odjezdy", label: "Zobrazit odjezdy autobusů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "linka-100", label: "Kde nastoupit na 100", action: { kind: "route", routeName: "100" } },
      { id: "mapa", label: "Mapa stanovišť", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Co je dobré vědět",
        paragraphs: [
          "Linka 100 jezdí mezi Zličínem a Letištěm (Terminál 1) a je jednou z možností veřejné dopravy na letiště. Před přestupem si ověřte stanoviště, směr jízdy a odjezd na zastávkové tabuli PID.",
        ],
        sourceIds: ["pid-gtfs", "pid-odjezdy"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Vestibul stanice je v úrovni ulice a má bezbariérový přístup. Z vestibulu na nástupiště vede osobní výtah (č. 377). Na nástupišti je u prvního vozu nástupní rampa.",
          "Aktuální provoz výtahu ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Autobusová stanoviště",
      intro: "Ze kterého stanoviště odjíždí která linka — podle aktuálního jízdního řádu PID. Klepnutím otevřete navigaci přímo ke stanovišti.",
    },
    faq: [
      {
        question: "Kde nastoupím na autobus 100?",
        answer: "Na stanovišti, které je v seznamu stanovišť označené linkou 100. Údaj se denně přebírá z jízdního řádu PID — před cestou ho ověřte na tabuli.",
        more: { label: "Stanoviště", sectionId: "stanoviste" },
      },
      {
        question: "Jak ze Zličína na letiště?",
        answer: "Autobusovou linkou 100 směr Letiště. Aktuální odjezdy ukazuje zastávková tabule PID.",
        more: { label: "Odjezdy na pid.cz", linkId: "pid-odjezdy" },
      },
      {
        question: "Kde jsou autobusová stanoviště?",
        answer: "Polohu všech stanovišť ukazuje mapa, seznam pod ní k nim nabízí pěší navigaci.",
        more: { label: "Mapa stanovišť", sectionId: "mapa" },
      },
      {
        question: "Kde zjistím odjezdy?",
        answer: "Na zastávkové tabuli PID pro zastávku Zličín.",
        more: { label: "Odjezdy na pid.cz", linkId: "pid-odjezdy" },
      },
    ],
    links: [
      { ...pidBoard("Zličín", "Zličín"), url: "https://pid.cz/zastavkova-tabla/?stop=Zli%C4%8D%C3%ADn" },
      pidNodeMap("Zlicin", "Zličín"),
      dppAccessibility("trasa-b/Zlicin", "Zličín"),
      DPP_ELEVATOR_STATUS,
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "haje",
    stationId: "U286S1",
    name: "Háje",
    lines: ["C"],
    seoTitle: "Metro Háje – výstupy, autobusy a mapa | KdeJeMetro",
    seoDescription:
      "Metro Háje: přehled výstupů, návazné autobusové dopravy, bezbariérového přístupu a mapa okolí stanice.",
    h1: "Metro Háje – výstupy a autobusové spoje",
    lead: "Háje jsou konečná linky C a přestupní místo na autobusy — stanice má dva vestibuly.",
    intro:
      "Podle toho, kam pokračujete, se vyplatí zvolit správný vestibul. Mapa níže ukazuje oba výstupy a autobusová stanoviště podle dat PID.",
    overviewSummary: "Dva vestibuly, autobusová stanoviště a šikmý výtah na nástupiště.",
    destinations: [
      { id: "autobusy", label: "Autobusové zastávky", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "odjezdy", label: "Odjezdy autobusů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "vystupy", label: "Výstupy z metra", action: { kind: "section", sectionId: "mapa" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "odjezdy", label: "Zobrazit odjezdy autobusů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "mapa", label: "Mapa výstupů a stanovišť", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Dva vestibuly",
        paragraphs: [
          "Stanice má dva vestibuly. Do jednoho (pod úrovní ulice) vedou z nástupiště eskalátory a pevné schody, do druhého, ve směru k multikinu Galaxie a v úrovni ulice, vedou eskalátory.",
        ],
        sourceIds: ["dpp-bezbarierovost"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Mezi vestibulem a nástupištěm jezdí šikmý osobní výtah, vedený souběžně s eskalátory.",
          "Při poruše šikmého výtahu je přístup na nástupiště možný jen pro osoby na vozíku upravenými nákladními výtahy, a to v doprovodu proškolené osoby podle přepravních podmínek DPP. Aktuální provoz výtahu ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Autobusová stanoviště",
      intro: "Stanoviště zastávky Háje a linky, které z nich podle jízdního řádu PID odjíždějí.",
    },
    faq: [
      {
        question: "Kde jsou výstupy z metra Háje?",
        answer: "Stanice má dva vestibuly — jejich vstupy ukazuje mapa i seznam níže, každý s pěší navigací.",
        more: { label: "Mapa výstupů", sectionId: "mapa" },
      },
      {
        question: "Kde najdu autobusové zastávky?",
        answer: "V sekci Stanoviště najdete kód stanoviště, linky, které z něj odjíždějí, a navigaci k němu.",
        more: { label: "Stanoviště", sectionId: "stanoviste" },
      },
      {
        question: "Jak zjistím odjezdy autobusů?",
        answer: "Na zastávkové tabuli PID pro zastávku Háje.",
        more: { label: "Odjezdy na pid.cz", linkId: "pid-odjezdy" },
      },
      {
        question: "Je stanice bezbariérová?",
        answer: "Ano — mezi vestibulem a nástupištěm jezdí šikmý osobní výtah souběžně s eskalátory. Jeho provoz ověřte u DPP.",
        more: { label: "Bezbariérový přístup", sectionId: "bezbarierovost" },
      },
    ],
    links: [
      pidBoard("Háje", "Háje"),
      pidNodeMap("Haje", "Háje"),
      dppAccessibility("trasa-c/Haje", "Háje"),
      DPP_ELEVATOR_STATUS,
      PID_OPEN_DATA,
    ],
  },
  {
    slug: "letnany",
    stationId: "U1000S1",
    name: "Letňany",
    lines: ["C"],
    seoTitle: "Metro Letňany – autobusy, odjezdy a výstupy | KdeJeMetro",
    seoDescription:
      "Metro Letňany: kde najít autobusová stanoviště, aktuální odjezdy, výstupy z metra a bezbariérové trasy.",
    h1: "Metro Letňany – autobusový terminál a výstupy",
    lead: "Letňany jsou konečná linky C a přestupní uzel autobusů — z podchodu vede k terminálu několik výstupů.",
    intro:
      "Při přestupu na autobus se vyplatí vědět, ze kterého stanoviště vaše linka odjíždí a který výstup z podchodu je k němu nejblíž. Obojí ukazuje mapa níže.",
    overviewSummary: "Stanoviště autobusů, výstupy z podchodu a výtahy na povrch.",
    destinations: [
      { id: "stanoviste", label: "Autobusová stanoviště", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "odjezdy", label: "Odjezdy autobusů", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "vystupy", label: "Výstupy z metra", action: { kind: "section", sectionId: "mapa" } },
      { id: "bezbarierovy", label: "Bezbariérový přístup", action: { kind: "section", sectionId: "bezbarierovost" } },
    ],
    actions: [
      { id: "odjezdy", label: "Zobrazit odjezdy", action: { kind: "link", linkId: "pid-odjezdy" } },
      { id: "stanoviste", label: "Najít stanoviště linky", action: { kind: "section", sectionId: "stanoviste" } },
      { id: "mapa", label: "Mapa výstupů a stanovišť", action: { kind: "section", sectionId: "mapa" } },
    ],
    sections: [
      {
        id: "dobre-vedet",
        heading: "Nástupiště, podchod a výstupy",
        paragraphs: [
          "Z nástupiště se jde schodištěm se souběžnými eskalátory (nebo výtahem) do vestibulu pod úrovní ulice. Vestibul navazuje na podchod, ze kterého vede na povrch více výstupů a výtahy.",
          "Ke stanovišti autobusu proto vybírejte výstup podle mapy níže, ne podle prvního schodiště.",
        ],
        sourceIds: ["dpp-bezbarierovost", "pid-gtfs"],
      },
      {
        id: "bezbarierovost",
        heading: "Bezbariérový přístup",
        paragraphs: [
          "Výtah č. 441 spojuje nástupiště s vestibulem. Z podchodu v úrovni vestibulu vedou na ulici výtahy č. 438, 439, 440 a 442.",
          "Aktuální provoz výtahů ověřte u DPP.",
        ],
        sourceIds: ["dpp-bezbarierovost", "dpp-stav-vytahu"],
      },
    ],
    platforms: {
      heading: "Autobusová stanoviště",
      intro: "Ze kterého stanoviště odjíždí která linka — podle aktuálního jízdního řádu PID. Klepnutím otevřete navigaci přímo ke stanovišti.",
    },
    faq: [
      {
        question: "Kde najdu autobusová stanoviště?",
        answer: "V sekci Stanoviště je kód každého stanoviště s linkami, které z něj odjíždějí, a navigací k němu. Polohu ukazuje i mapa.",
        more: { label: "Stanoviště", sectionId: "stanoviste" },
      },
      {
        question: "Kde jsou aktuální odjezdy?",
        answer: "Na zastávkové tabuli PID pro zastávku Letňany.",
        more: { label: "Odjezdy na pid.cz", linkId: "pid-odjezdy" },
      },
      {
        question: "Jak se dostanu z metra k autobusům?",
        answer: "Z vestibulu do podchodu a odtud výstupem nejblíž ke stanovišti vaší linky — porovnejte polohu výstupů a stanovišť na mapě.",
        more: { label: "Mapa", sectionId: "mapa" },
      },
      {
        question: "Kde jsou výtahy?",
        answer: "Výtah č. 441 mezi nástupištěm a vestibulem, z podchodu na ulici výtahy č. 438, 439, 440 a 442. Vstupy s bezbariérovým přístupem jsou označené i v seznamu vstupů.",
        more: { label: "Stav výtahů (DPP)", linkId: "dpp-stav-vytahu" },
      },
    ],
    links: [
      pidBoard("Letňany", "Letňany"),
      pidNodeMap("Letnany", "Letňany"),
      dppAccessibility("trasa-c/Letnany", "Letňany"),
      DPP_ELEVATOR_STATUS,
      PID_OPEN_DATA,
    ],
  },
];

/** Pořadí v přehledu /stanice a v sitemapě — centrum, pak koncové uzly. */
const GUIDE_ORDER = ["mustek", "muzeum", "florenc", "cerny-most", "nadrazi-veleslavin", "zlicin", "haje", "letnany"];

export const ORDERED_STATION_GUIDES: readonly StationGuide[] = [...STATION_GUIDES].sort(
  (a, b) => GUIDE_ORDER.indexOf(a.slug) - GUIDE_ORDER.indexOf(b.slug)
);

export function getStationGuide(slug: string): StationGuide | undefined {
  return STATION_GUIDES.find((g) => g.slug === slug);
}

export const STATIONS_PATH = "/stanice";

export function stationGuidePath(slug: string): string {
  return `${STATIONS_PATH}/${slug}`;
}
