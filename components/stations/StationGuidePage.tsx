import Link from "next/link";
import { Accessibility, ArrowRight, BookOpen, CircleHelp, ExternalLink, Info, LocateFixed, MapPinned, Search, Signpost } from "lucide-react";
import type { ReactNode } from "react";
import { metroEntrances } from "../../lib/metro/load-entrances.ts";
import { LINE_BADGE_CLASS } from "../../lib/metro/line-colors.ts";
import { stationAreaStops } from "../../lib/stations/load-area-stops.ts";
import { findPlatformsForRoute, groupStationEntrances, platformAnchorId } from "../../lib/stations/build-guide-view.ts";
import { ORDERED_STATION_GUIDES, STATIONS_PATH, stationGuidePath } from "../../lib/stations/guides.ts";
import { buildPlaceLinks, type PlaceTarget } from "../../lib/stations/place-links.ts";
import type { AreaStopMode, StationAreaPlatform } from "../../lib/stations/area-stops-types.ts";
import type { GuideDestination, GuideLink, GuideSectionId, StationGuide } from "../../lib/stations/types.ts";
import I18nProvider from "../i18n/I18nProvider.tsx";
import AppFooter from "../AppFooter.tsx";
import DeparturesButton from "../DeparturesButton.tsx";
import StationAnalytics from "./StationAnalytics.tsx";
import StationHeader from "./StationHeader.tsx";
import StationMap from "./StationMap.tsx";

const CARD = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6";
const H2 = "flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl";
const PARAGRAPH = "mt-2 max-w-prose text-sm leading-relaxed text-gray-700 sm:text-base";

const MODE_LABEL: Record<AreaStopMode, string> = { tram: "tramvaj", bus: "autobus", trolleybus: "trolejbus", other: "jiná doprava" };
const MODE_CHIP_CLASS: Record<AreaStopMode, string> = {
  tram: "bg-red-50 text-red-800 border-red-200",
  bus: "bg-sky-50 text-sky-900 border-sky-200",
  trolleybus: "bg-teal-50 text-teal-900 border-teal-200",
  other: "bg-gray-50 text-gray-800 border-gray-200",
};

const LINK_TYPE_LABEL: Record<GuideLink["type"], string> = {
  departures: "odjezdy (dynamické)",
  accessibility: "bezbariérový přístup (stavební údaje)",
  "elevator-status": "stav výtahů (dynamické)",
  "node-map": "mapa uzlu",
  "open-data": "otevřená data",
};

function formatCzechDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${day}. ${month}. ${year}`;
}

function getLink(guide: StationGuide, linkId: string): GuideLink {
  const link = guide.links.find((l) => l.id === linkId);
  if (!link) throw new Error(`Průvodce ${guide.slug}: odkaz "${linkId}" není v links.`);
  return link;
}

function ExternalAnchor({ link, slug, event, className, children }: { link: GuideLink; slug: string; event: "station_departures_click" | "station_source_click"; className: string; children: ReactNode }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" data-station-event={event} data-station-slug={slug} data-provider={link.provider} className={className}>
      {children}
    </a>
  );
}

/** `compact` = malé tlačítko pro dlouhé seznamy vstupů/stanovišť (Můstek má 20 vstupů), jinak plná trojice jako na homepage. */
function PlaceNavLinks({ target, slug, destinationId, label, compact = false }: { target: PlaceTarget; slug: string; destinationId: string; label: string; compact?: boolean }) {
  const links = buildPlaceLinks(target);
  const base = compact
    ? "inline-flex min-h-[36px] items-center justify-center rounded-lg px-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
    : "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 sm:text-sm";
  const items = [
    { provider: "google", href: links.google, text: compact ? "Google" : "Google Maps", className: "border-2 border-[#4285F4] bg-white text-[#4285F4] hover:bg-[#4285F4]/10" },
    { provider: "apple", href: links.apple, text: compact ? "Apple" : "Apple Maps", className: "border-2 border-navy-900 bg-navy-900 text-white hover:bg-navy-800" },
    { provider: "mapy", href: links.mapy, text: "Mapy.com", className: "border-2 border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800" },
  ];
  return (
    <div className={compact ? "flex shrink-0 gap-1" : "grid grid-cols-3 gap-1.5 sm:gap-2"}>
      {items.map((item) => (
        <a
          key={item.provider}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} – ${item.text}`}
          data-station-event="station_navigation_click"
          data-station-slug={slug}
          data-destination-id={destinationId}
          data-provider={item.provider}
          className={`${base} ${item.className}`}
        >
          {item.text}
        </a>
      ))}
    </div>
  );
}

