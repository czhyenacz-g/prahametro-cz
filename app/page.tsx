import type { Metadata } from "next";
import { metroEntrances } from "../lib/metro/load-entrances.ts";
import HomeClient from "../components/HomeClient.tsx";

const TITLE = "PrahaMetro.cz — nejbližší vstup do metra";
const DESCRIPTION = "Jedním klepnutím najdi 2–3 nejbližší vstupy do pražského metra a spusť pěší navigaci. Plus čitelná mapa metra na mobil.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="px-4 pt-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">PrahaMetro.cz</h1>
        <p className="mt-2 text-sm text-gray-600">Nejrychlejší cesta k nejbližšímu metru</p>
      </header>

      <HomeClient entrances={metroEntrances.entrances} />

      <footer className="mt-auto border-t border-gray-200 px-4 py-6 text-center text-xs text-gray-500">
        <p>Polohu zpracovává pouze váš prohlížeč a web ji nikam neodesílá.</p>
        <p className="mt-2">
          Dopravní data:{" "}
          <a href="https://pid.cz/opendata/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
            PID
          </a>
          , licence{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.cs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-900"
          >
            CC BY 4.0
          </a>
          .
        </p>
        <p className="mt-2 text-[11px] text-gray-400">Neoficiální projekt, nesouvisí s DPP ani PID.</p>
      </footer>
    </div>
  );
}
