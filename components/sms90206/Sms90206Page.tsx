import Link from "next/link";
import { ArrowRight, Building2, CircleHelp, ExternalLink, LocateFixed, MessageSquareText, ParkingSquare, TriangleAlert } from "lucide-react";
import { formatTicketDate } from "../../lib/tickets/content.ts";
import { DURATION_LABEL, formatPrice } from "../../lib/tickets/picker-text.ts";
import { SMS_NUMBER, SMS_OPTIONS, TICKETS_PATH } from "../../lib/tickets/tariff.ts";
import {
  CITY_SMS_SERVICES,
  DPP_SMS_SOURCE_URL,
  PARKING_SMS_SERVICES,
  PRAGUE_PARKING_PAYMENT_URL,
  SMS_90206_VERIFIED_AT,
} from "../../lib/sms90206/services.ts";
import { SMS_90206_TEXT } from "../../lib/sms90206/content.ts";
import I18nProvider from "../i18n/I18nProvider.tsx";
import AppFooter from "../AppFooter.tsx";
import StationHeader from "../stations/StationHeader.tsx";
import SmsTicketPicker from "../tickets/SmsTicketPicker.tsx";

const CARD = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6";
const H2 = "flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl";
const PARAGRAPH = "mt-2 max-w-prose text-sm leading-relaxed text-gray-700 sm:text-base";
const LIST = "mt-2 flex max-w-prose list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base";
const INLINE_LINK = "font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900";
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;
const TH = "py-2 pr-3 text-left font-semibold";
const TD = "py-2.5 pr-3 align-top";

/**
 * /90206 — co se dá koupit přes krátké číslo 90206 (Praha, další města,
 * parkovné). Serverově vykreslené: veškerý obsah je v HTML i bez JS,
 * klientská je jen pražská SMS komponenta (stejná jako na /jizdenky-praha).
 * Jen česky.
 */
