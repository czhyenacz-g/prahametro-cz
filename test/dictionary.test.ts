import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getDictionary, getMainHeading, dictionaries } from "../lib/i18n/dictionary.ts";
import { LOCALES } from "../lib/i18n/types.ts";

describe("getDictionary", () => {
  test("čeština má správné klíčové texty", () => {
    const dict = getDictionary("cs");
    assert.equal(dict.finder.heading, "Kde je nejbližší metro?");
    assert.equal(dict.finder.headingVulgar, "Kde je to zkurvený metro?!!");
    assert.equal(dict.header.subtitle, "Najdi nejbližší vstup a nech se k němu navigovat.");
  });

  test("angličtina má správné klíčové texty", () => {
    const dict = getDictionary("en");
    assert.equal(dict.finder.heading, "Where is the nearest metro?");
    assert.equal(dict.finder.headingVulgar, "Where's the fucking metro?!");
    assert.equal(dict.header.subtitle, "Find the nearest entrance and navigate to it.");
  });
});

describe("getMainHeading", () => {
  test("cs, vypnutý 18+", () => {
    assert.equal(getMainHeading("cs", false), "Kde je nejbližší metro?");
  });

  test("cs, zapnutý 18+", () => {
    assert.equal(getMainHeading("cs", true), "Kde je to zkurvený metro?!!");
  });

  test("en, vypnutý 18+", () => {
    assert.equal(getMainHeading("en", false), "Where is the nearest metro?");
  });

  test("en, zapnutý 18+", () => {
    assert.equal(getMainHeading("en", true), "Where's the fucking metro?!");
  });

  test("vulgarita se zachová při přepnutí jazyka (stejný boolean, jiný jazyk)", () => {
    const vulgarCs = getMainHeading("cs", true);
    const vulgarEn = getMainHeading("en", true);
    assert.notEqual(vulgarCs, vulgarEn);
    // Obě varianty musí zůstat "vulgární" verzí svého jazyka, ne normální hláškou.
    assert.equal(vulgarCs, getDictionary("cs").finder.headingVulgar);
    assert.equal(vulgarEn, getDictionary("en").finder.headingVulgar);
  });
});

describe("navigační tlačítka Google Maps / Apple Maps / Mapy.com — přístupné popisky cs/en", () => {
  test("názvy služeb se nepřekládají", () => {
    assert.equal(getDictionary("cs").result.googleMapsLabel, "Google Maps");
    assert.equal(getDictionary("en").result.googleMapsLabel, "Google Maps");
    assert.equal(getDictionary("cs").result.appleMapsLabel, "Apple Maps");
    assert.equal(getDictionary("en").result.appleMapsLabel, "Apple Maps");
    assert.equal(getDictionary("cs").result.mapyComLabel, "Mapy.com");
    assert.equal(getDictionary("en").result.mapyComLabel, "Mapy.com");
  });

  test("české přístupné popisky", () => {
    assert.equal(getDictionary("cs").result.googleMapsAriaLabel, "Spustit pěší navigaci v Google Maps");
    assert.equal(getDictionary("cs").result.appleMapsAriaLabel, "Spustit pěší navigaci v Apple Maps");
    assert.equal(getDictionary("cs").result.mapyComAriaLabel, "Spustit pěší navigaci v Mapy.com");
  });

  test("anglické přístupné popisky", () => {
    assert.equal(getDictionary("en").result.googleMapsAriaLabel, "Start walking navigation in Google Maps");
    assert.equal(getDictionary("en").result.appleMapsAriaLabel, "Start walking navigation in Apple Maps");
    assert.equal(getDictionary("en").result.mapyComAriaLabel, "Start walking navigation in Mapy.com");
  });
});

