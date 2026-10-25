"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageSquareText, Monitor, TriangleAlert } from "lucide-react";
import { emitTicketEvent } from "../../lib/tickets/events.ts";
import { buildSmsHref, detectSmsPlatform, formatCzk, SMS_NUMBER, SMS_NUMBER_DISPLAY, SMS_OPTIONS, type SmsPlatform, type TicketDurationId } from "../../lib/tickets/tariff.ts";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Starší prohlížeče / nezabezpečený kontext — klasický fallback.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * "Připravit SMS jízdenku" — jen otevře SMS aplikaci s předvyplněným
 * příjemcem a textem (`sms:` URI). Nic neodesílá ani neúčtuje; zprávu
 * musí uživatel odeslat sám. Formát URI se liší pro iOS a Android (viz
 * lib/tickets/tariff.ts) — server vykreslí Android variantu, po načtení
 * se na iOS přepne. Číslo a text jsou vždy vidět i pro ruční odeslání.
 */
export default function SmsTicketPicker() {
  const [selectedId, setSelectedId] = useState<TicketDurationId>("30min");
  const [platform, setPlatform] = useState<SmsPlatform>("other");
  const [isDesktop, setIsDesktop] = useState(false);
  const [copied, setCopied] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    const detected = detectSmsPlatform(navigator.userAgent, navigator.maxTouchPoints);
    setPlatform(detected);
    // Mobil = iOS/iPadOS nebo UA s Android/Mobile; jinak počítač bez SMS.
    setIsDesktop(detected !== "ios" && !/Android|Mobile/i.test(navigator.userAgent));
  }, []);

  const selected = SMS_OPTIONS.find((option) => option.id === selectedId) ?? SMS_OPTIONS[0];
  const href = selected.verified ? buildSmsHref(selected.code, platform) : null;

  function select(id: TicketDurationId) {
    setSelectedId(id);
    setCopied(null);
    const option = SMS_OPTIONS.find((o) => o.id === id);
    if (option) emitTicketEvent({ type: "ticket_sms_option_select", ticket_duration: option.id, ticket_price: option.price });
  }

  async function onCopy() {
    const ok = await copyText(selected.code);
    setCopied(ok ? "ok" : "error");
    emitTicketEvent({ type: "ticket_sms_copy_click", ticket_duration: selected.id, ticket_price: selected.price });
  }

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-semibold text-gray-900">Jak dlouho potřebujete jezdit?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SMS_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`relative flex min-h-[64px] cursor-pointer flex-col justify-center rounded-xl border-2 px-3 py-2 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-900 has-[:focus-visible]:ring-offset-2 ${
                option.id === selectedId ? "border-navy-900 bg-navy-50" : "border-gray-200 bg-white hover:border-gray-400"
              } ${option.verified ? "" : "cursor-not-allowed opacity-60"}`}
            >
              <input
                type="radio"
                name="sms-ticket"
                value={option.id}
                checked={option.id === selectedId}
                disabled={!option.verified}
                onChange={() => select(option.id)}
                className="sr-only"
              />
              <span className="text-base font-bold text-gray-900">{option.label}</span>
              <span className="text-sm text-gray-700">{formatCzk(option.price)}</span>
              {option.id === selectedId && <Check aria-hidden="true" size={18} strokeWidth={3} className="absolute right-2 top-2 text-navy-900" />}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
        <p className="text-sm text-gray-800">
          Pošlete SMS ve tvaru <strong className="font-mono text-base text-gray-900">{selected.code}</strong> na číslo{" "}
          <strong className="whitespace-nowrap font-mono text-base text-gray-900">{SMS_NUMBER_DISPLAY}</strong>.
        </p>
        {selected.needsConfirmation && (
          <p className="mt-1 text-sm text-gray-700">
            U jízdenky na {selected.label} DPP navíc vyžaduje potvrzující SMS „Ano“ na {SMS_NUMBER_DISPLAY}. Ta je zpoplatněna podle ceníku vašeho operátora.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {href ? (
            <a
              href={href}
              onClick={() => emitTicketEvent({ type: "ticket_sms_prepare_click", ticket_duration: selected.id, ticket_price: selected.price })}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-center text-base font-bold text-white shadow-sm hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2"
            >
              <MessageSquareText aria-hidden="true" size={20} />
              Připravit SMS – {formatCzk(selected.price)}
            </a>
          ) : (
            <p className="flex-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Tuto variantu se nepodařilo ověřit u DPP, proto ji nenabízíme k přípravě. Aktuální podmínky najdete na dpp.cz.
            </p>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2"
          >
            {copied === "ok" ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
            {copied === "ok" ? "Zkopírováno" : `Kopírovat ${selected.code}`}
          </button>
        </div>
        <p aria-live="polite" className="mt-1 min-h-[1.25rem] text-xs text-gray-600">
          {copied === "error" ? `Kopírování se nepovedlo — text ${selected.code} prosím opište.` : ""}
        </p>

        <p className="text-xs text-gray-600">
          Tlačítko jen otevře zprávu v SMS aplikaci s číslem {SMS_NUMBER} a textem {selected.code}. Nic se neodešle samo — zprávu odešlete vy. Pokud se
          text nepředvyplní, napište ho ručně.
        </p>
        {isDesktop && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-800">
            <Monitor aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            <span>
              Jste na počítači? SMS jízdenku pošlete z mobilu s českým číslem: text <strong className="font-mono">{selected.code}</strong> na číslo{" "}
              <strong className="font-mono">{SMS_NUMBER_DISPLAY}</strong>.
            </span>
          </p>
        )}
      </div>

      <p role="note" className="mt-4 flex items-start gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 text-sm font-semibold text-amber-950 sm:text-base">
        <TriangleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
        <span>
          Jízdenka platí až po doručení potvrzující SMS s jízdenkou. Samotné otevření nebo odeslání objednávkové SMS nestačí. Do placeného prostoru metra
          vstupujte až s platnou jízdenkou.
        </span>
      </p>
    </div>
  );
}