export default function Sms90206Page() {
  const t = SMS_90206_TEXT;
  const verifiedDate = formatTicketDate(SMS_90206_VERIFIED_AT, "cs");

  return (
    <I18nProvider locale="cs">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <StationHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-3">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-600 sm:text-sm">
            <Link href="/" className="underline underline-offset-2 hover:text-gray-900">
              KdeJeMetro.cz
            </Link>
            <span aria-hidden="true"> › </span>
            <span aria-current="page">{t.breadcrumb}</span>
          </nav>

          <section className={CARD}>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{t.seo.h1}</h1>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-gray-800">{t.intro}</p>
            <nav aria-label="Části stránky" className="mt-4">
              <ul className="flex flex-wrap gap-2">
                {t.toc.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-navy-900 hover:border-navy-700 hover:bg-gray-50 sm:text-base"
                    >
                      {item.label}
                      <ArrowRight aria-hidden="true" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-3 text-xs text-gray-600">{t.verifiedNote(verifiedDate)}</p>
          </section>

          <section id="praha" aria-labelledby="praha-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="praha-heading" className={H2}>
              <MessageSquareText aria-hidden="true" size={22} className="text-navy-700" />
              {t.prague.heading}
            </h2>
            <p className={PARAGRAPH}>{t.prague.intro}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[300px] border-collapse text-sm sm:text-base">
                <caption className="pb-2 text-left text-xs text-gray-600 sm:text-sm">{t.prague.caption}</caption>
                <thead>
                  <tr className="border-b-2 border-gray-200 text-xs text-gray-600 sm:text-sm">
                    <th scope="col" className={TH}>Text SMS</th>
                    <th scope="col" className={TH}>Příjemce</th>
                    <th scope="col" className={TH}>Platnost</th>
                    <th scope="col" className="py-2 text-right font-semibold">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {SMS_OPTIONS.map((option) => (
                    <tr key={option.id} className="border-b border-gray-100">
                      <th scope="row" className={`${TD} text-left font-mono text-base font-bold text-gray-900`}>
                        {option.code}
                      </th>
                      <td className={`${TD} whitespace-nowrap font-mono text-gray-900`}>{SMS_NUMBER}</td>
                      <td className={`${TD} text-gray-800`}>
                        {DURATION_LABEL.cs[option.id]}
                        {option.needsConfirmation && <span className="block text-xs text-gray-600">{t.prague.confirmShort}</span>}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right align-top font-bold text-navy-900">{formatPrice(option.price, "cs")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-5 text-base font-bold text-gray-900">{t.prague.prepareHeading}</h3>
            <div className="mt-2">
              <SmsTicketPicker locale="cs" />
            </div>

            <h3 className="mt-5 text-base font-bold text-gray-900">{t.prague.knowHeading}</h3>
            <ul className={LIST}>
              {t.prague.know.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={PARAGRAPH}>
              {t.prague.notArrived[0]}
              <a href={`${TICKETS_PATH}#bez-aplikace`} className={INLINE_LINK}>
                {t.prague.notArrived[1]}
              </a>
              {t.prague.notArrived[2]}
            </p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm sm:text-base">
              <a href={TICKETS_PATH} className={`${INLINE_LINK} inline-flex items-center gap-1`}>
                {t.prague.allOptionsLink}
                <ArrowRight aria-hidden="true" size={16} />
              </a>
              <a href={DPP_SMS_SOURCE_URL} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                {t.prague.sourceLabel}
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            </p>
          </section>

          <section id="dalsi-mesta" aria-labelledby="dalsi-mesta-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="dalsi-mesta-heading" className={H2}>
              <Building2 aria-hidden="true" size={22} className="text-navy-700" />
              {t.cities.heading}
            </h2>
            <p className={PARAGRAPH}>{t.cities.intro}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <caption className="pb-2 text-left text-xs text-gray-600 sm:text-sm">{t.cities.caption(verifiedDate)}</caption>
                <thead>
                  <tr className="border-b-2 border-gray-200 text-xs text-gray-600 sm:text-sm">
                    <th scope="col" className={TH}>Město</th>
                    <th scope="col" className={TH}>SMS kód</th>
                    <th scope="col" className={TH}>Platnost</th>
                    <th scope="col" className={TH}>Cena</th>
                    <th scope="col" className="py-2 text-left font-semibold">Zdroj</th>
                  </tr>
                </thead>
                {CITY_SMS_SERVICES.map((service) => (
                  <tbody key={service.id} id={`mesto-${service.id}`} className="border-b-2 border-gray-200">
                    {service.tickets.map((ticket, index) => (
                      <tr key={ticket.code} className="border-b border-gray-100 last:border-b-0">
                        {index === 0 && (
                          <th scope="rowgroup" rowSpan={service.tickets.length} className={`${TD} text-left font-bold text-gray-900`}>
                            {service.city}
                            <span className="block text-xs font-normal text-gray-600">{service.area}</span>
                          </th>
                        )}
                        <td className={`${TD} whitespace-nowrap font-mono font-bold text-gray-900`}>{ticket.code}</td>
                        <td className={`${TD} text-gray-800`}>
                          {ticket.validity}
                          {ticket.note && <span className="block text-xs text-gray-600">{ticket.note}</span>}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-gray-900`}>{formatPrice(ticket.price, "cs")}</td>
                        {index === 0 && (
                          <td rowSpan={service.tickets.length} className="py-2.5 align-top">
                            <a href={service.sourceUrl} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                              {service.operator}
                              <ExternalLink aria-hidden="true" size={13} />
                            </a>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
            <ul className={LIST}>
              {t.cities.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section id="parkovne" aria-labelledby="parkovne-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="parkovne-heading" className={H2}>
              <ParkingSquare aria-hidden="true" size={22} className="text-navy-700" />
              {t.parking.heading}
            </h2>
            <p className={PARAGRAPH}>{t.parking.intro}</p>
            <div className="mt-4 flex flex-col gap-3">
              {PARKING_SMS_SERVICES.map((service) => (
                <article key={service.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                  <h3 className="text-base font-bold text-gray-900">{service.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700 sm:text-base">{service.description}</p>
                  <p className="mt-2 text-sm text-gray-800">
                    {t.parking.formatLabel} <code className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-900">{service.format}</code>
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {t.parking.exampleLabel} <code className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-900">{service.example}</code> {t.parking.toNumber}{" "}
                    <strong className="font-mono">{SMS_NUMBER}</strong>
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <a href={service.sourceUrl} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                      {service.sourceLabel}
                      <ExternalLink aria-hidden="true" size={13} />
                    </a>
                    {service.extraLink && (
                      <a href={service.extraLink.url} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                        {service.extraLink.label}
                        <ExternalLink aria-hidden="true" size={13} />
                      </a>
                    )}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-4 flex max-w-prose items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 sm:text-base">
              <TriangleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-navy-700" />
              <span>{t.parking.warning}</span>
            </p>
            <p className={PARAGRAPH}>
              {t.parking.prague[0]}
              <a href={PRAGUE_PARKING_PAYMENT_URL} {...EXTERNAL} className={INLINE_LINK}>
                {t.parking.prague[1]}
              </a>
              {t.parking.prague[2]}
            </p>
            <p className={PARAGRAPH}>{t.parking.otherServices}</p>
          </section>

          <section id="otazky" aria-labelledby="otazky-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="otazky-heading" className={H2}>
              <CircleHelp aria-hidden="true" size={22} className="text-navy-700" />
              Časté otázky
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-gray-100">
              {t.faq.map((item) => (
                <details key={item.question} className="group py-1">
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 text-base font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base font-semibold">{item.question}</h3>
                    <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-navy-700 transition group-open:rotate-90" />
                  </summary>
                  <p className="max-w-prose pb-3 text-sm leading-relaxed text-gray-700 sm:text-base">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="zdroje" aria-labelledby="zdroje-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="zdroje-heading" className="text-base font-bold text-gray-900 sm:text-lg">
              Zdroje
            </h2>
            <p className="mt-1 text-sm text-gray-600">{t.sourcesNote(verifiedDate)}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              <li>
                <a href={DPP_SMS_SOURCE_URL} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                  DPP: SMS jízdenka (Praha)
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              </li>
              {CITY_SMS_SERVICES.map((service) => (
                <li key={service.id}>
                  <a href={service.sourceUrl} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                    {service.operator}: SMS jízdenka ({service.city})
                    <ExternalLink aria-hidden="true" size={13} />
                  </a>
                </li>
              ))}
              {PARKING_SMS_SERVICES.map((service) => (
                <li key={service.id}>
                  <a href={service.sourceUrl} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                    {service.sourceLabel}
                    <ExternalLink aria-hidden="true" size={13} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-600">{t.disclaimer}</p>
          </section>
        </main>
        <AppFooter bottomLink={{ href: "/", label: "Najít nejbližší metro", icon: <LocateFixed aria-hidden="true" size={14} strokeWidth={2.25} /> }} />
      </div>
    </I18nProvider>
  );
}

