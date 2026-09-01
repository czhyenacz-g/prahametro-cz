export type GeolocationStatus =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "success"; lat: number; lon: number; accuracyMeters: number }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "timeout" }
  | { kind: "unsupported" };

export type GeolocationErrorKind = "denied" | "unavailable" | "timeout";

/**
 * Čisté mapování `GeolocationPositionError.code` na náš stav — oddělené
 * od `useGeolocation.ts` (ten používá browser API), aby šlo testovat bez
 * DOM/navigator mocku. Kódy dle W3C Geolocation API: 1=PERMISSION_DENIED,
 * 2=POSITION_UNAVAILABLE, 3=TIMEOUT.
 */
export function mapGeolocationErrorCode(code: number): GeolocationErrorKind {
  switch (code) {
    case 1:
      return "denied";
    case 3:
      return "timeout";
    default:
      return "unavailable";
  }
}
