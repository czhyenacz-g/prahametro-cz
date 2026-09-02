import { CircleHelp, MapPinned, Plane } from "lucide-react";
import { getNightSeoContent } from "../../lib/seo/night-content.ts";
import { buildFaqPageJsonLd } from "../../lib/seo/structured-data.ts";
import { nightTransportIndex } from "../../lib/night-transport/load-index.ts";
import type { NightLineCategory } from "../../lib/night-transport/types.ts";
import type { Locale } from "../../lib/i18n/types.ts";

const CATEGORY_ORDER: NightLineCategory[] = ["tram", "urban-bus", "regional-bus"];

/**
 * Čistě statický, serverově vykreslený obsah pod funkční částí noční
 * stránky (zadání body 14/15/16/21) — žádné "use client", žádné hooky.
 * Čte `nightTransportIndex` (statický JSON import, viz
 * lib/night-transport/load-index.ts) přímo v build/request čase, takže
 * letištní linky a přehled linek jsou VŽDY odvozené ze skutečných
 * aktuálních dat, ne natvrdo napsané.
 */
export default function NightSeoContent({ locale }: { locale: Locale }) {
  const seo = getNightSeoContent(locale);
  const faqJsonLd = buildFaqPageJsonLd(seo.faq.items);

  const linesByCategory = new Map<NightLineCategory, typeof nightTransportIndex.lines>();
  for (const line of nightTransportIndex.lines) {
    if (!linesByCategory.has(line.category)) linesByCategory.set(line.category, []);
    linesByCategory.get(line.category)!.push(line);
  }
  const hasAnyVariants = nightTransportIndex.lines.some((l) => l.hasRouteVariants);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <section id={seo.intro.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{seo.intro.heading}</h2>
        {seo.intro.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-2 max-w-prose text-sm leading-relaxed text-gray-700 dark:text-slate-300 sm:text-base">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
          <MapPinned aria-hidden="true" size={20} strokeWidth={2.25} className="shrink-0 text-navy-700 dark:text-slate-300" />
          {seo.lazarska.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-slate-300 sm:text-base">{seo.lazarska.body}</p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
          <Plane aria-hidden="true" size={20} strokeWidth={2.25} className="shrink-0 text-navy-700 dark:text-slate-300" />
          {seo.airport.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-slate-300 sm:text-base">
          {nightTransportIndex.airportLines.length > 0 ? seo.airport.template(nightTransportIndex.airportLines) : seo.airport.noneFound}
        </p>
      </section>

      <section id={seo.lineOverview.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{seo.lineOverview.heading}</h2>
        <div className="mt-3 flex flex-col gap-4">
          {CATEGORY_ORDER.filter((category) => linesByCategory.has(category)).map((category) => (
            <div key={category}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                {category === "tram" ? seo.lineOverview.categories.tram : category === "urban-bus" ? seo.lineOverview.categories.urbanBus : seo.lineOverview.categories.regionalBus}
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {linesByCategory.get(category)!.map((line) => (
                  <li key={line.routeId} className="flex items-center gap-2.5">
                    <span
                      className="flex h-6 min-w-[2.25rem] shrink-0 items-center justify-center rounded px-1.5 text-xs font-bold"
                      style={{ backgroundColor: `#${line.colorHex}`, color: `#${line.textColorHex}` }}
                    >
                      {line.shortName}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-slate-300">{line.destinations.join(" – ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {hasAnyVariants && <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">{seo.lineOverview.variantsNotice}</p>}
      </section>

      <section id={seo.faq.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
          <CircleHelp aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700 dark:text-slate-300" />
          {seo.faq.heading}
        </h2>
        <div className="mt-3 flex flex-col divide-y divide-gray-100 dark:divide-slate-800">
          {seo.faq.items.map((item) => (
            <details key={item.question} className="group py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 marker:content-none dark:text-white sm:text-base">{item.question}</summary>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-slate-300 sm:text-base">{item.answer}</p>
            </details>
          ))}
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      </section>
    </div>
  );
}
