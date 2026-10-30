import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeInfo, CircleHelp, CreditCard, ExternalLink, LocateFixed, MessageSquareText, Smartphone, Ticket, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "../../lib/i18n/types.ts";
import { localeToRoute } from "../../lib/i18n/types.ts";
import { formatPrice, formatTicketDate, getTicketsText, TICKET_MACHINE_PHOTO, TICKET_MACHINE_PHOTO_TEXT, type Rich } from "../../lib/tickets/content.ts";
import { DURATION_LABEL } from "../../lib/tickets/picker-text.ts";
import { PID_LITACKA_APP_URL, PRAGUE_PRICES, TARIFF_VERIFIED_AT, TICKET_SOURCES } from "../../lib/tickets/tariff.ts";
import I18nProvider from "../i18n/I18nProvider.tsx";
import AppFooter from "../AppFooter.tsx";
import SmsTicketPicker from "./SmsTicketPicker.tsx";
import TicketAnalytics from "./TicketAnalytics.tsx";
import TicketsHeader from "./TicketsHeader.tsx";

const CARD = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6";
const H2 = "flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl";
const PARAGRAPH = "mt-2 max-w-prose text-sm leading-relaxed text-gray-700 sm:text-base";
const LIST = "mt-2 flex max-w-prose list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base";
const INLINE_LINK = "font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900";
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

const PRICE_30 = PRAGUE_PRICES[0];

/** Foto automatů z Wikimedia Commons s povinným uvedením autora a licence (CC BY-SA 4.0). */
function TicketMachinePhoto({ locale }: { locale: Locale }) {
  const photo = TICKET_MACHINE_PHOTO;
  const text = TICKET_MACHINE_PHOTO_TEXT[locale];
  return (
    <figure className="mx-auto mt-4 w-full max-w-[220px] shrink-0 sm:mt-2 sm:w-[200px]">
      <Image
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={text.alt}
        sizes="220px"
        unoptimized
        loading="lazy"
        className="h-auto w-full rounded-xl border border-gray-200"
      />
      <figcaption className="mt-1.5 text-xs leading-snug text-gray-600">
        {text.caption}{" "}
        {text.credit}:{" "}
        <a href={photo.sourceUrl} className="underline underline-offset-2 hover:text-gray-900" {...EXTERNAL}>
          {photo.author}
        </a>
        ,{" "}
        <a href={photo.licenseUrl} className="underline underline-offset-2 hover:text-gray-900" {...EXTERNAL}>
          {photo.license}
        </a>
        , Wikimedia Commons
      </figcaption>
    </figure>
  );
}

/** Text s odkazy (lib/tickets/content.ts `Rich`). Interní odkazy mimo kotvy na stránce = jiná stránka webu. */
function RichText({ value }: { value: Rich }) {
  return (
    <>
      {value.map((segment, index) =>
        typeof segment === "string" ? (
          segment
        ) : (
          <a key={index} href={segment.href} className={INLINE_LINK} {...(segment.external ? EXTERNAL : {})}>
            {segment.text}
          </a>
        )
      )}
    </>
  );
}

function QuickChoice({ href, icon, title, price, text }: { href: string; icon: ReactNode; title: string; price: string; text: string }) {
  return (
    <a href={href} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-navy-700 sm:p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="text-base font-bold text-gray-900">{title}</span>
          <span className="text-sm font-semibold text-navy-900">{price}</span>
        </span>
        <span className="block text-sm text-gray-600">{text}</span>
      </span>
      <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-navy-700" />
    </a>
  );
}

