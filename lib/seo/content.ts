import type { Locale } from "../i18n/types.ts";

// Delší, převážně statický SEO obsah (úvod, "jak to funguje", tematický
// rozcestník, FAQ) — záměrně MIMO lib/i18n/dictionary.ts. Ten prochází
// přes I18nContext do klientského JS bundlu (viz I18nProvider.tsx);
// tenhle modul čtou jen serverové komponenty (components/seo/SeoContent.tsx)
// a metadata exporty na app/(cs)/page.tsx a app/en/page.tsx, takže nikdy
// nepřidává nic do klientského bundlu (viz zadání "nesmí výrazně navýšit
// klientský JavaScript").

export type SeoLink = { label: string; href: string };
export type FaqItem = { question: string; answer: string };

export type SeoContent = {
  /** <title> */
  title: string;
  /** <meta name="description"> */
  description: string;
  /** Viditelný <h1> stránky. */
  mainHeading: string;
  ogLocale: "cs_CZ" | "en_US" | "de_DE" | "uk_UA";
  intro: {
    id: string;
    heading: string;
    paragraphs: readonly [string, string];
  };
  howItWorks: {
    id: string;
    heading: string;
    steps: readonly string[];
    privacyId: string;
    privacyText: string;
  };
  links: {
    heading: string;
    ariaLabel: string;
    items: readonly SeoLink[];
  };
  faq: {
    id: string;
    heading: string;
    items: readonly FaqItem[];
  };
};

const cs: SeoContent = {
  title: "Nejbližší metro v Praze – vstupy a pěší navigace | KdeJeMetro.cz",
  description:
    "Najděte nejbližší vstup do pražského metra podle své polohy. Otevřete pěší navigaci v Google Maps, Apple Maps nebo Mapy.com.",
  mainHeading: "Kde je nejbližší metro v Praze?",
  ogLocale: "cs_CZ",
  intro: {
    id: "o-aplikaci",
    heading: "Pražské metro na jednom místě",
    paragraphs: [
      "KdeJeMetro.cz vám pomůže najít nejbližší metro v Praze a konkrétní vstup do stanice. Podle polohy zařízení porovná dostupné vstupy a zobrazí jejich vzdálenost i orientační čas chůze. Ke zvolenému vstupu můžete otevřít pěší navigaci v Google Maps, Apple Maps nebo Mapy.com.",
      "Aplikace pracuje s jednotlivými vstupy, nikoliv pouze se středem stanice. To je užitečné zejména u velkých přestupních stanic, kde mohou být jednotlivé východy od sebe poměrně daleko.",
    ],
  },
  howItWorks: {
    id: "jak-to-funguje",
    heading: "Jak to funguje",
    steps: ["Povolte přístup k poloze", "Vyberte nejbližší vstup", "Otevřete pěší navigaci"],
    privacyId: "soukromi",
    privacyText: "Vaše poloha zůstává ve vašem zařízení a nepoužíváme ji k reklamnímu cílení.",
  },
  links: {
    heading: "Nejčastěji hledané",
    ariaLabel: "Nejčastěji hledané odkazy",
    items: [
      { label: "Nejbližší metro v Praze", href: "#najit-metro" },
      { label: "Mapa metra Praha", href: "#mapa-metra" },
      { label: "Jak najít nejbližší vstup", href: "#jak-to-funguje" },
      { label: "Metro Praha – linky A, B a C", href: "#mapa-metra" },
      { label: "Pěší navigace ke vstupu", href: "#jak-to-funguje" },
      { label: "Jak aplikace pracuje s polohou", href: "#soukromi" },
    ],
  },
  faq: {
    id: "caste-dotazy",
    heading: "Časté dotazy",
    items: [
      {
        question: "Kde je nejbližší metro v Praze?",
        answer: "Po povolení polohy aplikace okamžitě ukáže tři nejbližší vstupy do pražského metra seřazené podle vzdálenosti od vašeho zařízení.",
      },
      {
        question: "Ukazuje aplikace konkrétní vstupy do metra?",
        answer:
          "Ano. KdeJeMetro.cz pracuje s jednotlivými vstupy do stanic, ne jen s jejich středem — u velkých přestupních stanic proto najdete ten nejbližší z více východů.",
      },
      {
        question: "Je uvedená vzdálenost pěší trasa?",
        answer:
          "Ne. Zobrazená vzdálenost i orientační čas chůze jsou počítané vzdušnou čarou. Skutečnou pěší trasu ukáže až navigace v Google Maps, Apple Maps nebo Mapy.com.",
      },
      {
        question: "Ukládá KdeJeMetro.cz moji polohu?",
        answer: "Ne. Poloha se zpracovává pouze ve vašem prohlížeči a nikam se neodesílá ani neukládá.",
      },
      {
        question: "Jak otevřu navigaci ke vstupu?",
        answer: "U každého vstupu klepněte na tlačítko Google Maps, Apple Maps nebo Mapy.com — otevře se pěší trasa přímo k jeho GPS souřadnicím.",
      },
      {
        question: "Má Brno metro?",
        answer: "Ne, Brno metro nemá. Pokud jste v okolí Brna, aplikace vás na to hravě upozorní a ukáže vzdálenost k nejbližšímu pražskému metru.",
      },
    ],
  },
};

