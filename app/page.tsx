import type { Metadata } from "next";
import { metroEntrances } from "../lib/metro/load-entrances.ts";
import I18nProvider from "../components/i18n/I18nProvider.tsx";
import AppHeader from "../components/AppHeader.tsx";
import AppFooter from "../components/AppFooter.tsx";
import HomeClient from "../components/HomeClient.tsx";

const TITLE = "KdeJeMetro.cz — nejbližší vstup do metra";
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
    <I18nProvider>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <AppHeader />
        <HomeClient entrances={metroEntrances.entrances} />
        <AppFooter />
      </div>
    </I18nProvider>
  );
}
