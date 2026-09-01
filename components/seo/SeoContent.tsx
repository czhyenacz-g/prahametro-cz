import { CircleHelp, Footprints, ListChecks, LocateFixed, Signpost } from "lucide-react";
import { getSeoContent } from "../../lib/seo/content.ts";
import { buildFaqPageJsonLd } from "../../lib/seo/structured-data.ts";
import type { Locale } from "../../lib/i18n/types.ts";

const STEP_ICONS = [LocateFixed, ListChecks, Footprints] as const;

/**
 * Čistě statický, serverově vykreslený SEO obsah pod mapou/reklamou
 * (viz zadání) — žádné "use client", žádné hooky, žádná interaktivita.
 * Vizuálně navazuje na stávající kartový styl appky (rounded-2xl border
 * bg-white shadow-sm), ať nepůsobí jako přilepený článek pod appkou.
 */
export default function SeoContent({ locale }: { locale: Locale }) {
  const seo = getSeoContent(locale);
  const faqJsonLd = buildFaqPageJsonLd(seo.faq.items);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <section id={seo.intro.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{seo.intro.heading}</h2>
        {seo.intro.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-2 max-w-prose text-sm leading-relaxed text-gray-700 sm:text-base">
            {paragraph}
          </p>
        ))}
      </section>

      <section id={seo.howItWorks.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{seo.howItWorks.heading}</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {seo.howItWorks.steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? LocateFixed;
            return (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
                </span>
                <span className="text-sm font-medium text-gray-800 sm:text-base">{step}</span>
              </li>
            );
          })}
        </ol>
        <p id={seo.howItWorks.privacyId} className="mt-4 text-xs text-gray-500 sm:text-sm">
          {seo.howItWorks.privacyText}
        </p>
      </section>

      <nav aria-label={seo.links.ariaLabel} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">
          <Signpost aria-hidden="true" size={20} strokeWidth={2.25} className="shrink-0 text-navy-700" />
          {seo.links.heading}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {seo.links.items.map((link) => (
            <li key={`${link.label}-${link.href}`}>
              <a
                href={link.href}
                className="inline-flex min-h-[36px] items-center rounded-full border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-navy-700 transition hover:border-navy-700 hover:bg-white sm:text-sm"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id={seo.faq.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl">
          <CircleHelp aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
          {seo.faq.heading}
        </h2>
        <div className="mt-3 flex flex-col divide-y divide-gray-100">
          {seo.faq.items.map((item) => (
            <details key={item.question} className="group py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 marker:content-none sm:text-base">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FAQPage JSON-LD sestavené přímo z pole výše — nikdy neujede od viditelného FAQ (viz lib/seo/structured-data.ts). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
