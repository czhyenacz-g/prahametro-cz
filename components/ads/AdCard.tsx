"use client";

import { useEffect } from "react";
import { AD_LINK_REL, isValidAffiliateUrl } from "../../lib/ads/validate-url.ts";
import { emitAdEvent } from "../../lib/ads/events.ts";
import { useSelectedAd } from "../../hooks/useSelectedAd.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import AdIcon from "./AdIcon.tsx";

export type AdCardProps = {
  /** Kam se karta umístila — jde do AdEvent (viz zadání "budoucí měření"). */
  placement: string;
  /** Neznámá stanice = jen obecné kampaně bez `stationIds` (viz filterCampaigns). */
  stationId?: string | null;
};

// Jedna decentní karta, žádný carousel/časovač/animace (viz zadání).
// `vulgar` z useI18n() se tu záměrně vůbec nečte — text reklamy nesmí
// jít ovlivnit režimem 18+.
export default function AdCard({ placement, stationId }: AdCardProps) {
  const { locale, dict } = useI18n();
  const ad = useSelectedAd(locale, stationId);

  const isActive = ad ? isValidAffiliateUrl(ad.href) : false;
  const hasInvalidHref = Boolean(ad && ad.href !== null && !isActive);

  useEffect(() => {
    if (!ad) return;
    emitAdEvent({ type: "ad_impression", campaignId: ad.id, language: locale, placement });
  }, [ad, locale, placement]);

  useEffect(() => {
    if (hasInvalidHref && ad && process.env.NODE_ENV === "development") {
      console.warn(`[ads] Kampaň "${ad.id}" má neplatný affiliate odkaz (očekává se https:) — zobrazuje se jako neaktivní.`);
    }
  }, [hasInvalidHref, ad]);

  if (!ad) return null;

  const title = ad.title[locale];
  const description = ad.description[locale];
  const cta = ad.cta[locale];
  if (!title || !description || !cta) return null;

  function handleClick() {
    if (!ad) return;
    emitAdEvent({ type: "ad_click", campaignId: ad.id, language: locale, placement });
  }

  return (
    <section aria-label={dict.ad.label} className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <AdIcon campaignId={ad.id} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{dict.ad.label}</span>
            {ad.advertiser && <span className="text-xs text-gray-400">· {ad.advertiser}</span>}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>

          <div className="mt-3">
            {isActive ? (
              <a
                href={ad.href!}
                target="_blank"
                rel={AD_LINK_REL}
                onClick={handleClick}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                {cta}
              </a>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-[44px] cursor-default items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-400">
                  {cta}
                </span>
                <span className="text-xs text-gray-400">{dict.ad.comingSoon}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
