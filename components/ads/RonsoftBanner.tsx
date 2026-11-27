"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { RONSOFT_BF_CAMPAIGN, isRonsoftCampaignActive } from "../../lib/ads/ronsoft-campaign.ts";

/**
 * Jediný banner Ronsoft Black Friday na stránce — v proudu obsahu, žádný
 * sticky/overlay. Celý blok je jeden affiliate odkaz (`rel="sponsored"`).
 * Na úzkém mobilu je text v grafice drobný, proto pod ní čitelný textový
 * řádek s produktem a cenou (součást téhož odkazu).
 */
const subscribeNoop = () => () => {};

export default function RonsoftBanner({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  // Staticky vygenerovaná stránka může přežít konec akce — v prohlížeči se
  // stav dopočítá podle aktuálního času (server snapshot = stav při renderu).
  const active = useSyncExternalStore(subscribeNoop, isRonsoftCampaignActive, isRonsoftCampaignActive);

  if (!active) return null;

  const c = RONSOFT_BF_CAMPAIGN;
  // Světlá varianta má podklad — některé titulky mají pod obsahem fotku/vzor.
  const muted = tone === "dark" ? "text-white/60" : "inline-block rounded bg-white/90 px-2 py-0.5 text-gray-700";
  const strong = tone === "dark" ? "text-white" : "text-gray-900";
  const border = tone === "dark" ? "border-white/10" : "border-gray-200";

  return (
    <aside aria-label="Reklama" data-campaign="ronsoft-black-friday" className={`mx-auto w-full max-w-4xl ${className}`}>
      <a
        href={c.href}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className={`block overflow-hidden rounded-lg border ${border} transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
      >
        <Image
          src={c.imageUrl}
          alt={c.imageAlt}
          width={c.width}
          height={c.height}
          sizes="(min-width: 1024px) 896px, 100vw"
          className="block h-auto w-full"
        />
        <span className={`block px-3 py-2 text-center text-sm font-semibold underline sm:hidden ${strong}`}>{c.textLink}</span>
      </a>
      <p className={`mt-1.5 text-xs ${muted}`}>{c.disclosure}</p>
    </aside>
  );
}