const en: SeoContent = {
  title: "Nearest Prague Metro Entrance & Walking Directions | KdeJeMetro.cz",
  description: "Find the nearest entrance to the Prague Metro and open walking directions in Google Maps, Apple Maps or Mapy.com.",
  mainHeading: "Find the nearest Prague Metro entrance",
  ogLocale: "en_US",
  intro: {
    id: "about",
    heading: "Find your way around the Prague Metro",
    paragraphs: [
      "KdeJeMetro.cz helps you find the nearest Prague Metro entrance using your device location. It compares individual entrances and shows their distance and estimated walking time. You can then open walking directions in Google Maps, Apple Maps or Mapy.com.",
      "The app works with individual metro entrances rather than only the centre of each station. This is especially useful at large interchange stations, where different exits may be several minutes apart.",
    ],
  },
  howItWorks: {
    id: "how-it-works",
    heading: "How it works",
    steps: ["Allow location access", "Choose the nearest entrance", "Open walking directions"],
    privacyId: "privacy",
    privacyText: "Your location stays on your device and is not used for advertising targeting.",
  },
  links: {
    heading: "Explore the Prague Metro",
    ariaLabel: "Explore the Prague Metro links",
    items: [
      { label: "Nearest Prague Metro entrance", href: "#find-entrance" },
      { label: "Prague Metro map", href: "#metro-map" },
      { label: "How to find the closest entrance", href: "#how-it-works" },
      { label: "Prague Metro lines A, B and C", href: "#metro-map" },
      { label: "Walking directions to the metro", href: "#how-it-works" },
      { label: "How location data is handled", href: "#privacy" },
    ],
  },
  faq: {
    id: "faq",
    heading: "Frequently asked questions",
    items: [
      {
        question: "Where is the nearest Prague Metro entrance?",
        answer: "Once you allow location access, the app instantly shows the three nearest Prague Metro entrances, sorted by distance from your device.",
      },
      {
        question: "Does the app show individual metro entrances?",
        answer:
          "Yes. KdeJeMetro.cz works with individual station entrances rather than just the station centre, so at large interchange stations you'll find the closest of several exits.",
      },
      {
        question: "Is the displayed distance a walking route?",
        answer:
          "No. The distance and estimated walking time shown are calculated as the crow flies. The actual walking route only appears once you open directions in Google Maps, Apple Maps or Mapy.com.",
      },
      {
        question: "Does KdeJeMetro.cz store my location?",
        answer: "No. Your location is processed only in your browser and is never sent anywhere or stored.",
      },
      {
        question: "How can I open walking directions?",
        answer: "Tap the Google Maps, Apple Maps or Mapy.com button next to any entrance to open walking directions straight to its GPS coordinates.",
      },
      {
        question: "Does Brno have a metro?",
        answer: "No, Brno doesn't have a metro. If you're near Brno, the app will playfully let you know and show the distance to the nearest Prague Metro instead.",
      },
    ],
  },
};

