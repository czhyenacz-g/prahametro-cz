"use client";

import { useEffect, useId, useState } from "react";
import { Share, Smartphone, SquarePlus, X } from "lucide-react";
import { usePwaInstall } from "../../hooks/usePwaInstall.ts";
import { usePersistentDismiss } from "../../hooks/usePersistentDismiss.ts";
import { useFocusTrap } from "../../hooks/useFocusTrap.ts";

export type InstallPromptTexts = {
  title: string;
  subtitle: string;
  installCta: string;
  dismissAriaLabel: string;
  iosTitle: string;
  /** 2–3 krátké kroky ("Klepněte na Sdílet", "Zvolte Přidat na plochu") — žádný fake instalační krok, jen skutečný postup v Safari. */
  iosSteps: string[];
  iosCloseLabel: string;
};

export type InstallPromptProps = {
  texts: InstallPromptTexts;
  /**
   * Tailwind třídy pro CTA tlačítko (pozadí + hover) — komponenta
   * záměrně neobsahuje natvrdo žádnou konkrétní brand barvu, ať jde
   * beze změny přenést i do jiného projektu (viz zadání bod 13). Volající
   * (viz components/HomeClient.tsx) předává barvu podle SVÉHO designu.
   */
  ctaClassName?: string;
  /** localStorage klíč pro "uživatel zavřel/viděl nabídku, nezobrazuj znovu hned" — viz hooks/usePersistentDismiss.ts. */
  dismissStorageKey?: string;
  /** Za jak dlouho (ms) se smí nabídka objevit znovu po zavření. */
  remindAfterMs?: number;
};

export const DEFAULT_INSTALL_PROMPT_STORAGE_KEY = "pwa-install-prompt-dismissed-at";
/** 30 dní — dost dlouho, aby appka neotravovala, dost krátce, aby se nabídka časem vrátila (viz zadání bod 8). */
export const DEFAULT_REMIND_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Nenápadná karta "přidat na plochu" — Android/Chrome dostane tlačítko,
 * co spustí nativní install prompt (hooks/usePwaInstall.ts), iOS Safari
 * dostane po kliknutí krátký návod (žádný fake install prompt, iOS
 * žádný nemá). Sama se schová:
 * - když appka už běží nainstalovaná (`isStandalone`),
 * - když prohlížeč `beforeinstallprompt` nepodporuje A NENÍ iOS,
 * - když ji uživatel v posledních `remindAfterMs` zavřel.
 *
 * `sm:hidden` schovává celou kartu od tabletové/desktopové šířky výš
 * (zadání bod 7 "desktop uživatelům ji nezobrazuj") — nezávisle na tom,
 * čistě CSS, appka tak zůstane funkční, i kdyby JS detekce selhala.
 */
export default function InstallPrompt({
  texts,
  ctaClassName = "bg-gray-900 hover:bg-gray-800",
  dismissStorageKey = DEFAULT_INSTALL_PROMPT_STORAGE_KEY,
  remindAfterMs = DEFAULT_REMIND_AFTER_MS,
}: InstallPromptProps) {
  const { canInstall, promptInstall, isIOS, isStandalone } = usePwaInstall();
  const { dismissed, dismiss } = usePersistentDismiss(dismissStorageKey, remindAfterMs);
  const [showIosSheet, setShowIosSheet] = useState(false);

  if (isStandalone || dismissed || (!canInstall && !isIOS)) return null;

  async function handleCta() {
    if (isIOS) {
      setShowIosSheet(true);
      return;
    }
    // Odpověď (accepted/dismissed) se dál neřeší zvlášť — v obou
    // případech uživatel nabídku už viděl, další zobrazení počká na
    // `remindAfterMs` (zadání bod 8), stejně jako po ručním zavření.
    await promptInstall();
    dismiss();
  }

  function closeIosSheet() {
    setShowIosSheet(false);
    dismiss();
  }

  return (
    <>
      <div className="mx-auto mt-6 max-w-2xl px-4 sm:hidden">
        <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700" aria-hidden="true">
            <Smartphone size={20} strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">{texts.title}</p>
            <p className="mt-0.5 text-xs text-gray-600">{texts.subtitle}</p>
            <button
              type="button"
              onClick={handleCta}
              className={`mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition ${ctaClassName}`}
            >
              {texts.installCta}
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={texts.dismissAriaLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X aria-hidden="true" size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {showIosSheet && <IosInstructionsSheet texts={texts} onClose={closeIosSheet} />}
    </>
  );
}

function IosInstructionsSheet({ texts, onClose }: { texts: InstallPromptTexts; onClose: () => void }) {
  const headingId = useId();
  const containerRef = useFocusTrap(true, onClose);

  // Stejný vzorec jako components/DeparturesPanel.tsx — zamkne scroll
  // pozadí, dokud je spodní panel otevřený.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative w-full rounded-t-3xl border border-gray-200 bg-white p-5 shadow-lg"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="text-lg font-bold text-gray-900">
            {texts.iosTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={texts.iosCloseLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X aria-hidden="true" size={20} strokeWidth={2.25} />
          </button>
        </div>

        <ol className="mt-4 space-y-3">
          {texts.iosSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700" aria-hidden="true">
                {index === 0 ? <Share size={13} strokeWidth={2.5} /> : index === 1 ? <SquarePlus size={13} strokeWidth={2.5} /> : index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
