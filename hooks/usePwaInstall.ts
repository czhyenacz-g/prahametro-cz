"use client";

import { useCallback, useEffect, useState } from "react";
import { isIosDevice, isStandaloneDisplay } from "../lib/pwa/detect-platform.ts";

/** Minimální typ pro `beforeinstallprompt` — není (zatím) součástí lib.dom.d.ts. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaInstallOutcome = "accepted" | "dismissed" | "unavailable";

export type UsePwaInstallResult = {
  /** Android/Chrome zachytilo `beforeinstallprompt` a nabídku ještě nikdo nepoužil. */
  canInstall: boolean;
  /** Spustí nativní install dialog. Bez zachyceného eventu (canInstall === false) je no-op, vrátí "unavailable". */
  promptInstall: () => Promise<PwaInstallOutcome>;
  /** Rozumná detekce iPhone/iPad (Safari i prohlížeče nad WebKitem) — bez nativního install promptu. */
  isIOS: boolean;
  /** Appka už běží nainstalovaná (`display-mode: standalone` / iOS `navigator.standalone`). */
  isStandalone: boolean;
};

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return isStandaloneDisplay({
      matchesStandaloneMediaQuery: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
      iosStandaloneFlag: nav.standalone,
    });
  } catch {
    // Embedded/neobvyklý prohlížeč bez matchMedia apod. (zadání bod 11)
    // — bezpečný fallback je "neběží jako nainstalovaná appka".
    return false;
  }
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    return isIosDevice(navigator);
  } catch {
    return false;
  }
}

/**
 * Čistá logika instalace na plochu — žádný branding, žádné texty,
 * žádný localStorage (to řeší hooks/usePersistentDismiss.ts zvlášť),
 * ať jde 1:1 zkopírovat do dalšího Next.js projektu (viz zadání bod 13).
 *
 * Bezpečné za všech okolností (zadání bod 11): bez podpory
 * `beforeinstallprompt` zůstává `canInstall` navždy `false`;
 * `promptInstall()` bez zachyceného eventu je no-op. Server i první
 * klientský render vrací `false`/`false` (žádné čtení `navigator`/
 * `matchMedia` při SSR), teprve `useEffect` po mountu doplní skutečný
 * stav — stejný hydration-safe vzorec jako zbytek appky.
 */
export function usePwaInstall(): UsePwaInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsStandalone(detectStandalone());
    setIsIOS(detectIOS());

    function handleBeforeInstallPrompt(event: Event) {
      // Potlačí prohlížečův výchozí mini-infobar (viz zadání "neukazuj
      // okamžitě agresivní popup") — appka si o nativní prompt řekne až
      // po kliknutí na vlastní nenápadné CTA.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<PwaInstallOutcome> => {
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return choice.outcome;
    } catch {
      // Prompt může selhat (např. mezitím zavřený/embedded browser) —
      // appka nesmí spadnout, jen se zachová, jako by nabídka zmizela.
      setDeferredPrompt(null);
      return "unavailable";
    }
  }, [deferredPrompt]);

  return { canInstall: deferredPrompt !== null, promptInstall, isIOS, isStandalone };
}