const de: SeoContent = {
  title: "Nächster Metroeingang in Prag & Fußweg | KdeJeMetro.cz",
  description:
    "Finden Sie den nächsten Eingang zur Prager Metro und öffnen Sie die Fußgängernavigation in Google Maps, Apple Maps oder Mapy.com.",
  mainHeading: "Finden Sie den nächsten Metroeingang in Prag",
  ogLocale: "de_DE",
  intro: {
    id: "ueber-die-app",
    heading: "Die Prager Metro auf einen Blick",
    paragraphs: [
      "KdeJeMetro.cz hilft Ihnen, den nächsten Eingang zur Prager Metro anhand des Standorts Ihres Geräts zu finden. Die App vergleicht die verfügbaren Eingänge und zeigt deren Entfernung sowie die ungefähre Gehzeit an. Zum gewählten Eingang können Sie die Fußgängernavigation in Google Maps, Apple Maps oder Mapy.com öffnen.",
      "Die App arbeitet mit einzelnen Eingängen und nicht nur mit der Mitte der Station. Das ist besonders bei großen Umsteigestationen nützlich, wo die einzelnen Ausgänge mitunter recht weit voneinander entfernt liegen.",
    ],
  },
  howItWorks: {
    id: "so-funktioniert-es",
    heading: "So funktioniert es",
    steps: ["Standortzugriff erlauben", "Nächsten Eingang auswählen", "Fußgängernavigation öffnen"],
    privacyId: "datenschutz",
    privacyText: "Ihr Standort bleibt auf Ihrem Gerät und wird nicht für Werbezwecke verwendet.",
  },
  links: {
    heading: "Prager Metro entdecken",
    ariaLabel: "Links zur Prager Metro entdecken",
    items: [
      { label: "Nächster Metroeingang in Prag", href: "#naechste-metro" },
      { label: "Metroplan Prag", href: "#metroplan" },
      { label: "So finden Sie den nächsten Eingang", href: "#so-funktioniert-es" },
      { label: "Prager Metro – Linien A, B und C", href: "#metroplan" },
      { label: "Fußgängernavigation zum Eingang", href: "#so-funktioniert-es" },
      { label: "Wie die App mit Standortdaten umgeht", href: "#datenschutz" },
    ],
  },
  faq: {
    id: "haeufige-fragen",
    heading: "Häufig gestellte Fragen",
    items: [
      {
        question: "Wo ist der nächste Metroeingang in Prag?",
        answer:
          "Sobald Sie den Standortzugriff erlauben, zeigt die App sofort die drei nächstgelegenen Eingänge zur Prager Metro, sortiert nach Entfernung von Ihrem Gerät.",
      },
      {
        question: "Zeigt die App einzelne Metroeingänge an?",
        answer:
          "Ja. KdeJeMetro.cz arbeitet mit einzelnen Stationseingängen, nicht nur mit der Stationsmitte — bei großen Umsteigestationen finden Sie so den nächstgelegenen von mehreren Ausgängen.",
      },
      {
        question: "Ist die angezeigte Entfernung die tatsächliche Gehstrecke?",
        answer:
          "Nein. Die angezeigte Entfernung und die geschätzte Gehzeit werden als Luftlinie berechnet. Die tatsächliche Gehstrecke zeigt erst die Navigation in Google Maps, Apple Maps oder Mapy.com.",
      },
      {
        question: "Speichert KdeJeMetro.cz meinen Standort?",
        answer: "Nein. Ihr Standort wird nur in Ihrem Browser verarbeitet und nirgendwohin gesendet oder gespeichert.",
      },
      {
        question: "Wie öffne ich die Navigation zum Eingang?",
        answer:
          "Tippen Sie bei einem Eingang auf die Schaltfläche Google Maps, Apple Maps oder Mapy.com — die Fußgängernavigation öffnet sich direkt zu den GPS-Koordinaten dieses Eingangs.",
      },
      {
        question: "Hat Brünn eine Metro?",
        answer:
          "Nein, Brünn hat keine Metro. Wenn Sie sich in der Nähe von Brünn befinden, macht die App Sie augenzwinkernd darauf aufmerksam und zeigt stattdessen die Entfernung zur nächsten Prager Metrostation.",
      },
    ],
  },
};

