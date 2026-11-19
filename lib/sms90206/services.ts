import { SMS_NUMBER } from "../tickets/tariff.ts";

/**
 * Ověřené služby na čísle 90206 pro stránku /90206 — RUČNĚ ověřené údaje
 * přímo u provozovatelů (žádné stahování za běhu). Pražské kódy a ceny se
 * sem NEPÍŠÍ: berou se z lib/tickets/tariff.ts (`SMS_OPTIONS`), stejně
 * jako na /jizdenky-praha.
 *
 * Při kontrole projděte každý `sourceUrl`, upravte řádky a `SMS_90206_VERIFIED_AT`.
 * Do přehledu patří jen služba, jejíž provozovatel výslovně uvádí 90206
 * jako číslo pro objednávku. Úplný veřejný seznam všech služeb na 90206
 * neexistuje — proto "Ověřené služby", ne "všechny".
 *
 * Ověřeno 2026-11-19:
 * - Brno: https://www.dpmb.cz/jizdenky-v-mobilu (tabulka zón 100+101, číslo 90206)
 * - Plzeň: https://www.pmdp.cz/jizdne/sms-jizdenka/
 * - Olomouc: https://www.dpmo.cz/informace-pro-cestujici/sms-jizdenka/
 * - České Budějovice: https://www.dpmcb.cz/cestovani-mhd/koupit-jizdenky/sms-jizdenka.html
 *   (BUD30 = 30 minut / 20 Kč podle grafiky dopravce na stejné stránce)
 * - Pardubice: https://www.dpmp.cz/cestovani-mhd/koupit-jizdenky/sms-jizdenka.html
 *   (kódy z odkazů sms:90206, ceny z tarifu https://www.dpmp.cz/cestovani-mhd/tarif-jizdneho-mhd.html)
 * - Ústí nad Labem: https://dpmul.cz/cestovani-mhd/koupit-jizdenku/sms a ceník
 *   https://dpmul.cz/cestovani-mhd/jizdne-mhd/cenik-jizdneho
 * - Liberec: https://www.dpmlj.cz/mhd-liberec/informace/sms-jizdenka
 * - Parkovné Pardubice: https://www.dpmp.cz/dalsi-sluzby/parkovani-v-pardubicich/kratkodobe-parkovani/sms-parkovne.html
 * - SMS TIR Parking: https://www.smstirparking.cz/cz/jak-to-funguje/
 */
export const SMS_90206_VERIFIED_AT = "2026-11-19";

export const SMS_90206_PATH = "/90206";

export type CitySmsTicket = {
  code: string;
  validity: string;
  price: number;
  /** Krátká poznámka k variantě (nárok na slevu, zóna). */
  note?: string;
};

export type CitySmsService = {
  id: string;
  city: string;
  operator: string;
  tickets: readonly CitySmsTicket[];
  /** Zóna / územní platnost podle dopravce. */
  area: string;
  sourceUrl: string;
};

