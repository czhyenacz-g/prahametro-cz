export type NavigationTarget = { lat: number; lon: number };

export function googleMapsWalkingUrl({ lat, lon }: NavigationTarget): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
}

export function appleMapsWalkingUrl({ lat, lon }: NavigationTarget): string {
  return `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=w`;
}

/**
 * iOS/macOS -> Apple Maps jako hlavní volba, jinde Google Maps (viz
 * zadání) — detekce platformy NENÍ kritická logika (uživatel má u
 * výsledku vždy i druhý odkaz "Otevřít v jiné mapě"), takže jednoduchý
 * UA sniffing tady stačí.
 */
export function isApplePlatform(userAgent: string): boolean {
  return /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
}

export function primaryNavigationUrl(target: NavigationTarget, userAgent: string): string {
  return isApplePlatform(userAgent) ? appleMapsWalkingUrl(target) : googleMapsWalkingUrl(target);
}

export function secondaryNavigationUrl(target: NavigationTarget, userAgent: string): string {
  return isApplePlatform(userAgent) ? googleMapsWalkingUrl(target) : appleMapsWalkingUrl(target);
}