function LineBadges({ lines, size = "md" }: { lines: StationGuide["lines"]; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex gap-1.5">
      {lines.map((line) => (
        <span key={line} className={`rounded font-bold ${size === "md" ? "px-2.5 py-0.5 text-sm" : "px-1.5 py-0.5 text-xs"} ${LINE_BADGE_CLASS[line]}`} aria-label={`linka ${line}`}>
          {line}
        </span>
      ))}
    </span>
  );
}

function RouteChips({ routes }: { routes: StationAreaPlatform["routes"] }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {routes.map((route) => (
        <li key={route.name} title={MODE_LABEL[route.mode]} className={`rounded-md border px-1.5 py-0.5 text-xs font-bold ${MODE_CHIP_CLASS[route.mode]}`}>
          <span className="sr-only">{MODE_LABEL[route.mode]} </span>
          {route.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * Jedna položka "Kam potřebujete?" / hlavní akce — vždy skutečně funkční:
 * kotva na sekci, externí odkaz z konfigurace, rozbalovací vyhledání
 * navigace k místu, nebo kotva na stanoviště linky z aktuálních dat.
 */
function DestinationItem({
  guide,
  destination,
  platforms,
  variant,
}: {
  guide: StationGuide;
  destination: GuideDestination;
  platforms: readonly StationAreaPlatform[];
  variant: "primary" | "secondary" | "list";
}) {
  const { action } = destination;
  const buttonClass =
    variant === "primary"
      ? "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-center text-base font-semibold text-white hover:bg-navy-800 sm:w-auto"
      : variant === "secondary"
        ? "inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-navy-700 hover:border-navy-700"
        : "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm font-semibold text-gray-900 hover:border-navy-700 hover:bg-white sm:text-base";
  const common = { "data-station-event": "station_destination_click", "data-station-slug": guide.slug, "data-destination-id": destination.id };

  if (action.kind === "section") {
    return (
      <a href={`#${action.sectionId}`} className={buttonClass} {...common}>
        <span>{destination.label}</span>
        {variant === "list" && <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-navy-700" />}
      </a>
    );
  }

  if (action.kind === "link") {
    const link = getLink(guide, action.linkId);
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        data-station-event={link.type === "departures" ? "station_departures_click" : "station_source_click"}
        data-station-slug={guide.slug}
        data-provider={link.provider}
        data-destination-id={destination.id}
      >
        <span>
          {destination.label}
          {variant === "list" && <span className="block text-xs font-normal text-gray-500">{link.provider} · otevře se v novém panelu</span>}
        </span>
        <ExternalLink aria-hidden="true" size={16} className="shrink-0" />
      </a>
    );
  }

  if (action.kind === "route") {
    const routePlatforms = findPlatformsForRoute(platforms, action.routeName);
    const first = routePlatforms[0];
    const href = first ? `#${platformAnchorId(first.code)}` : "#stanoviste";
    const suffix = routePlatforms.length > 0 ? ` – stanoviště ${routePlatforms.map((p) => p.code).join(", ")}` : "";
    return (
      <a href={href} className={buttonClass} {...common}>
        <span>
          {destination.label}
          {variant === "list" ? <span className="block text-xs font-normal text-gray-500">{suffix ? `podle jízdního řádu PID${suffix}` : "stanoviště v aktuálních datech nenalezeno"}</span> : suffix}
        </span>
        {variant === "list" && <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-navy-700" />}
      </a>
    );
  }

  // kind === "place" — cíl bez ověřených souřadnic: jen VYHLEDÁNÍ místa v mapách podle názvu, žádná předstíraně přesná navigace.
  return (
    <details className={variant === "list" ? "group rounded-xl border border-gray-200 bg-gray-50 open:bg-white" : "group w-full sm:w-auto"}>
      <summary
        className={`${variant === "list" ? "flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-gray-900 sm:text-base" : `${buttonClass} cursor-pointer list-none`} marker:content-none`}
        {...common}
      >
        <span>
          {destination.label}
          {variant === "list" && <span className="block text-xs font-normal text-gray-500">najít v mapách</span>}
        </span>
        <Search aria-hidden="true" size={16} className="shrink-0" />
      </summary>
      <div className="mt-2 px-3 pb-3">
        <PlaceNavLinks target={{ kind: "query", query: action.query }} slug={guide.slug} destinationId={destination.id} label={destination.label} />
      </div>
    </details>
  );
}

export default function StationGuidePage({ guide }: { guide: StationGuide }) {
  const entranceGroups = groupStationEntrances(metroEntrances.entrances, guide.stationId);
  const platforms = stationAreaStops.stations[guide.stationId] ?? [];
  const showPlatforms = guide.platforms !== null && platforms.length > 0;
  const accessibleCount = entranceGroups.filter((g) => g.wheelchair).length;
  const departuresLinks = guide.links.filter((l) => l.type === "departures");
  const otherGuides = ORDERED_STATION_GUIDES.filter((g) => g.slug !== guide.slug);
  const [primaryAction, ...secondaryActions] = guide.actions;
  const sectionHeading = (id: GuideSectionId) => guide.sections.find((s) => s.id === id);

  return (
    <I18nProvider locale="cs">
      <StationAnalytics />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <StationHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-8 pt-3">
          <nav aria-label="Drobečková navigace" className="text-xs text-gray-500 sm:text-sm">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="underline hover:text-gray-900">
                  KdeJeMetro.cz
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <a href={STATIONS_PATH} className="underline hover:text-gray-900">
                  Průvodce stanicemi
                </a>
              </li>
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="text-gray-700">
                {guide.name}
              </li>
            </ol>
          </nav>

          {/* Nad přehybem: název, linky, jedna věta, akce. */}
          <section className={CARD}>
            <div className="flex flex-wrap items-center gap-2">
              <LineBadges lines={guide.lines} />
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{guide.h1}</h1>
            <p className="mt-2 text-base font-medium text-gray-800 sm:text-lg">{guide.lead}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {primaryAction && <DestinationItem guide={guide} destination={primaryAction} platforms={platforms} variant="primary" />}
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((action) => (
                  <DestinationItem key={action.id} guide={guide} destination={action} platforms={platforms} variant="secondary" />
                ))}
                <DeparturesButton stationId={guide.stationId} stationName={guide.name} />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Tlačítko Odjezdy ukazuje plánované odjezdy metra z této stanice podle jízdního řádu PID.</p>
          </section>

          <section aria-labelledby="kam-potrebujete" className={CARD}>
            <h2 id="kam-potrebujete" className={H2}>
              <Signpost aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
              Kam potřebujete?
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {guide.destinations.map((destination) => (
                <li key={destination.id}>
                  <DestinationItem guide={guide} destination={destination} platforms={platforms} variant="list" />
                </li>
              ))}
            </ul>
            <p className={PARAGRAPH}>{guide.intro}</p>
          </section>

          <section id="mapa" aria-labelledby="mapa-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="mapa-heading" className={H2}>
              <MapPinned aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
              Mapa vstupů{showPlatforms ? " a zastávek" : ""}
            </h2>
            <p className={PARAGRAPH}>
              PID u stanice {guide.name} eviduje {entranceGroups.length} {entranceGroups.length === 1 ? "vstup" : entranceGroups.length < 5 ? "vstupy" : "vstupů"}
              {accessibleCount > 0 ? `, z toho ${accessibleCount} označen${accessibleCount === 1 ? "ý" : "é"} jako bezbariérov${accessibleCount === 1 ? "ý" : "é"}` : ""}.
            </p>
            <StationMap name={guide.name} entrances={entranceGroups} platforms={showPlatforms ? platforms : []} />

            <h3 className="mt-5 text-base font-bold text-gray-900">Vstupy do metra</h3>
            <ul className="mt-2 flex flex-col divide-y divide-gray-100">
              {entranceGroups.map((group) => (
                <li key={group.anchorId} id={group.anchorId} className="flex scroll-mt-4 flex-wrap items-center justify-between gap-2 py-2.5 target:rounded-xl target:bg-navy-50 target:px-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                    <span>Vstup {group.label}</span>
                    {group.wheelchair && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        <Accessibility aria-hidden="true" size={14} />
                        bezbariérový (PID)
                      </span>
                    )}
                  </div>
                  <PlaceNavLinks target={{ kind: "coordinates", lat: group.points[0].lat, lon: group.points[0].lon }} slug={guide.slug} destinationId={group.anchorId} label={`Vstup ${group.label}`} compact />
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
              <LocateFixed aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
              <span>
                Jste jinde a chcete nejbližší vstup podle své polohy?{" "}
                <Link href="/#najit-metro" className="font-semibold text-navy-700 underline">
                  Najít nejbližší metro
                </Link>
                .
              </span>
            </p>
          </section>

          {showPlatforms && guide.platforms && (
            <section id="stanoviste" aria-labelledby="stanoviste-heading" className={`${CARD} scroll-mt-4`}>
              <h2 id="stanoviste-heading" className={H2}>
                <Signpost aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
                {guide.platforms.heading}
              </h2>
              <p className={PARAGRAPH}>{guide.platforms.intro}</p>
              <ul className="mt-3 flex flex-col divide-y divide-gray-100">
                {platforms.map((platform) => (
                  <li key={`${platform.code}-${platform.lat}`} id={platformAnchorId(platform.code)} className="scroll-mt-4 py-3 target:rounded-xl target:bg-navy-50 target:px-2">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border-2 border-gray-500 bg-white px-1.5 text-sm font-extrabold text-gray-800">
                        {platform.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          Stanoviště {platform.code}
                          {platform.name !== guide.name && <span className="font-normal text-gray-600"> · zastávka {platform.name}</span>}
                        </p>
                        <div className="mt-1.5">
                          <RouteChips routes={platform.routes} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <PlaceNavLinks target={{ kind: "coordinates", lat: platform.lat, lon: platform.lon }} slug={guide.slug} destinationId={platformAnchorId(platform.code)} label={`Stanoviště ${platform.code}`} compact />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
                <Info aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
                <span>
                  Barva čísla linky: <span className="font-semibold text-red-800">tramvaj</span>, <span className="font-semibold text-sky-900">autobus</span>,{" "}
                  <span className="font-semibold text-teal-900">trolejbus</span>. Linky odjíždějící ze stanovišť podle jízdního řádu PID (GTFS) ze dne {formatCzechDate(stationAreaStops.generatedAt)}. Přiřazení se může změnit a nezahrnuje výluky — před cestou ověřte
                  na zastávkové tabuli.
                </span>
              </p>
              {departuresLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {departuresLinks.map((link) => (
                    <ExternalAnchor
                      key={link.id}
                      link={link}
                      slug={guide.slug}
                      event="station_departures_click"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
                    >
                      {link.label}
                      <ExternalLink aria-hidden="true" size={14} />
                    </ExternalAnchor>
                  ))}
                </div>
              )}
            </section>
          )}

          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className={`${CARD} scroll-mt-4`}>
              <h2 id={`${section.id}-heading`} className={H2}>
                {section.id === "bezbarierovost" ? (
                  <Accessibility aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
                ) : (
                  <Info aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
                )}
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className={PARAGRAPH}>
                  {paragraph}
                </p>
              ))}
              <p className="mt-3 text-xs text-gray-500">
                Zdroj:{" "}
                {section.sourceIds.map((id, index) => {
                  const link = getLink(guide, id);
                  return (
                    <span key={id}>
                      {index > 0 && ", "}
                      <ExternalAnchor link={link} slug={guide.slug} event="station_source_click" className="underline hover:text-gray-900">
                        {link.label}
                      </ExternalAnchor>
                    </span>
                  );
                })}
              </p>
            </section>
          ))}

          <section id="otazky" aria-labelledby="otazky-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="otazky-heading" className={H2}>
              <CircleHelp aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
              Praktické otázky
            </h2>
            <div className="mt-3 flex flex-col divide-y divide-gray-100">
              {guide.faq.map((item) => (
                <details key={item.question} className="py-3 first:pt-0 last:pb-0">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 marker:content-none sm:text-base">
                    <h3 className="inline">{item.question}</h3>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base">{item.answer}</p>
                  {item.more &&
                    ("sectionId" in item.more ? (
                      <a href={`#${item.more.sectionId}`} className="mt-1 inline-flex min-h-[36px] items-center text-sm font-semibold text-navy-700 underline underline-offset-2">
                        {item.more.label}
                      </a>
                    ) : (
                      <ExternalAnchor
                        link={getLink(guide, item.more.linkId)}
                        slug={guide.slug}
                        event={getLink(guide, item.more.linkId).type === "departures" ? "station_departures_click" : "station_source_click"}
                        className="mt-1 inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-navy-700 underline underline-offset-2"
                      >
                        {item.more.label}
                        <ExternalLink aria-hidden="true" size={14} />
                      </ExternalAnchor>
                    ))}
                </details>
              ))}
            </div>
          </section>

          <nav aria-labelledby="dalsi-stanice-heading" className={CARD}>
            <h2 id="dalsi-stanice-heading" className="text-base font-bold text-gray-900 sm:text-lg">
              Další průvodci stanicemi
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {otherGuides.map((other) => (
                <li key={other.slug}>
                  <a
                    href={stationGuidePath(other.slug)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-navy-700 hover:border-navy-700 hover:bg-white sm:text-sm"
                  >
                    {other.name}
                    <LineBadges lines={other.lines} size="sm" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section id="zdroje" aria-labelledby="zdroje-heading" className={`${CARD} scroll-mt-4`}>
            <h2 id="zdroje-heading" className={H2}>
              <BookOpen aria-hidden="true" size={22} strokeWidth={2.25} className="shrink-0 text-navy-700" />
              Zdroje a informace
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {guide.links.map((link) => (
                <li key={link.id} className="text-sm">
                  <ExternalAnchor link={link} slug={guide.slug} event={link.type === "departures" ? "station_departures_click" : "station_source_click"} className="font-semibold text-navy-700 underline underline-offset-2">
                    {link.label}
                  </ExternalAnchor>
                  <span className="block text-xs text-gray-500">
                    {link.provider} · {LINK_TYPE_LABEL[link.type]}
                    {link.direct ? "" : " · obecný rozcestník"}
                    {link.verifiedAt ? ` · odkaz ověřen ${formatCzechDate(link.verifiedAt)}` : " · odkaz neověřen"}
                  </span>
                  {link.note && <span className="block text-xs text-gray-500">{link.note}</span>}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              Polohy vstupů: PID GTFS ze dne {formatCzechDate(metroEntrances.generatedAt)}. Stanoviště a linky: PID GTFS ze dne {formatCzechDate(stationAreaStops.generatedAt)}. Odjezdy, výluky a stav výtahů
              se mění průběžně — KdeJeMetro.cz je nepřebírá, jen na ně odkazuje.
              {sectionHeading("bezbarierovost") ? " Popis bezbariérového přístupu vychází ze stránky DPP o stanici." : ""}
            </p>
          </section>
        </main>
        <AppFooter bottomLink={{ href: "/", label: "Najít nejbližší metro", icon: <LocateFixed aria-hidden="true" size={14} strokeWidth={2.25} /> }} />
      </div>
    </I18nProvider>
  );
}