describe("vizuální redesign — odstranění samostatné ±přesnosti", () => {
  test("dict.finder.status už neobsahuje pole lowAccuracy (cs/en)", () => {
    assert.equal("lowAccuracy" in getDictionary("cs").finder.status, false);
    assert.equal("lowAccuracy" in getDictionary("en").finder.status, false);
  });

  test("žádný text ve finder.status neobsahuje ±", () => {
    for (const locale of ["cs", "en"] as const) {
      for (const text of Object.values(getDictionary(locale).finder.status)) {
        assert.doesNotMatch(text as string, /±/);
      }
    }
  });

  test("text 'poloha zůstává jen ve vašem zařízení' zůstal zachovaný (cs/en)", () => {
    assert.equal(getDictionary("cs").finder.privacyNote, "Poloha zůstává jen ve vašem zařízení.");
    assert.equal(getDictionary("en").finder.privacyNote, "Your location stays only on your device.");
  });
});

describe("reklamní štítek — dict.ad", () => {
  test("14. český štítek 'Reklama'", () => {
    assert.equal(getDictionary("cs").ad.label, "Reklama");
  });

  test("15. anglický štítek 'Advertisement'", () => {
    assert.equal(getDictionary("en").ad.label, "Advertisement");
  });

  test("dict.ad už neobsahuje pole comingSoon — kampaň bez odkazu se nikdy nevykresluje jako neaktivní CTA (cs/en)", () => {
    assert.equal("comingSoon" in getDictionary("cs").ad, false);
    assert.equal("comingSoon" in getDictionary("en").ad, false);
  });
});

describe("outsidePrague — obecná a brněnská hláška (cs/en)", () => {
  test("16. obecná česká hláška mimo Prahu", () => {
    const dict = getDictionary("cs");
    assert.equal(dict.outsidePrague.title, "Tady už pražské metro opravdu nejezdí.");
    assert.equal(dict.outsidePrague.body("Muzeum", "30 km"), "Nejbližší vstup je u stanice Muzeum, přibližně 30 km vzdušnou čarou.");
  });

  test("16. obecná anglická hláška mimo Prahu", () => {
    const dict = getDictionary("en");
    assert.equal(dict.outsidePrague.title, "The Prague Metro really doesn’t run this far.");
    assert.equal(dict.outsidePrague.body("Museum", "18.6 mi"), "The nearest entrance is at Museum, approximately 18.6 mi away as the crow flies.");
  });

  test("15. brněnská česká hláška", () => {
    const dict = getDictionary("cs");
    assert.equal(dict.outsidePrague.brnoTitle, "Ne, Brno opravdu metro nemá!");
    assert.equal(dict.outsidePrague.brnoBody("Muzeum", "190 km"), "Nejbližší pražské metro je Muzeum, přibližně 190 km vzdušnou čarou.");
  });

  test("15. brněnská anglická hláška", () => {
    const dict = getDictionary("en");
    assert.equal(dict.outsidePrague.brnoTitle, "No, Brno really doesn’t have a metro!");
    assert.equal(dict.outsidePrague.brnoBody("Museum", "118 mi"), "The nearest Prague Metro entrance is at Museum, approximately 118 mi away as the crow flies.");
  });

  test("brněnská a obecná hláška se od sebe liší (jiný text, ne jen jiná data)", () => {
    const cs = getDictionary("cs");
    assert.notEqual(cs.outsidePrague.title, cs.outsidePrague.brnoTitle);
    const en = getDictionary("en");
    assert.notEqual(en.outsidePrague.title, en.outsidePrague.brnoTitle);
  });
});

