import { SMS_NUMBER, SMS_OPTIONS } from "../tickets/tariff.ts";
import { PRAGUE_DUPLICATE, SMS_90206_PATH } from "./services.ts";

/**
 * Texty stránky /90206 (jen česky). Fakta (kódy, ceny) se berou z
 * lib/tickets/tariff.ts (Praha) a lib/sms90206/services.ts (ostatní) —
 * tady jen jejich znění. Záměrně jiný titulek i úvod než /jizdenky-praha:
 * ta řeší nákup jízdenky v Praze, tahle stránka použití čísla 90206.
 */
const codes = SMS_OPTIONS.map((o) => o.code);
const firstCode = codes[0];
const lastCode = codes[codes.length - 1];

export const SMS_90206_TEXT = {
  seo: {
    title: `${SMS_NUMBER} – SMS jízdenky a parkovné v Česku`,
    description: `Přehled ověřených služeb na čísle ${SMS_NUMBER}. SMS jízdenky pro Prahu, Brno a další města, kódy ${firstCode}–${lastCode} a parkovné v podporovaných lokalitách.`,
    h1: `Co se dá koupit přes SMS na čísle ${SMS_NUMBER}?`,
  },
  breadcrumb: `SMS ${SMS_NUMBER}`,
  path: SMS_90206_PATH,
  intro: `${SMS_NUMBER} je krátké číslo pro objednávky přes SMS. V Praze na něm koupíte jízdenku na MHD. Stejné číslo používají i další dopravci a některé parkovací služby. O tom, co objednáte, rozhoduje text zprávy.`,
  toc: [
    { label: "Praha", href: "#praha" },
    { label: "Další města", href: "#dalsi-mesta" },
    { label: "Parkovné", href: "#parkovne" },
  ],
  verifiedNote: (date: string) => `Ověřené služby na čísle ${SMS_NUMBER} podle provozovatelů, kontrola ${date}. Úplný veřejný seznam všech služeb na tomto čísle neexistuje.`,
  prague: {
    heading: "Praha – SMS jízdenka na MHD",
    intro: `V Praze pošlete SMS na ${SMS_NUMBER} s textem podle délky jízdenky. Jízdenka platí v metru, tramvajích, autobusech i trolejbusech.`,
    caption: "Plnocenné SMS jízdenky DPP pro Prahu (pásma P, 0, B).",
    confirmShort: "Nutné potvrdit SMS „ANO“.",
    prepareHeading: "Připravit SMS",
    knowHeading: "Co je dobré vědět",
    know: [
      `U jízdenky na 24 hodin (${codes[2]}) a 72 hodin (${codes[3]}) přijde výzva k potvrzení — odpovězte „ANO“. Cena potvrzovací SMS se řídí tarifem vašeho operátora.`,
      "Nákup vyžaduje české mobilní číslo a povolené Premium SMS u operátora. Se zahraniční SIM nefunguje.",
      "Jízdenka přijde zpět SMS zprávou obvykle do dvou minut. Počkejte na doručenou platnou jízdenku před vstupem do přepravního prostoru metra nebo nástupem do vozidla — samotné odeslání objednávky nestačí.",
      "Platí jako přestupní v Praze v pásmech P, 0 a B. Neplatí ve vlacích PID, na příměstských linkách ve vnějších pásmech ani na lince AE na letiště.",
      "Tlačítko výše jen otevře SMS aplikaci s návrhem zprávy. Nic se neodesílá samo a web nic neúčtuje.",
    ],
    notArrived: ["Jízdenka nepřišla nebo SMS nemůžete poslat? Kupte si jízdenku ", "v automatu, terminálu nebo v aplikaci PID Lítačka", "."],
    allOptionsLink: "Všechny možnosti nákupu jízdenky v Praze",
    sourceLabel: "Oficiální informace DPP",
  },
  cities: {
    heading: `Ověřené služby na čísle ${SMS_NUMBER} – další města`,
    intro: "SMS jízdenky dalších dopravců. Kód i číslo jsme ověřili přímo u dopravce; každá jízdenka platí jen v síti svého dopravce, ne v Praze.",
    caption: (date: string) => `Plnocenné jízdné, není-li uvedeno jinak. Ceny bez poplatku za odeslání SMS podle tarifu operátora. Kontrola ${date}.`,
    notes: [
      "Všude platí stejné podmínky jako v Praze: české číslo, povolené Premium SMS a jízdenka platí až po doručení.",
      "Před cestou si podmínky ověřte na odkazu u dopravce — tarify se mohou měnit.",
    ],
  },
  parking: {
    heading: "Parkovné a další služby",
    intro: `Parkovné přes ${SMS_NUMBER} funguje jen ve vybraných lokalitách. Tvar SMS (zóna, registrační značka, délka parkování) určuje provozovatel konkrétní zóny — vždy se řiďte pokyny na místě.`,
    formatLabel: "Tvar SMS:",
    exampleLabel: "Příklad:",
    toNumber: "na",
    warning: "Po odeslání počkejte na potvrzující SMS. Parkovné je zaplacené až s ní — dřív auto neopouštějte bez jistoty, že platba prošla.",
    prague: [
      `Praha placení parkovného přes ${SMS_NUMBER} neuvádí. Oficiální možnosti platby podle lokality najdete na `,
      "parking.praha.eu",
      ".",
    ],
    otherServices: `Číslo, na které píšete (${SMS_NUMBER}), se může lišit od čísla, ze kterého přijde potvrzení. Další službu zařadíme, až její provozovatel výslovně uvede ${SMS_NUMBER} jako číslo pro objednávku.`,
  },
  faq: [
    {
      question: `Kolik stojí SMS jízdenka na ${SMS_NUMBER} v Praze?`,
      answer: SMS_OPTIONS.map((o) => `${o.code} = ${o.label} za ${o.price} Kč`).join(", ") + ".",
    },
    {
      question: `Proč mi z ${SMS_NUMBER} nepřišla jízdenka?`,
      answer: "Nejčastěji chybí povolené Premium SMS, nebo píšete ze zahraniční SIM. Zkontrolujte přesný text zprávy (velká písmena, bez mezer) a signál. Jízdenka obvykle přijde do dvou minut; do té doby nevstupujte do metra a kupte si raději jízdenku jinak.",
    },
    {
      question: "Smazal(a) jsem pražskou SMS jízdenku. Jak získám duplikát?",
      answer: `Dokud jízdenka platí, pošlete SMS s textem ${PRAGUE_DUPLICATE.code} na jiné číslo: ${PRAGUE_DUPLICATE.number}. Duplikát stojí ${PRAGUE_DUPLICATE.price} Kč.`,
    },
    {
      question: `Platí jízdenka z ${SMS_NUMBER} v celé republice?`,
      answer: "Ne. Číslo je společné, ale každá jízdenka platí jen v síti dopravce, kterému patří kód ve zprávě (např. DPT42 jen v Praze, BRNO jen v Brně).",
    },
  ],
  sourcesNote: (date: string) => `Údaje jsme ověřili přímo u provozovatelů ${date}. Rozhodují vždy aktuální podmínky provozovatele.`,
  disclaimer: "KdeJeMetro.cz je neoficiální projekt. Jízdenky ani parkovné neprodáváme; tlačítko jen připraví zprávu, kterou odešlete sami.",
} as const;
