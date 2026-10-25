import type { Locale } from "../i18n/types.ts";
import type { TicketDurationId } from "./tariff.ts";

/** Cena s pevnou mezerou, aby se měna nikdy neodtrhla od čísla (např. v tlačítku). */
export function formatPrice(value: number, locale: Locale): string {
  return locale === "en" || locale === "de" ? `CZK\u00a0${value}` : `${value}\u00a0Kč`;
}

export const DURATION_LABEL: Record<Locale, Record<TicketDurationId, string>> = {
  cs: { "30min": "30 minut", "90min": "90 minut", "24h": "24 hodin", "72h": "72 hodin" },
  en: { "30min": "30 minutes", "90min": "90 minutes", "24h": "24 hours", "72h": "72 hours" },
  de: { "30min": "30 Minuten", "90min": "90 Minuten", "24h": "24 Stunden", "72h": "72 Stunden" },
  uk: { "30min": "30 хвилин", "90min": "90 хвилин", "24h": "24 години", "72h": "72 години" },
};


/**
 * Texty SMS komponenty (components/tickets/SmsTicketPicker.tsx) — zvlášť
 * od lib/tickets/content.ts, protože jdou do klientského bundlu.
 */
export type SmsPickerText = {
  legend: string;
  sendAs: [before: string, middle: string, after: string];
  confirmation: (duration: string, number: string) => string;
  prepare: (price: string) => string;
  copy: (code: string) => string;
  copied: string;
  copyFailed: (code: string) => string;
  explain: (number: string, code: string) => string;
  desktop: [before: string, middle: string, after: string];
  unverified: string;
  warning: string;
};

export const SMS_PICKER_TEXT: Record<Locale, SmsPickerText> = {
  cs: {
    legend: "Jak dlouho potřebujete jezdit?",
    sendAs: ["Pošlete SMS ve tvaru ", " na číslo ", "."],
    confirmation: (duration, number) =>
      `U jízdenky na ${duration} DPP navíc vyžaduje potvrzující SMS „Ano“ na ${number}. Ta je zpoplatněna podle ceníku vašeho operátora.`,
    prepare: (price) => `Připravit SMS – ${price}`,
    copy: (code) => `Kopírovat ${code}`,
    copied: "Zkopírováno",
    copyFailed: (code) => `Kopírování se nepovedlo — text ${code} prosím opište.`,
    explain: (number, code) =>
      `Tlačítko jen otevře zprávu v SMS aplikaci s číslem ${number} a textem ${code}. Nic se neodešle samo — zprávu odešlete vy. Pokud se text nepředvyplní, napište ho ručně.`,
    desktop: ["Jste na počítači? SMS jízdenku pošlete z mobilu s českým číslem: text ", " na číslo ", "."],
    unverified: "Tuto variantu se nepodařilo ověřit u DPP, proto ji nenabízíme k přípravě. Aktuální podmínky najdete na dpp.cz.",
    warning:
      "Jízdenka platí až po doručení potvrzující SMS s jízdenkou. Samotné otevření nebo odeslání objednávkové SMS nestačí. Do placeného prostoru metra vstupujte až s platnou jízdenkou.",
  },
  en: {
    legend: "How long do you need to travel?",
    sendAs: ["Send an SMS with the text ", " to ", "."],
    confirmation: (duration, number) =>
      `For a ${duration} ticket DPP also requires a confirmation SMS "Ano" (yes) to ${number}. It is charged according to your operator's price list.`,
    prepare: (price) => `Prepare SMS – ${price}`,
    copy: (code) => `Copy ${code}`,
    copied: "Copied",
    copyFailed: (code) => `Copying failed — please type ${code} yourself.`,
    explain: (number, code) =>
      `The button only opens a message in your SMS app to ${number} with the text ${code}. Nothing is sent automatically — you send it. If the text isn't pre-filled, type it in.`,
    desktop: ["On a computer? Send the SMS from a phone with a Czech number: text ", " to ", "."],
    unverified: "We couldn't verify this option with DPP, so we don't offer it here. See dpp.cz for current conditions.",
    warning:
      "The ticket is valid only once you receive the SMS with the ticket. Opening or sending the order SMS is not enough. Enter the metro's paid area only with a valid ticket.",
  },
  de: {
    legend: "Wie lange möchten Sie fahren?",
    sendAs: ["Senden Sie eine SMS mit dem Text ", " an ", "."],
    confirmation: (duration, number) =>
      `Für eine Fahrkarte für ${duration} verlangt DPP zusätzlich eine Bestätigungs-SMS „Ano“ (ja) an ${number}. Sie kostet nach Tarif Ihres Anbieters.`,
    prepare: (price) => `SMS vorbereiten – ${price}`,
    copy: (code) => `${code} kopieren`,
    copied: "Kopiert",
    copyFailed: (code) => `Kopieren fehlgeschlagen — bitte tippen Sie ${code} selbst ein.`,
    explain: (number, code) =>
      `Die Schaltfläche öffnet nur eine Nachricht in Ihrer SMS-App an ${number} mit dem Text ${code}. Es wird nichts automatisch gesendet — Sie senden selbst. Falls der Text nicht vorausgefüllt ist, tippen Sie ihn ein.`,
    desktop: ["Am Computer? Senden Sie die SMS von einem Handy mit tschechischer Nummer: Text ", " an ", "."],
    unverified: "Diese Variante konnten wir bei DPP nicht prüfen, daher bieten wir sie hier nicht an. Aktuelle Bedingungen auf dpp.cz.",
    warning:
      "Die Fahrkarte gilt erst, wenn Sie die SMS mit dem Ticket erhalten haben. Das Öffnen oder Absenden der Bestell-SMS reicht nicht. Betreten Sie den kontrollierten Bereich der Metro nur mit gültiger Fahrkarte.",
  },
  uk: {
    legend: "Як довго вам потрібно їздити?",
    sendAs: ["Надішліть SMS з текстом ", " на номер ", "."],
    confirmation: (duration, number) =>
      `Для квитка на ${duration} DPP додатково вимагає підтвердження SMS «Ano» (так) на ${number}. Воно платне за тарифом вашого оператора.`,
    prepare: (price) => `Підготувати SMS – ${price}`,
    copy: (code) => `Копіювати ${code}`,
    copied: "Скопійовано",
    copyFailed: (code) => `Не вдалося скопіювати — введіть ${code} вручну.`,
    explain: (number, code) =>
      `Кнопка лише відкриє повідомлення в SMS-застосунку на номер ${number} з текстом ${code}. Нічого не надсилається автоматично — надсилаєте ви. Якщо текст не заповнився, введіть його вручну.`,
    desktop: ["Ви за комп'ютером? Надішліть SMS з телефона з чеським номером: текст ", " на номер ", "."],
    unverified: "Цей варіант не вдалося перевірити в DPP, тому ми його тут не пропонуємо. Актуальні умови — на dpp.cz.",
    warning:
      "Квиток діє лише після отримання SMS з квитком. Самого відкриття чи надсилання SMS із замовленням недостатньо. Входьте в платну зону метро лише з дійсним квитком.",
  },
};