describe("dict.departures — panel odjezdů (cs/en, viz zadání bod 11)", () => {
  test("10. přesné české texty", () => {
    const d = getDictionary("cs").departures;
    assert.equal(d.buttonLabel, "Odjezdy");
    assert.equal(d.nextHeading, "Nejbližší odjezdy");
    assert.equal(d.lastHeading, "Poslední metro podle jízdního řádu");
    assert.equal(d.towards("Zličín"), "směr Zličín");
    assert.equal(d.lineLabel, "Linka");
    assert.equal(d.sourceLabel, "Jízdní řád PID");
    assert.equal(d.updatedLabel, "aktualizováno");
    assert.equal(d.checkInPidLitacka, "Ověřit v PID Lítačce");
    assert.equal(d.dialogCloseLabel, "Zavřít odjezdy");
    assert.equal(d.errorTitle, "Odjezdy se nyní nepodařilo načíst.");
    assert.equal(d.errorBody, "Ověřte aktuální spojení v aplikaci PID Lítačka.");
    assert.equal(d.staleTitle, "Jízdní řád nemusí být aktuální.");
    assert.equal(d.staleBody, "Ověřte poslední spoj v PID Lítačce.");
  });

  test("10. přesné anglické texty", () => {
    const d = getDictionary("en").departures;
    assert.equal(d.buttonLabel, "Departures");
    assert.equal(d.nextHeading, "Next scheduled departures");
    assert.equal(d.lastHeading, "Last scheduled metro");
    assert.equal(d.towards("Zličín"), "towards Zličín");
    assert.equal(d.lineLabel, "Line");
    assert.equal(d.sourceLabel, "PID timetable");
    assert.equal(d.updatedLabel, "updated");
    assert.equal(d.checkInPidLitacka, "Check in PID Lítačka");
    assert.equal(d.dialogCloseLabel, "Close departures");
    assert.equal(d.errorTitle, "Departures could not be loaded right now.");
    assert.equal(d.errorBody, "Please verify your journey in the PID Lítačka app.");
    assert.equal(d.staleTitle, "The timetable may be out of date.");
    assert.equal(d.staleBody, "Please verify the last service in PID Lítačka.");
  });

  test("směr stanice se nepřekládá — 'towards'/'směr' obalí stejný název stanice beze změny", () => {
    const stationName = "Nemocnice Motol";
    assert.match(getDictionary("cs").departures.towards(stationName), new RegExp(stationName));
    assert.match(getDictionary("en").departures.towards(stationName), new RegExp(stationName));
  });

  test("žádné tvrzení 'metro (ne)jede' — jen formulace o jízdním řádu", () => {
    for (const locale of ["cs", "en"] as const) {
      const d = getDictionary(locale).departures;
      for (const text of [d.lastHeading, d.staleTitle, d.staleBody, d.errorTitle, d.errorBody]) {
        assert.doesNotMatch(text, /metro (už |ještě )?(nejede|jede)|metro (isn't|is) running/i);
      }
    }
  });
});

describe("TypeScript vynucuje kompletnost — všechny 4 jazyky mají Dictionary (rozšíření o de/uk)", () => {
  test("dictionaries obsahuje přesně cs/en/de/uk, žádný jazyk nechybí ani nepřebývá", () => {
    assert.deepEqual(Object.keys(dictionaries).sort(), [...LOCALES].sort());
  });
});

describe("německá jazyková verze (de) — klíčové texty přesně podle zadání", () => {
  test("hlavička a hlavní nadpis", () => {
    const dict = getDictionary("de");
    assert.equal(dict.header.subtitle, "Finden Sie den nächsten Eingang und lassen Sie sich zu Fuß dorthin navigieren.");
    assert.equal(dict.finder.heading, "Wo ist die nächste Metro?");
    assert.equal(dict.finder.headingVulgar, "Wo ist die verdammte Metro?!!");
    assert.equal(dict.finder.privacyNote, "Ihr Standort bleibt ausschließlich auf Ihrem Gerät.");
  });

  test("přístupné popisky vulgárního přepínače používají konzistentně vykání (Sie)", () => {
    const dict = getDictionary("de");
    assert.match(dict.header.vulgarAriaLabelOn, /\bSie\b|Derben Modus/);
    assert.match(dict.header.vulgarAriaLabelOff, /\bSie\b|Derben Modus/);
    for (const text of [dict.header.vulgarAriaLabelOn, dict.header.vulgarAriaLabelOff, dict.finder.privacyNote]) {
      assert.doesNotMatch(text, /\bdu\b|\bdein\b|\bdeine\b/i);
    }
  });

  test("navigační tlačítka — názvy služeb se nepřekládají, aria-labely v němčině", () => {
    const dict = getDictionary("de");
    assert.equal(dict.result.googleMapsLabel, "Google Maps");
    assert.equal(dict.result.appleMapsLabel, "Apple Maps");
    assert.equal(dict.result.mapyComLabel, "Mapy.com");
    assert.equal(dict.result.googleMapsAriaLabel, "Fußgängernavigation in Google Maps starten");
    assert.equal(dict.result.appleMapsAriaLabel, "Fußgängernavigation in Apple Maps starten");
    assert.equal(dict.result.mapyComAriaLabel, "Fußgängernavigation in Mapy.com starten");
  });

  test("outsidePrague — obecná a brněnská hláška", () => {
    const dict = getDictionary("de");
    assert.equal(dict.outsidePrague.title, "Hier fährt die Prager Metro wirklich nicht mehr.");
    assert.equal(
      dict.outsidePrague.body("Muzeum", "30 km"),
      "Der nächste Eingang befindet sich an der Station Muzeum, ungefähr 30 km Luftlinie entfernt."
    );
    assert.equal(dict.outsidePrague.brnoTitle, "Nein, Brno hat wirklich keine Metro!");
    assert.notEqual(dict.outsidePrague.title, dict.outsidePrague.brnoTitle);
  });

  test("reklamní štítek 'Werbung'", () => {
    assert.equal(getDictionary("de").ad.label, "Werbung");
  });

  test("panel odjezdů", () => {
    const d = getDictionary("de").departures;
    assert.equal(d.buttonLabel, "Abfahrten");
    assert.equal(d.nextHeading, "Nächste planmäßige Abfahrten");
    assert.equal(d.lastHeading, "Letzte planmäßige Metro");
    assert.equal(d.towards("Zličín"), "Richtung Zličín");
    assert.equal(d.lineLabel, "Linie");
    assert.equal(d.checkInPidLitacka, "In PID Lítačka prüfen");
    assert.equal(d.staleTitle, "Der Fahrplan ist möglicherweise nicht aktuell.");
  });

  test("mapa metra — nadpis a instrukce", () => {
    const map = getDictionary("de").map;
    assert.equal(map.heading, "Metroplan");
    assert.match(map.subtitle, /[Zz]oom/);
  });

  test("žádný viditelný český nebo anglický text neproniká do němčiny (namátkové porovnání s cs/en)", () => {
    const de = getDictionary("de");
    const cs = getDictionary("cs");
    const en = getDictionary("en");
    assert.notEqual(de.header.subtitle, cs.header.subtitle);
    assert.notEqual(de.header.subtitle, en.header.subtitle);
    assert.notEqual(de.finder.heading, cs.finder.heading);
    assert.notEqual(de.finder.heading, en.finder.heading);
  });
});

describe("ukrajinská jazyková verze (uk, URL /ua) — klíčové texty přesně podle zadání", () => {
  test("hlavička a hlavní nadpis", () => {
    const dict = getDictionary("uk");
    assert.equal(dict.header.subtitle, "Знайдіть найближчий вхід і відкрийте пішохідний маршрут до нього.");
    assert.equal(dict.finder.heading, "Де найближче метро?");
    assert.equal(dict.finder.headingVulgar, "Де це довбане метро?!!");
    assert.equal(dict.finder.privacyNote, "Дані про ваше місцезнаходження залишаються лише на вашому пристрої.");
  });

  test("přístupné popisky vulgárního přepínače", () => {
    const dict = getDictionary("uk");
    assert.equal(dict.header.vulgarAriaLabelOn, "Вимкнути грубий режим");
    assert.equal(dict.header.vulgarAriaLabelOff, "Увімкнути грубий режим");
  });

  test("navigační tlačítka — názvy služeb se nepřekládají, aria-labely v ukrajinštině", () => {
    const dict = getDictionary("uk");
    assert.equal(dict.result.googleMapsLabel, "Google Maps");
    assert.equal(dict.result.appleMapsLabel, "Apple Maps");
    assert.equal(dict.result.mapyComLabel, "Mapy.com");
    assert.match(dict.result.googleMapsAriaLabel, /Google Maps/);
    assert.match(dict.result.appleMapsAriaLabel, /Apple Maps/);
    assert.match(dict.result.mapyComAriaLabel, /Mapy\.com/);
  });

  test("outsidePrague — obecná a brněnská hláška", () => {
    const dict = getDictionary("uk");
    assert.equal(dict.outsidePrague.title, "Сюди празьке метро справді не їздить.");
    assert.equal(dict.outsidePrague.brnoTitle, "Ні, у Брно справді немає метро!");
    assert.notEqual(dict.outsidePrague.title, dict.outsidePrague.brnoTitle);
  });

  test("reklamní štítek 'Реклама'", () => {
    assert.equal(getDictionary("uk").ad.label, "Реклама");
  });

  test("panel odjezdů", () => {
    const d = getDictionary("uk").departures;
    assert.equal(d.buttonLabel, "Відправлення");
    assert.equal(d.towards("Zličín"), "у напрямку Zličín");
    assert.equal(d.lineLabel, "Лінія");
    assert.equal(d.checkInPidLitacka, "Перевірити в PID Lítačka");
  });

  test("mapa metra — nadpis", () => {
    assert.equal(getDictionary("uk").map.heading, "Схема метро");
  });

  test("žádné ruské varianty místo ukrajinských (namátková kontrola typických rusismů)", () => {
    const uk = getDictionary("uk");
    const allText = JSON.stringify(uk);
    // Ruské tvary, které se v ukrajinském textu objevit nesmí (např. "где"
    // místo "де", azbukou psané "ы" — v ukrajinské abecedě neexistuje).
    assert.doesNotMatch(allText, /[ыъэё]/);
  });

  test("žádný viditelný český nebo anglický text neproniká do ukrajinštiny", () => {
    const uk = getDictionary("uk");
    const cs = getDictionary("cs");
    const en = getDictionary("en");
    assert.notEqual(uk.header.subtitle, cs.header.subtitle);
    assert.notEqual(uk.header.subtitle, en.header.subtitle);
  });
});

describe("18+ (vulgární) stav je nezávislý na jazyce — sdílený localStorage klíč napříč všemi 4 jazyky", () => {
  test("VULGAR_STORAGE_KEY je jediná globální konstanta, ne odvozená od locale", () => {
    const source = readFileSourceForVulgarKey();
    assert.match(source, /VULGAR_STORAGE_KEY = "kdejemetro_vulgar"/);
    assert.doesNotMatch(source, /VULGAR_STORAGE_KEY.*\$\{.*locale/);
  });

  test("getMainHeading vrací nevulgární variantu pro de/uk, když je 18+ vypnuté", () => {
    assert.equal(getMainHeading("de", false), "Wo ist die nächste Metro?");
    assert.equal(getMainHeading("uk", false), "Де найближче метро?");
  });

  test("getMainHeading vrací vulgární variantu pro de/uk, když je 18+ zapnuté, a liší se od nevulgární", () => {
    const deVulgar = getMainHeading("de", true);
    const ukVulgar = getMainHeading("uk", true);
    assert.equal(deVulgar, "Wo ist die verdammte Metro?!!");
    assert.equal(ukVulgar, "Де це довбане метро?!!");
    assert.notEqual(deVulgar, getMainHeading("de", false));
    assert.notEqual(ukVulgar, getMainHeading("uk", false));
  });
});

function readFileSourceForVulgarKey(): string {
  return readFileSync(fileURLToPath(new URL("../lib/i18n/types.ts", import.meta.url)), "utf-8");
}
