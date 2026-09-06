import { WALKING_MATRIX_COOLDOWN_MS } from "./constants.ts";

export type MatrixFailureKind = "circuit-breaker" | "cooldown" | "transient";

/**
 * Mapy.com nemá zdokumentovaný jediný status kód pro "došly kredity"
 * (ověřeno — jejich dokumentace jen říká, že po vyčerpání bezplatných
 * kreditů "se spotřeba zastaví do konce měsíce", bez konkrétního HTTP
 * kódu). Proto se místo spoléhání na jeden status kód rozlišují dvě
 * TŘÍDY chyb (viz zadání bod 7):
 *
 * - 401/402/403 — autorizační/kreditová chyba (401/403 jsou navíc
 *   zdokumentované v OpenAPI specu matrix-m endpointu, 402 je
 *   standardní "Payment Required" pro případ, že by ho Mapy.com někdy
 *   použilo) — appka další požadavky přestane posílat úplně (circuit
 *   breaker, do konce načtení stránky).
 * - 429 nebo 5xx — dočasné přetížení/výpadek — appka počká cooldown
 *   (viz WALKING_MATRIX_COOLDOWN_MS), pak to zkusí znovu.
 *
 * Cokoliv jiné (timeout/abort bez status kódu, nevalidní odpověď,
 * síťová chyba) je `"transient"` — nepůsobí na breaker/cooldown, jen
 * tenhle JEDEN request skončí fallbackem.
 */
export function classifyMatrixFailure(status: number | undefined): MatrixFailureKind {
  if (status === 401 || status === 402 || status === 403) return "circuit-breaker";
  if (status === 429 || (status !== undefined && status >= 500)) return "cooldown";
  return "transient";
}

/**
 * Stavový (ne čistě funkcionální) in-memory guard — jedna instance na
 * běžící stránku (viz `matrixCircuitBreaker` export níže), reset jen
 * při reloadu (nikde se nic nepersistuje). Testy si vytvářejí VLASTNÍ
 * instance, ať se navzájem neovlivňují.
 */
export class MatrixCircuitBreaker {
  private breakerOpen = false;
  private cooldownUntil: number | null = null;

  canRequest(now: number): boolean {
    if (this.breakerOpen) return false;
    if (this.cooldownUntil !== null && now < this.cooldownUntil) return false;
    return true;
  }

  recordFailure(status: number | undefined, now: number): void {
    const kind = classifyMatrixFailure(status);
    if (kind === "circuit-breaker") {
      this.breakerOpen = true;
    } else if (kind === "cooldown") {
      this.cooldownUntil = now + WALKING_MATRIX_COOLDOWN_MS;
    }
    // "transient" cíleně nic nemění — jen tenhle request skončí fallbackem.
  }
}

export const matrixCircuitBreaker = new MatrixCircuitBreaker();
