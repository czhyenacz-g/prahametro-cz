import Link from "next/link";
import { ArrowRight, LocateFixed } from "lucide-react";
import { LINE_BADGE_CLASS } from "../../lib/metro/line-colors.ts";
import { ORDERED_STATION_GUIDES, stationGuidePath } from "../../lib/stations/guides.ts";
import I18nProvider from "../i18n/I18nProvider.tsx";
import AppFooter from "../AppFooter.tsx";
import StationHeader from "./StationHeader.tsx";

export const STATIONS_OVERVIEW_SEO = {
  title: "Průvodce stanicemi pražského metra – výstupy a přestupy | KdeJeMetro",
  description:
    "Praktičtí průvodci vybranými stanicemi pražského metra: správný výstup, přestup mezi linkami, návazné autobusy a odjezdy, bezbariérový přístup.",
  h1: "Průvodce stanicemi metra",
};

export default function StationsOverviewPage() {
  return (
    <I18nProvider locale="cs">
      <div className="flex min-h-screen flex-col bg-gray-50">
        <StationHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-3">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{STATIONS_OVERVIEW_SEO.h1}</h1>
            <p className="mt-2 text-base text-gray-800">
              Víte, na které stanici vystoupíte? Najděte správný výstup, přestup nebo návazný autobus. Zatím pro osm stanic, kde se to nejvíc hodí.
            </p>
          </section>

          <ul className="flex flex-col gap-3">
            {ORDERED_STATION_GUIDES.map((guide) => (
              <li key={guide.slug}>
                <a
                  href={stationGuidePath(guide.slug)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-navy-700"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{guide.name}</span>
                      <span className="inline-flex gap-1">
                        {guide.lines.map((line) => (
                          <span key={line} className={`rounded px-1.5 py-0.5 text-xs font-bold ${LINE_BADGE_CLASS[line]}`} aria-label={`linka ${line}`}>
                            {line}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">{guide.overviewSummary}</span>
                  </span>
                  <ArrowRight aria-hidden="true" size={20} className="shrink-0 text-navy-700" />
                </a>
              </li>
            ))}
          </ul>

          <p className="flex items-start gap-1.5 text-sm text-gray-600">
            <LocateFixed aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            <span>
              Hledáte nejbližší vstup podle své polohy?{" "}
              <Link href="/#najit-metro" className="font-semibold text-navy-700 underline">
                Najít nejbližší metro
              </Link>
            </span>
          </p>
        </main>
        <AppFooter bottomLink={{ href: "/", label: "Najít nejbližší metro", icon: <LocateFixed aria-hidden="true" size={14} strokeWidth={2.25} /> }} />
      </div>
    </I18nProvider>
  );
}
