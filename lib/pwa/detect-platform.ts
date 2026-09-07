// Čistá platformní detekce pro hooks/usePwaInstall.ts — parametrizovaná
// (žádné přímé čtení `navigator`/`window`), aby šla otestovat bez DOM
// (stejný vzorec jako lib/storage/safe-storage.ts — `StorageLike` místo
// přímého `window.localStorage`).

export type UserAgentLike = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
};

/**
 * Rozumná detekce iPhone/iPad (Safari i další prohlížeče nad WebKitem,
 * viz zadání bod 6 "Detekuj rozumně iPhone/iPad Safari") — bez
 * nativního `beforeinstallprompt`, appka místo toho ukáže krátký návod.
 */
export function isIosDevice(ua: UserAgentLike): boolean {
  const isAppleTouchDevice = /iPad|iPhone|iPod/.test(ua.userAgent);
  // iPadOS 13+ se hlásí jako "Macintosh" (desktop-class UA řetězec), ale
  // má dotykový displej — bez tohohle by dostal desktopové chování.
  const isIPadOs13Plus = ua.platform === "MacIntel" && (ua.maxTouchPoints ?? 0) > 1;
  return isAppleTouchDevice || isIPadOs13Plus;
}

/** Appka už běží nainstalovaná — `display-mode: standalone` (Android/desktop) NEBO iOS `navigator.standalone`. */
export function isStandaloneDisplay(params: { matchesStandaloneMediaQuery: boolean; iosStandaloneFlag?: boolean }): boolean {
  return params.matchesStandaloneMediaQuery === true || params.iosStandaloneFlag === true;
}