export const CITY_SMS_SERVICES: readonly CitySmsService[] = [
  {
    id: "brno",
    city: "Brno",
    operator: "DPMB",
    tickets: [
      { code: "BRNO20", validity: "20 minut", price: 20 },
      { code: "BRNO", validity: "75 minut", price: 29 },
      { code: "BRNOD", validity: "24 hodin", price: 99 },
    ],
    area: "Zóny 100 + 101; neplatí ve vlacích.",
    sourceUrl: "https://www.dpmb.cz/jizdenky-v-mobilu",
  },
  {
    id: "plzen",
    city: "Plzeň",
    operator: "PMDP",
    tickets: [
      { code: "PMDP35M", validity: "35 minut", price: 28 },
      { code: "PMDP24H", validity: "24 hodin", price: 99 },
    ],
    area: "Vnitřní zóna 001 Plzeň (P).",
    sourceUrl: "https://www.pmdp.cz/jizdne/sms-jizdenka/",
  },
  {
    id: "olomouc",
    city: "Olomouc",
    operator: "DPMO",
    tickets: [{ code: "DPMO", validity: "50 minut v pracovní dny, 70 minut v ostatní dny", price: 27 }],
    area: "MHD Olomouc.",
    sourceUrl: "https://www.dpmo.cz/informace-pro-cestujici/sms-jizdenka/",
  },
  {
    id: "ceske-budejovice",
    city: "České Budějovice",
    operator: "DPMČB",
    tickets: [
      { code: "BUD30", validity: "30 minut", price: 20 },
      { code: "BUD", validity: "60 minut", price: 30 },
      { code: "BUD24", validity: "24 hodin", price: 115 },
    ],
    area: "MHD České Budějovice.",
    sourceUrl: "https://www.dpmcb.cz/cestovani-mhd/koupit-jizdenky/sms-jizdenka.html",
  },
  {
    id: "pardubice",
    city: "Pardubice",
    operator: "DPMP",
    tickets: [
      { code: "DPMP", validity: "45 minut v pracovní dny, 60 minut o víkendu a svátcích", price: 40 },
      { code: "DPMP24", validity: "24 hodin", price: 65 },
    ],
    area: "Přestupní, zóna I + II.",
    sourceUrl: "https://www.dpmp.cz/cestovani-mhd/koupit-jizdenky/sms-jizdenka.html",
  },
  {
    id: "usti-nad-labem",
    city: "Ústí nad Labem",
    operator: "DPmÚL",
    tickets: [
      { code: "MDJ", validity: "60 minut", price: 26, note: "Plné jízdné." },
      { code: "MDJ106", validity: "1 den (do 4:00 následujícího dne)", price: 106, note: "Plné jízdné." },
      { code: "MDJZD", validity: "1 den (do 4:00 následujícího dne)", price: 53, note: "Zvýhodněné jízdné 50 %: děti a mládež 6–18 let, prezenční studenti 18–26 let, osoby od 65 let." },
      { code: "MDJ60", validity: "1 den (do 4:00 následujícího dne)", price: 60, note: "Ústecké jízdné: osoby od 62 do 65 let a osoby přepravující dítě do 3 let." },
    ],
    area: "Jen zóna 101; neplatí u železničních dopravců.",
    sourceUrl: "https://dpmul.cz/cestovani-mhd/koupit-jizdenku/sms",
  },
  {
    id: "liberec",
    city: "Liberec",
    operator: "DPMLJ",
    tickets: [
      { code: "LIB", validity: "60 minut", price: 38, note: "Lze poslat i LIB38." },
      { code: "LIB45", validity: "90 minut", price: 45, note: "Včetně linky 11 Liberec – Jablonec nad Nisou." },
    ],
    area: "Tarifní zóna Liberec a linky MHD Liberec; LIB45 i linka 11 do Jablonce.",
    sourceUrl: "https://www.dpmlj.cz/mhd-liberec/informace/sms-jizdenka",
  },
];

export type ParkingSmsService = {
  id: string;
  name: string;
  description: string;
  /** Tvar SMS podle provozovatele — jen pro ilustraci, konkrétní kód zóny/areálu se řídí místními pokyny. */
  format: string;
  example: string;
  sourceUrl: string;
  sourceLabel: string;
  extraLink?: { label: string; url: string };
};

export const PARKING_SMS_SERVICES: readonly ParkingSmsService[] = [
  {
    id: "pardubice",
    name: "Pardubice – krátkodobé parkování",
    description: `Parkovné v pardubických zónách zaplatíte SMS na ${SMS_NUMBER} (potřebujete povolené Premium SMS). Kód oblasti najdete na místě nebo v seznamu zón. Po odeslání počkejte na potvrzující SMS s platností parkování.`,
    format: "PU <kód oblasti> <RZ> <doba parkování v minutách>",
    example: "PU 01 1E12345 30",
    sourceUrl: "https://www.dpmp.cz/dalsi-sluzby/parkovani-v-pardubicich/kratkodobe-parkovani/sms-parkovne.html",
    sourceLabel: "Postup SMS parkovného (DPMP)",
    extraLink: {
      label: "Seznam SMS kódů oblastí (PDF)",
      url: "https://www.dpmp.cz/galerie/tinymce/parkovani/sms_kody_oblasti_v_jednotlivych_lokalitach_2510_02.pdf",
    },
  },
  {
    id: "sms-tir-parking",
    name: "SMS TIR Parking – nákladní vozidla",
    description: `Parkování nákladních vozidel ve vybraných areálech SMS TIR Parking se platí SMS na ${SMS_NUMBER}. Číslo areálu je uvedené na místě. Po odeslání počkejte na potvrzující SMS a uschovejte si ji pro kontrolu; další čas dokoupíte další SMS.`,
    format: "BUSCOM <číslo areálu> <RZ>",
    example: "BUSCOM 2 4A6 1837",
    sourceUrl: "https://www.smstirparking.cz/cz/jak-to-funguje/",
    sourceLabel: "Jak to funguje (SMS TIR Parking)",
  },
];

/** Praha SMS parkovné na 90206 neuvádí — oficiální možnosti platby podle lokality. */
export const PRAGUE_PARKING_PAYMENT_URL = "https://parking.praha.eu/cs/platba-za-parkovani/";

export const DPP_SMS_SOURCE_URL = "https://www.dpp.cz/jizdne/sms-jizdenka";

/** Duplikát pražské SMS jízdenky — JINÉ číslo než objednávka (podle DPP). */
export const PRAGUE_DUPLICATE = { code: "DPTA", number: "9000603", price: 3 } as const;
