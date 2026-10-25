import Link from "next/link";
import { ArrowRight, BadgeInfo, CircleHelp, CreditCard, ExternalLink, LocateFixed, MessageSquareText, Smartphone, Ticket, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { stationGuidePath, STATIONS_PATH } from "../../lib/stations/guides.ts";
import {
  formatCzk,
  PID_LITACKA_APP_URL,
  PRAGUE_PRICES,
  SMS_NUMBER_DISPLAY,
  TARIFF_VERIFIED_AT,
  TARIFF_YEAR,
  TICKET_SOURCES,
  TICKETS_SEO,
} from "../../lib/tickets/tariff.ts";
import I18nProvider from "../i18n/I18nProvider.tsx";
import AppFooter from "../AppFooter.tsx";
import StationHeader from "../stations/StationHeader.tsx";
import SmsTicketPicker from "./SmsTicketPicker.tsx";
import TicketAnalytics from "./TicketAnalytics.tsx";

const CARD = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6";
const H2 = "flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl";
const PARAGRAPH = "mt-2 max-w-prose text-sm leading-relaxed text-gray-700 sm:text-base";
const LIST = "mt-2 flex max-w-prose list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-gray-700 sm:text-base";
const INLINE_LINK = "font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900";
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

const PRICE_30 = PRAGUE_PRICES[0];
const PRICE_90 = PRAGUE_PRICES[1];

function formatCzechDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day}. ${month}. ${year}`;
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

type Faq = { question: string; answer: ReactNode };

const FAQ: Faq[] = [
  {
    question: "Kolik stojí jízdenka na metro v Praze?",
    answer: (
      <>
        Základní jízdenka na 30 minut stojí {formatCzk(PRICE_30.paper)} (papírová), {formatCzk(PRICE_30.app)} v aplikaci PID Lítačka a{" "}
        {formatCzk(PRICE_30.sms)} jako SMS. Jízdenka na 90 minut stojí {formatCzk(PRICE_90.paper)}, {formatCzk(PRICE_90.app)} v aplikaci a{" "}
        {formatCzk(PRICE_90.sms)} jako SMS. Jde o plnocenné jízdné pro dospělé od 15 do 60 let; všechny ceny jsou v <a href="#ceny" className={INLINE_LINK}>tabulce</a>.
      </>
    ),
  },
  {
    question: "Jak koupit SMS jízdenku v Praze?",
    answer: (
      <>
        Z českého telefonního čísla s aktivní službou Premium SMS pošlete text DPT42 (30 minut), DPT55 (90 minut), DPT150 (24 hodin) nebo DPT350 (72 hodin) na
        číslo {SMS_NUMBER_DISPLAY}. Jízdenka přijde zpět SMS zprávou přibližně do dvou minut. U jízdenek na 24 a 72 hodin je potřeba objednávku potvrdit SMS
        „Ano“. Zprávu si můžete <a href="#sms" className={INLINE_LINK}>připravit tady na stránce</a>.
      </>
    ),
  },
  {
    question: "Na jaké číslo poslat SMS jízdenku?",
    answer: <>Na číslo {SMS_NUMBER_DISPLAY} (bez mezery 90206). Text zprávy je DPT a cena jízdenky, například DPT42.</>,
  },
  {
    question: "Platí SMS jízdenka i v metru?",
    answer: (
      <>
        Ano. SMS jízdenka platí jako přestupní v Praze v pásmech P, 0 a B — v metru, tramvajích, autobusech i trolejbusech. Do metra ale smíte vstoupit až s
        již přijatou SMS jízdenkou. Neplatí ve vlacích PID, na příměstských linkách ve vnějších pásmech ani na lince AE na letiště.
      </>
    ),
  },
  {
    question: "Kde koupit jízdenku na metro kartou?",
    answer: (
      <>
        Kartou zaplatíte v dotykových jízdenkových automatech (tlačítkové automaty berou jen mince) a v dotykových samoobslužných terminálech. V tramvajích,
        autobusech a trolejbusech koupíte jízdenku na 30 minut, 90 minut nebo 24 hodin v terminálu jen bezkontaktní platbou. Kartou platíte i v aplikaci PID
        Lítačka. Samotné přiložení karty jízdenku nenahrazuje.
      </>
    ),
  },
  {
    question: "Musím jízdenku označit?",
    answer: (
      <>
        Jen papírovou jízdenku, na které není natištěno datum, čas a pásmo — tedy jízdenku z tlačítkového nebo dotykového automatu, z infocentra nebo z trafiky.
        Označuje se jednou, před vstupem do přepravního prostoru metra nebo hned po nástupu do tramvaje či autobusu. Jízdenky z terminálů, z pokladny Českých
        drah a od řidiče už časové razítko mají; jízdenka v aplikaci a SMS jízdenka se neoznačují.
      </>
    ),
  },
  {
    question: "Kdy začíná platit SMS jízdenka?",
    answer: <>Až ve chvíli, kdy vám přijde SMS s jízdenkou — ne po odeslání objednávky. Do té doby nesmíte vstoupit do metra ani nastoupit do vozidla.</>,
  },
  {
    question: "Mohu jet na jednu jízdenku metrem i tramvají?",
    answer: (
      <>
        Ano. Jízdenky na 30 a 90 minut i na 24 a 72 hodin platí ve všech druzích dopravy PID a během jejich platnosti můžete neomezeně přestupovat. Výjimkou je
        linka AE na letiště; jízdenky na 30 a 90 minut navíc neplatí na lanové dráze na Petřín.
      </>
    ),
  },
  {
    question: "Platí pražská jízdenka také na letiště?",
    answer: (
      <>
        Ano, na autobusy 59 (z{" "}
        <a href={stationGuidePath("nadrazi-veleslavin")} className={INLINE_LINK}>
          Nádraží Veleslavín
        </a>
        ) a 100 (ze{" "}
        <a href={stationGuidePath("zlicin")} className={INLINE_LINK}>
          Zličína
        </a>
        ) platí běžná jízdenka PID; PID doporučuje 90minutovou ({formatCzk(PRICE_90.paper)}, v aplikaci {formatCzk(PRICE_90.app)}, SMS{" "}
        {formatCzk(PRICE_90.sms)}). Na lince AE (Airport Express) platí zvláštní tarif 200 Kč — běžná ani SMS jízdenka tam neplatí.
      </>
    ),
  },
  {
    question: "Funguje SMS jízdenka se zahraniční SIM?",
    answer: <>Ne. SMS jízdenku lze koupit jen z čísla českého mobilního operátora. Se zahraniční SIM použijte aplikaci PID Lítačka nebo automat.</>,
  },
];

export default function TicketsPage() {
  return (
    <I18nProvider locale="cs">
      <TicketAnalytics />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <StationHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-3">
          <nav aria-label="Drobečková navigace" className="text-xs text-gray-600 sm:text-sm">
            <Link href="/" className="underline underline-offset-2 hover:text-gray-900">
              KdeJeMetro.cz
            </Link>
            <span aria-hidden="true"> › </span>
            <span aria-current="page">Jízdenky</span>
          </nav>

          <section className={CARD}>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{TICKETS_SEO.h1}</h1>
            <p className="mt-2 text-base text-gray-800">
              Metrem, tramvají i autobusem jezdíte v Praze na společné jízdenky PID. Koupíte je v aplikaci PID Lítačka, pomocí SMS nebo v automatu. Vyberte si:
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <QuickChoice
                href="#litacka"
                icon={<Smartphone aria-hidden="true" size={20} />}
                title="Aplikace PID Lítačka"
                price={`od ${formatCzk(PRICE_30.app)}`}
                text="Nejlevnější. Platí 1 minutu po nákupu."
              />
              <QuickChoice
                href="#sms"
                icon={<MessageSquareText aria-hidden="true" size={20} />}
                title="SMS jízdenka"
                price={`od ${formatCzk(PRICE_30.sms)}`}
                text="Bez aplikace, jen z českého čísla."
              />
              <QuickChoice
                href="#bez-aplikace"
                icon={<CreditCard aria-hidden="true" size={20} />}
                title="Automat nebo terminál"
                price={`od ${formatCzk(PRICE_30.paper)}`}
                text="Mincemi nebo kartou, papírová jízdenka."
              />
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Plnocenné jízdné pro Prahu, ověřeno podle PID a DPP {formatCzechDate(TARIFF_VERIFIED_AT)}.
            </p>
          </section>

          <section id="sms" aria-labelledby="sms-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="sms-heading" className={H2}>
              <MessageSquareText aria-hidden="true" size={22} className="text-navy-700" />
              Připravit SMS jízdenku
            </h2>
            <p className={PARAGRAPH}>Vyberte platnost a otevřete si předvyplněnou SMS. Odeslání i platba probíhají u vašeho operátora, ne na tomto webu.</p>
            <div className="mt-4">
              <SmsTicketPicker />
            </div>
            <h3 className="mt-5 text-base font-bold text-gray-900">Co je dobré vědět o SMS jízdence</h3>
            <ul className={LIST}>
              <li>Koupíte ji jen z čísla českého operátora; se zahraniční SIM nefunguje.</li>
              <li>Musíte mít u operátora aktivní službu Premium SMS a být v dosahu mobilního signálu.</li>
              <li>Jízdenka přijde přibližně do dvou minut. Platí od chvíle, kdy ji dostanete.</li>
              <li>Platí jako přestupní jen v Praze (pásma P, 0, B). Neplatí ve vlacích PID, na příměstských linkách ve vnějších pásmech ani na lince AE.</li>
              <li>U jízdenek na 24 a 72 hodin je potřeba objednávku potvrdit SMS „Ano“ na {SMS_NUMBER_DISPLAY}, zpoplatněnou podle tarifu operátora.</li>
              <li>Operátor může za vyřízení účtovat další poplatek. PID označuje SMS jako nejméně výhodný způsob nákupu.</li>
              <li>Když jízdenku v době platnosti smažete, duplikát za 3 Kč získáte SMS DPTA na číslo 900 06 03.</li>
            </ul>
          </section>

          <section id="ceny" aria-labelledby="ceny-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="ceny-heading" className={H2}>
              <Ticket aria-hidden="true" size={22} className="text-navy-700" />
              Ceny jízdenek v Praze ({TARIFF_YEAR})
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[300px] border-collapse text-left text-sm sm:text-base">
                <caption className="pb-2 text-left text-xs text-gray-600 sm:text-sm">
                  Plnocenné jízdné pro cestování po Praze (pásma P, 0, B), dospělí od 15 do 60 let.
                </caption>
                <thead>
                  <tr className="border-b-2 border-gray-200 text-xs text-gray-600 sm:text-sm">
                    <th scope="col" className="py-2 pr-2 font-semibold">
                      Platnost
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      PID Lítačka
                    </th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">
                      Papírová
                    </th>
                    <th scope="col" className="py-2 pl-2 text-right font-semibold">
                      SMS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRAGUE_PRICES.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">
                      <th scope="row" className="py-2.5 pr-2 font-semibold text-gray-900">
                        {row.label}
                      </th>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right font-bold text-navy-900">{formatCzk(row.app)}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right text-gray-800">{formatCzk(row.paper)}</td>
                      <td className="whitespace-nowrap py-2.5 pl-2 text-right text-gray-800">{formatCzk(row.sms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={PARAGRAPH}>
              Jízdenka v aplikaci PID Lítačka je vždy nejlevnější. SMS jízdenka je u 30 a 90 minut dražší než papírová, u 24 a 72 hodin stojí stejně. Hodí se,
              když nechcete instalovat aplikaci a máte české telefonní číslo.
            </p>
            <p className="mt-2 max-w-prose text-xs text-gray-600 sm:text-sm">
              Děti do 15 let a senioři od 65 let jezdí v Praze zdarma (s prokázáním nároku), senioři 60–65 let mají zvýhodněné jízdné. Podmínky a zvýhodněné ceny
              najdete v{" "}
              <a href="https://pid.cz/jizdne-a-tarif/" {...EXTERNAL} className={INLINE_LINK}>
                ceníku PID
              </a>
              .
            </p>
          </section>

          <section id="litacka" aria-labelledby="litacka-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="litacka-heading" className={H2}>
              <Smartphone aria-hidden="true" size={22} className="text-navy-700" />
              Jízdenka v aplikaci PID Lítačka
            </h2>
            <p className={PARAGRAPH}>
              PID Lítačka je oficiální aplikace Pražské integrované dopravy. Vyhledáte v ní spojení a koupíte elektronickou jízdenku pro Prahu i pro další cesty
              po PID — jen si vyberte správnou jízdenku.
            </p>
            <h3 className="mt-4 text-base font-bold text-gray-900">Kdy jízdenka začne platit</h3>
            <ul className={LIST}>
              <li>
                Při volbě <strong>„Ihned po nákupu“</strong> jízdenka platí <strong>1 minutu po zakoupení</strong>. Kupte ji tedy nejpozději minutu před vstupem
                do metra nebo před odjezdem spoje.
              </li>
              <li>Jízdenka koupená „do zásoby“ (aktivace „Později ručně“) neplatí, dokud ji neaktivujete.</li>
              <li>Jízdenka aktivovaná až ve vozidle nebo po výzvě revizora se za platnou neuznává.</li>
              <li>K aktivaci potřebujete datové připojení; potom už ho po dobu platnosti nepotřebujete.</li>
            </ul>
            <a
              href={PID_LITACKA_APP_URL}
              {...EXTERNAL}
              data-ticket-app="litacka-section"
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-center text-base font-bold text-white shadow-sm hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2 sm:w-auto"
            >
              Otevřít PID Lítačku
              <ExternalLink aria-hidden="true" size={18} />
            </a>
            <p className="mt-2 text-xs text-gray-600">Otevře se oficiální web PID Lítačky (app.pidlitacka.cz) v novém panelu.</p>
          </section>

          <section id="bez-aplikace" aria-labelledby="bez-aplikace-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="bez-aplikace-heading" className={H2}>
              <CreditCard aria-hidden="true" size={22} className="text-navy-700" />
              Kde koupit jízdenku bez aplikace?
            </h2>
            <ul className={LIST}>
              <li>
                <strong>Automaty na jízdenky</strong> najdete ve vestibulech metra, na zastávkách a na letišti. Tlačítkové automaty berou jen mince, dotykové mince i
                platební karty. Jízdenku z automatu musíte <strong>před vstupem do metra nebo do vozidla označit</strong>.
              </li>
              <li>
                <strong>Dotykové samoobslužné terminály</strong> přijímají platební karty. Jízdenka z nich má už natištěný čas a pásmo, takže se neoznačuje.
              </li>
              <li>
                <strong>V tramvaji, autobusu a trolejbusu</strong> koupíte jízdenku na 30 minut, 90 minut nebo 24 hodin v terminálu jen bezkontaktní platbou (v
                tramvaji uprostřed vozu, v autobusu a trolejbusu u druhých dveří). Platí hned od nákupu, neoznačuje se.
              </li>
              <li>
                <strong>Infocentra DPP, trafiky a obchody</strong> prodávají papírové jízdenky bez časového razítka — ty je nutné označit.
              </li>
            </ul>
            <p className="mt-4 flex max-w-prose items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 sm:text-base">
              <BadgeInfo aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-navy-700" />
              <span>
                Kartou v Praze platíte <strong>nákup jízdenky</strong>, ne samotnou jízdu. V metru se neodbavíte jen přiložením platební karty — do metra
                vstupujete až s platnou jízdenkou.
              </span>
            </p>
          </section>

          <section id="platnost" aria-labelledby="platnost-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="platnost-heading" className={H2}>
              <TriangleAlert aria-hidden="true" size={22} className="text-navy-700" />
              Kdy musím mít platnou jízdenku?
            </h2>
            <p className={PARAGRAPH}>
              Do přepravního prostoru metra smíte vstoupit a do tramvaje či autobusu nastoupit <strong>jen s platnou jízdenkou</strong>. Kdy jízdenka začne platit,
              záleží na tom, jakou máte:
            </p>
            <dl className="mt-3 flex max-w-prose flex-col gap-3 text-sm leading-relaxed text-gray-700 sm:text-base">
              <div>
                <dt className="font-bold text-gray-900">Papírová jízdenka bez razítka</dt>
                <dd>Platí od označení v označovači. Označte ji jednou, při vstupu do metra nebo hned po nástupu do vozidla. Opakované označení ji znehodnotí.</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Jízdenka s natištěným časem</dt>
                <dd>Z terminálu, od řidiče nebo z pokladny Českých drah. Platí od nákupu a neoznačuje se.</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">Jízdenka v PID Lítačce</dt>
                <dd>Platí 1 minutu po aktivaci „Ihned po nákupu“, nebo od času, který si při aktivaci nastavíte.</dd>
              </div>
              <div>
                <dt className="font-bold text-gray-900">SMS jízdenka</dt>
                <dd>Platí až od doručení SMS s jízdenkou. Samotné odeslání objednávky nestačí.</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="pid-heading" className={CARD}>
            <h2 id="pid-heading" className={H2}>
              <BadgeInfo aria-hidden="true" size={22} className="text-navy-700" />
              Co je PID?
            </h2>
            <p className={PARAGRAPH}>
              Pražská integrovaná doprava (PID) je společný dopravní systém Prahy a Středočeského kraje: metro, tramvaje, autobusy, vybrané vlaky a další doprava
              jezdí na stejné jízdenky. Ceny na této stránce platí pro Prahu (pásma P, 0, B); pro cesty mimo Prahu platí jiné jízdenky podle tarifních pásem.
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a href="https://pid.cz/" {...EXTERNAL} className={INLINE_LINK}>
                pid.cz
              </a>
              <a href="https://pid.cz/jizdne-a-tarif/" {...EXTERNAL} className={INLINE_LINK}>
                Jízdné a tarif PID
              </a>
            </p>
          </section>

          <section id="otazky" aria-labelledby="otazky-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="otazky-heading" className={H2}>
              <CircleHelp aria-hidden="true" size={22} className="text-navy-700" />
              Časté otázky
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-gray-100">
              {FAQ.map((item) => (
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
              Oficiální zdroje
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Ceny a pravidla jsme ověřili {formatCzechDate(TARIFF_VERIFIED_AT)}. KdeJeMetro.cz jízdenky neprodává; při rozporu platí podmínky PID a DPP.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {TICKET_SOURCES.map((source) => (
                <li key={source.url}>
                  <a href={source.url} {...EXTERNAL} className="inline-flex items-center gap-1 text-navy-700 underline underline-offset-2 hover:text-navy-900">
                    {source.provider}: {source.label}
                    <ExternalLink aria-hidden="true" size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="flex items-start gap-1.5 text-sm text-gray-600">
            <LocateFixed aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            <span>
              Máte jízdenku?{" "}
              <Link href="/#najit-metro" className="font-semibold text-navy-700 underline">
                Najděte nejbližší metro
              </Link>{" "}
              nebo si projděte{" "}
              <a href={STATIONS_PATH} className="font-semibold text-navy-700 underline">
                průvodce stanicemi
              </a>
              .
            </span>
          </p>
        </main>
        <AppFooter bottomLink={{ href: "/", label: "Najít nejbližší metro", icon: <LocateFixed aria-hidden="true" size={14} strokeWidth={2.25} /> }} />
      </div>
    </I18nProvider>
  );
}