const uk: SeoContent = {
  title: "Найближчий вхід до метро в Празі | KdeJeMetro.cz",
  description:
    "Знайдіть найближчий вхід до празького метро та відкрийте пішохідний маршрут у Google Maps, Apple Maps або Mapy.com.",
  mainHeading: "Знайдіть найближчий вхід до метро в Празі",
  ogLocale: "uk_UA",
  intro: {
    id: "pro-zastosunok",
    heading: "Усе необхідне про празьке метро",
    paragraphs: [
      "KdeJeMetro.cz допоможе вам знайти найближчий вхід до празького метро на основі місцезнаходження вашого пристрою. Застосунок порівнює доступні входи та показує відстань і орієнтовний час пішої ходьби до кожного з них. До обраного входу можна відкрити пішохідний маршрут у Google Maps, Apple Maps або Mapy.com.",
      "Застосунок працює з окремими входами, а не лише з центром станції. Це особливо корисно на великих пересадкових станціях, де окремі виходи можуть бути досить далеко один від одного.",
    ],
  },
  howItWorks: {
    id: "yak-tse-pratsiuie",
    heading: "Як це працює",
    steps: ["Дозволити доступ до місцезнаходження", "Обрати найближчий вхід", "Відкрити пішохідний маршрут"],
    privacyId: "konfidentsiinist",
    privacyText: "Ваше місцезнаходження залишається на вашому пристрої і не використовується для рекламного таргетингу.",
  },
  links: {
    heading: "Дізнайтеся більше про празьке метро",
    ariaLabel: "Посилання про празьке метро",
    items: [
      { label: "Найближчий вхід до метро в Празі", href: "#znaity-metro" },
      { label: "Карта метро Праги", href: "#skhema-metro" },
      { label: "Як знайти найближчий вхід", href: "#yak-tse-pratsiuie" },
      { label: "Метро Праги — лінії A, B і C", href: "#skhema-metro" },
      { label: "Пішохідний маршрут до входу", href: "#yak-tse-pratsiuie" },
      { label: "Як застосунок працює з вашим місцезнаходженням", href: "#konfidentsiinist" },
    ],
  },
  faq: {
    id: "chasti-zapytannia",
    heading: "Часті запитання",
    items: [
      {
        question: "Де найближчий вхід до метро в Празі?",
        answer:
          "Щойно ви дозволите доступ до місцезнаходження, застосунок одразу покаже три найближчі входи до празького метро, відсортовані за відстанню від вашого пристрою.",
      },
      {
        question: "Чи показує застосунок окремі входи до метро?",
        answer:
          "Так. KdeJeMetro.cz працює з окремими входами до станцій, а не лише з центром станції — тож на великих пересадкових станціях ви знайдете найближчий із кількох виходів.",
      },
      {
        question: "Чи є вказана відстань пішим маршрутом?",
        answer:
          "Ні. Показана відстань і орієнтовний час ходьби розраховані по прямій лінії. Фактичний піший маршрут покаже лише навігація в Google Maps, Apple Maps або Mapy.com.",
      },
      {
        question: "Чи зберігає KdeJeMetro.cz моє місцезнаходження?",
        answer: "Ні. Ваше місцезнаходження обробляється лише у вашому браузері і нікуди не надсилається та не зберігається.",
      },
      {
        question: "Як відкрити навігацію до входу?",
        answer:
          "Натисніть біля потрібного входу кнопку Google Maps, Apple Maps або Mapy.com — відкриється пішохідний маршрут прямо до GPS-координат цього входу.",
      },
      {
        question: "Чи є метро в Брно?",
        answer:
          "Ні, у Брно немає метро. Якщо ви перебуваєте поблизу Брно, застосунок жартівливо повідомить вам про це і натомість покаже відстань до найближчої станції празького метро.",
      },
    ],
  },
};

export const seoContents: Record<Locale, SeoContent> = { cs, en, de, uk };

export function getSeoContent(locale: Locale): SeoContent {
  return seoContents[locale];
}