export default function TicketsPage({ locale }: { locale: Locale }) {
  const t = getTicketsText(locale);
  const price = (value: number) => formatPrice(value, locale);
  const verifiedDate = formatTicketDate(TARIFF_VERIFIED_AT, locale);
  const home = localeToRoute[locale];

  return (
    <I18nProvider locale={locale}>
      <TicketAnalytics />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <TicketsHeader findMetroAria={t.header.findMetroAria} />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-3">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-600 sm:text-sm">
            <Link href={home} className="underline underline-offset-2 hover:text-gray-900">
              KdeJeMetro.cz
            </Link>
            <span aria-hidden="true"> › </span>
            <span aria-current="page">{t.breadcrumb}</span>
          </nav>

          <section className={CARD}>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{t.seo.h1}</h1>
            <p className="mt-2 text-base text-gray-800">{t.intro}</p>
            <div className="mt-4 flex flex-col gap-2">
              <QuickChoice href="#litacka" icon={<Smartphone aria-hidden="true" size={20} />} title={t.quick.app.title} price={t.quick.from(price(PRICE_30.app))} text={t.quick.app.text} />
              <QuickChoice href="#sms" icon={<MessageSquareText aria-hidden="true" size={20} />} title={t.quick.sms.title} price={t.quick.from(price(PRICE_30.sms))} text={t.quick.sms.text} />
              <QuickChoice
                href="#bez-aplikace"
                icon={<CreditCard aria-hidden="true" size={20} />}
                title={t.quick.machine.title}
                price={t.quick.from(price(PRICE_30.paper))}
                text={t.quick.machine.text}
              />
            </div>
            <p className="mt-3 text-xs text-gray-600">{t.verifiedNote(verifiedDate)}</p>
          </section>

          <section id="sms" aria-labelledby="sms-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="sms-heading" className={H2}>
              <MessageSquareText aria-hidden="true" size={22} className="text-navy-700" />
              {t.sms.heading}
            </h2>
            <p className={PARAGRAPH}>{t.sms.intro}</p>
            <div className="mt-4">
              <SmsTicketPicker locale={locale} />
            </div>
            <h3 className="mt-5 text-base font-bold text-gray-900">{t.sms.knowHeading}</h3>
            <ul className={LIST}>
              {t.sms.know.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="ceny" aria-labelledby="ceny-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="ceny-heading" className={H2}>
              <Ticket aria-hidden="true" size={22} className="text-navy-700" />
              {t.prices.heading}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[300px] border-collapse text-left text-sm sm:text-base">
                <caption className="pb-2 text-left text-xs text-gray-600 sm:text-sm">{t.prices.caption}</caption>
                <thead>
                  <tr className="border-b-2 border-gray-200 text-xs text-gray-600 sm:text-sm">
                    <th scope="col" className="py-2 pr-2 font-semibold">
                      {t.prices.columns.duration}
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      {t.prices.columns.app}
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      {t.prices.columns.paper}
                    </th>
                    <th scope="col" className="py-2 pl-2 text-right font-semibold">
                      {t.prices.columns.sms}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRAGUE_PRICES.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">
                      <th scope="row" className="py-2.5 pr-2 font-semibold text-gray-900">
                        {DURATION_LABEL[locale][row.id]}
                      </th>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right font-bold text-navy-900">{price(row.app)}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right text-gray-800">{price(row.paper)}</td>
                      <td className="whitespace-nowrap py-2.5 pl-2 text-right text-gray-800">{price(row.sms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={PARAGRAPH}>{t.prices.note}</p>
            <p className="mt-2 max-w-prose text-xs text-gray-600 sm:text-sm">
              <RichText value={t.prices.discounts} />
            </p>
          </section>

          <section id="litacka" aria-labelledby="litacka-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="litacka-heading" className={H2}>
              <Smartphone aria-hidden="true" size={22} className="text-navy-700" />
              {t.litacka.heading}
            </h2>
            <p className={PARAGRAPH}>{t.litacka.intro}</p>
            <h3 className="mt-4 text-base font-bold text-gray-900">{t.litacka.whenHeading}</h3>
            <ul className={LIST}>
              {t.litacka.when.map((item, index) => (
                <li key={index}>
                  <RichText value={item} />
                </li>
              ))}
            </ul>
            <a
              href={PID_LITACKA_APP_URL}
              {...EXTERNAL}
              data-ticket-app="litacka-section"
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-center text-base font-bold text-white shadow-sm hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2 sm:w-auto"
            >
              {t.litacka.cta}
              <ExternalLink aria-hidden="true" size={18} />
            </a>
            <p className="mt-2 text-xs text-gray-600">{t.litacka.ctaNote}</p>
          </section>

          <section id="bez-aplikace" aria-labelledby="bez-aplikace-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="bez-aplikace-heading" className={H2}>
              <CreditCard aria-hidden="true" size={22} className="text-navy-700" />
              {t.noApp.heading}
            </h2>
            <div className="sm:flex sm:items-start sm:gap-5">
              <ul className={`${LIST} sm:flex-1`}>
                {t.noApp.items.map((item, index) => (
                  <li key={index}>
                    <RichText value={item} />
                  </li>
                ))}
              </ul>
              <TicketMachinePhoto locale={locale} />
            </div>
            <p className="mt-4 flex max-w-prose items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 sm:text-base">
              <BadgeInfo aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-navy-700" />
              <span>
                <RichText value={t.noApp.cardNote} />
              </span>
            </p>
          </section>

          <section id="platnost" aria-labelledby="platnost-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="platnost-heading" className={H2}>
              <TriangleAlert aria-hidden="true" size={22} className="text-navy-700" />
              {t.validity.heading}
            </h2>
            <p className={PARAGRAPH}>
              <RichText value={t.validity.intro} />
            </p>
            <dl className="mt-3 flex max-w-prose flex-col gap-3 text-sm leading-relaxed text-gray-700 sm:text-base">
              {t.validity.items.map((item) => (
                <div key={item.term}>
                  <dt className="font-bold text-gray-900">{item.term}</dt>
                  <dd>{item.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="pid-heading" className={CARD}>
            <h2 id="pid-heading" className={H2}>
              <BadgeInfo aria-hidden="true" size={22} className="text-navy-700" />
              {t.pid.heading}
            </h2>
            <p className={PARAGRAPH}>{t.pid.text}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {t.pid.links.map((link) => (
                <a key={link.href} href={link.href} {...EXTERNAL} className={INLINE_LINK}>
                  {link.text}
                </a>
              ))}
            </p>
          </section>

          <section id="otazky" aria-labelledby="otazky-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="otazky-heading" className={H2}>
              <CircleHelp aria-hidden="true" size={22} className="text-navy-700" />
              {t.faqHeading}
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-gray-100">
              {t.faq.map((item) => (
                <details key={item.question} className="group py-1">
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 text-base font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base font-semibold">{item.question}</h3>
                    <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-navy-700 transition group-open:rotate-90" />
                  </summary>
                  <p className="max-w-prose pb-3 text-sm leading-relaxed text-gray-700 sm:text-base">
                    <RichText value={item.answer} />
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section id="zdroje" aria-labelledby="zdroje-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="zdroje-heading" className="text-base font-bold text-gray-900 sm:text-lg">
              {t.sources.heading}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{t.sources.note(verifiedDate)}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {TICKET_SOURCES.map((source, index) => (
                <li key={source.url}>
                  <a href={source.url} {...EXTERNAL} hrefLang="cs" className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                    {source.provider}: {t.sources.labels[index]}
                    <ExternalLink aria-hidden="true" size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="flex items-start gap-1.5 text-sm text-gray-600">
            <LocateFixed aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            <span>
              <RichText value={t.footer.haveTicket} />
            </span>
          </p>
        </main>
        <AppFooter bottomLink={{ href: home, label: t.footer.findMetro, icon: <LocateFixed aria-hidden="true" size={14} strokeWidth={2.25} /> }} />
      </div>
    </I18nProvider>
  );
}
