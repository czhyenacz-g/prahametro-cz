"use client";

import { useI18n } from "./i18n/I18nContext.ts";

export default function AppFooter() {
  const { dict } = useI18n();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-6 text-center text-xs text-gray-500 sm:text-sm">
      <p>{dict.footer.privacy}</p>
      <p className="mt-2">
        {dict.footer.dataLabel}{" "}
        <a href="https://pid.cz/opendata/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
          PID
        </a>
        , {dict.footer.licenseWord}{" "}
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
      <p className="mt-2 text-[11px] text-gray-400">{dict.footer.disclaimer}</p>
    </footer>
  );
}
