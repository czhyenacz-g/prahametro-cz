import { track } from "@vercel/analytics";
import type { TicketDurationId } from "./tariff.ts";

/**
 * Události stránky /jizdenky-praha → Vercel Web Analytics, stejně jako
 * lib/stations/events.ts: plán Pro dovoluje nejvýš 2 vlastnosti na
 * událost. Nikdy telefonní číslo ani nic osobního — jen zvolená varianta
 * jízdenky, cena z našeho ceníku a místo odkazu na stránce. Zobrazení
 * stránky měří `<Analytics />` automaticky (žádný `ticket_page_view`,
 * zbytečně by spotřebovával kvótu událostí).
 */
export type TicketEvent =
  | { type: "ticket_sms_option_select" | "ticket_sms_prepare_click" | "ticket_sms_copy_click"; ticket_duration: TicketDurationId; ticket_price: number }
  | { type: "ticket_pid_app_click"; ticket_method: "pid_litacka"; placement: string };

export function toTicketAnalyticsProperties(event: TicketEvent): Record<string, string | number> {
  if (event.type === "ticket_pid_app_click") return { ticket_method: event.ticket_method, placement: event.placement };
  return { ticket_duration: event.ticket_duration, ticket_price: event.ticket_price };
}

export function emitTicketEvent(event: TicketEvent): void {
  try {
    track(event.type, toTicketAnalyticsProperties(event));
  } catch {
    // Analytika nesmí nikdy rozbít ovládání stránky.
  }
}
