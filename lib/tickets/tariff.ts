/**
 * Tarif PID pro stránku /jizdenky-praha — RUČNĚ ověřené údaje, žádné
 * stahování z cizích webů. Při změně tarifu PID upravte ceny, `TARIFF_YEAR`
 * a `TARIFF_VERIFIED_AT` (rok v titulku stránky se NIKDY nemění sám).
 *
 * Ověřeno 2026-10-25:
 * - ceny Lítačka / papírová: https://pid.cz/jizdne-a-tarif/ (plnocenné 15–60 let)
 *   a https://www.dpp.cz/jizdne/cenik-jizdneho
 * - SMS (číslo 90206, kódy DPT…, potvrzení "Ano" u 24/72 h, pásma P, 0, B,
 *   neplatí ve vlacích, ve vnějších pásmech a na AE): https://www.dpp.cz/jizdne/sms-jizdenka
 * - způsoby nákupu, označování, terminály ve vozidlech:
 *   https://pid.cz/jizdne-a-tarif/jak-poridit-jizdenku/
 * - aktivace v PID Lítačce (platnost 1 minutu po nákupu):
 *   https://pid.cz/informace-k-cestovani/mobilni-aplikace/
 * - přestupnost 30/90 min (kromě AE a lanovky na Petřín):
 *   https://pid.cz/jizdne-a-tarif/tarifni-pasma-pid/
 */
export const TARIFF_YEAR = 2026;
export const TARIFF_VERIFIED_AT = "2026-10-25";

export type TicketDurationId = "30min" | "90min" | "24h" | "72h";

export type TicketPriceRow = {
  id: TicketDurationId;
  label: string;
  /** Elektronická jízdenka v aplikaci PID Lítačka. */
  app: number;
  /** Papírová jízdenka (automat, prodejní místo, terminál). */
  paper: number;
  sms: number;
};

/** Plnocenné jízdné pro cestování po Praze (pásma P, 0, B), 15–60 let. */
export const PRAGUE_PRICES: readonly TicketPriceRow[] = [
  { id: "30min", label: "30 minut", app: 36, paper: 39, sms: 42 },
  { id: "90min", label: "90 minut", app: 46, paper: 50, sms: 55 },
  { id: "24h", label: "24 hodin", app: 140, paper: 150, sms: 150 },
  { id: "72h", label: "72 hodin", app: 340, paper: 350, sms: 350 },
];

export const SMS_NUMBER = "90206";
/** Jak číslo píše DPP ("902 06") — jen pro zobrazení. */
export const SMS_NUMBER_DISPLAY = "902 06";

export type SmsTicketOption = {
  id: TicketDurationId;
  label: string;
  price: number;
  /** Přesný text SMS podle DPP. */
  code: string;
  /** DPP vyžaduje potvrzující SMS "Ano" na 902 06 (zpoplatněnou podle tarifu operátora). */
  needsConfirmation: boolean;
  /**
   * false = údaj se nepodařilo ověřit u DPP → tlačítko se NEZOBRAZÍ jako
   * aktivní (viz components/tickets/SmsTicketPicker.tsx).
   */
  verified: boolean;
};

export const SMS_OPTIONS: readonly SmsTicketOption[] = [
  { id: "30min", label: "30 minut", price: 42, code: "DPT42", needsConfirmation: false, verified: true },
  { id: "90min", label: "90 minut", price: 55, code: "DPT55", needsConfirmation: false, verified: true },
  { id: "24h", label: "24 hodin", price: 150, code: "DPT150", needsConfirmation: true, verified: true },
  { id: "72h", label: "72 hodin", price: 350, code: "DPT350", needsConfirmation: true, verified: true },
];

export type SmsPlatform = "ios" | "other";

/**
 * `sms:` URI s předvyplněným příjemcem a textem. Formát se liší:
 * - Android (a ostatní) — RFC 5724 query `sms:90206?body=DPT42`;
 * - iOS/iPadOS — Zprávy historicky čtou `sms:90206&body=DPT42`.
 * Nic se neodesílá samo — systém jen otevře koncept zprávy.
 */
export function buildSmsHref(code: string, platform: SmsPlatform, number: string = SMS_NUMBER): string {
  if (!/^\d+$/.test(number)) throw new RangeError(`Neplatné číslo SMS: ${number}`);
  const body = encodeURIComponent(code);
  return platform === "ios" ? `sms:${number}&body=${body}` : `sms:${number}?body=${body}`;
}

/** iPhone/iPod/iPad, včetně iPadOS, který se hlásí jako Mac s dotykem. */
export function detectSmsPlatform(userAgent: string, maxTouchPoints = 0): SmsPlatform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "other";
}

export function formatCzk(value: number): string {
  return `${value} Kč`;
}

export const TICKETS_PATH = "/jizdenky-praha";

/**
 * Locale -> cesta stránky jízdenek. Přeložené URL segmenty jako u noční
 * sekce (lib/i18n/night-routes.ts); používá hlavička (odkaz v aktuálním
 * jazyce), jazykové menu na stránce jízdenek, hreflang a sitemap.
 */
export const TICKETS_LOCALE_TO_ROUTE = {
  cs: TICKETS_PATH,
  en: "/en/prague-tickets",
  de: "/de/fahrkarten-prag",
  uk: "/ua/kvytky-praha",
} as const;

/** hreflang klastr stránky jízdenek (klíč `uk`, URL `/ua/…`), x-default = angličtina. */
export const TICKETS_HREFLANG = { ...TICKETS_LOCALE_TO_ROUTE, "x-default": TICKETS_LOCALE_TO_ROUTE.en };


export type TicketSource = { label: string; url: string; provider: "PID" | "DPP" };

export const TICKET_SOURCES: readonly TicketSource[] = [
  { label: "Jízdné a tarif (ceník jízdného v Praze)", url: "https://pid.cz/jizdne-a-tarif/", provider: "PID" },
  { label: "Jak pořídit jízdenku", url: "https://pid.cz/jizdne-a-tarif/jak-poridit-jizdenku/", provider: "PID" },
  { label: "SMS jízdenka", url: "https://www.dpp.cz/jizdne/sms-jizdenka", provider: "DPP" },
  { label: "Ceník jízdného DPP", url: "https://www.dpp.cz/jizdne/cenik-jizdneho", provider: "DPP" },
  { label: "Mobilní aplikace PID Lítačka (aktivace jízdenky)", url: "https://pid.cz/informace-k-cestovani/mobilni-aplikace/", provider: "PID" },
  { label: "Tarifní pásma a přestupnost jízdenek", url: "https://pid.cz/jizdne-a-tarif/tarifni-pasma-pid/", provider: "PID" },
  { label: "Doprava na letiště a nádraží", url: "https://pid.cz/informace-k-cestovani/doprava-letiste-nadrazi/", provider: "PID" },
];

export const PID_LITACKA_APP_URL = "https://app.pidlitacka.cz/";
