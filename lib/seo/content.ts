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
  ogLocale: "cs_CZ" | "en_US";
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

export const seoContents: Record<Locale, SeoContent> = { cs, en };

export function getSeoContent(locale: Locale): SeoContent {
  return seoContents[locale];
}
