"use client";

import { useEffect } from "react";
import { emitTicketEvent } from "../../lib/tickets/events.ts";

/**
 * Delegovaná analytika odkazů na PID Lítačku (`<a data-ticket-app=…>`),
 * stejný princip jako components/stations/StationAnalytics.tsx — odkazy
 * zůstávají serverově vykreslené. Nic nevykresluje.
 */
export default function TicketAnalytics() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-ticket-app]") : null;
      if (target?.dataset.ticketApp) emitTicketEvent({ type: "ticket_pid_app_click", ticket_method: "pid_litacka", placement: target.dataset.ticketApp });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
