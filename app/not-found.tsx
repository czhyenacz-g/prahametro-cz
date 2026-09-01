import Link from "next/link";
import "./globals.css";

// Fallback pro cestu, která nepatří ani pod app/(cs) ani pod app/en
// (viz "multiple root layouts" — žádný sdílený app/layout.tsx už
// neexistuje, takže tenhle soubor musí být sám o sobě kompletní
// <html>/<body>). Bez jazykového přepínače — nevíme, jaký jazyk
// návštěvník chtěl, proto jednoduchý dvojjazyčný text a odkaz na obě
// homepage.
export default function NotFound() {
  return (
    <html lang="cs">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center text-gray-900 antialiased">
        <div>
          <p className="text-2xl font-bold">404</p>
          <p className="mt-2 text-gray-600">
            Stránka nenalezena / Page not found —{" "}
            <Link href="/" className="underline hover:text-gray-900">
              KdeJeMetro.cz
            </Link>{" "}
            /{" "}
            <Link href="/en" className="underline hover:text-gray-900">
              KdeJeMetro.cz (EN)
            </Link>{" "}
            /{" "}
            <Link href="/de" className="underline hover:text-gray-900">
              KdeJeMetro.cz (DE)
            </Link>{" "}
            /{" "}
            <Link href="/ua" className="underline hover:text-gray-900">
              KdeJeMetro.cz (UA)
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
