"use client";

import { useI18n } from "./i18n/I18nContext.ts";

export type NativeAdCardProps = {
  label?: string;
  title?: string;
  description?: string;
  href?: string;
  image?: string;
};

// V MVP jen bezpečný vlastní placeholder — žádný externí reklamní
// skript (viz zadání). Props jsou navržené tak, aby šlo později napojit
// přímé kampaně podle nejbližší stanice bez zásahu do stránek, které
// komponentu používají. Defaulty jsou přeložené (viz useI18n), pokud
// budoucí reálná kampaň žádnou z hodnot nepřebije.
export default function NativeAdCard({ label, title, description, href, image }: NativeAdCardProps) {
  const { dict } = useI18n();
  const resolvedLabel = label ?? dict.ad.label;
  const resolvedTitle = title ?? dict.ad.title;
  const resolvedDescription = description ?? dict.ad.cta;

  const content = (
    <div className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- v MVP bez next/image remotePatterns pro budoucí kampaně
        <img src={image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{resolvedLabel}</span>
        <p className="mt-0.5 truncate text-base font-medium text-gray-700">{resolvedTitle}</p>
        <span className="mt-1 inline-block text-base font-semibold text-gray-900 underline">{resolvedDescription}</span>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer sponsored" className="block transition hover:opacity-90">
      {content}
    </a>
  );
}
