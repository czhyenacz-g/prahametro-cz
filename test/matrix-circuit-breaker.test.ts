import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { classifyMatrixFailure, MatrixCircuitBreaker } from "../lib/routing/matrix-circuit-breaker.ts";
import { WALKING_MATRIX_COOLDOWN_MS } from "../lib/routing/constants.ts";

describe("classifyMatrixFailure — rozlišení tříd chyb", () => {
  test("401, 402 a 403 jsou circuit-breaker (autorizace/kredit)", () => {
    assert.equal(classifyMatrixFailure(401), "circuit-breaker");
    assert.equal(classifyMatrixFailure(402), "circuit-breaker");
    assert.equal(classifyMatrixFailure(403), "circuit-breaker");
  });

  test("429 a libovolné 5xx jsou cooldown", () => {
    assert.equal(classifyMatrixFailure(429), "cooldown");
    assert.equal(classifyMatrixFailure(500), "cooldown");
    assert.equal(classifyMatrixFailure(503), "cooldown");
  });

  test("ostatní (404, 422, undefined - timeout/abort/nevalidní odpověď) jsou transient", () => {
    assert.equal(classifyMatrixFailure(404), "transient");
    assert.equal(classifyMatrixFailure(422), "transient");
    assert.equal(classifyMatrixFailure(undefined), "transient");
  });
});

describe("MatrixCircuitBreaker — 11. čerstvá instance dovolí request", () => {
  test("canRequest je true bez předchozích chyb", () => {
    const breaker = new MatrixCircuitBreaker();
    assert.equal(breaker.canRequest(Date.now()), true);
  });
});

describe("MatrixCircuitBreaker — 12. autorizační/kreditová chyba (401/402/403) otevře breaker natrvalo (do konce načtení stránky)", () => {
  test("po 403 canRequest vrací false i mnohem později", () => {
    const breaker = new MatrixCircuitBreaker();
    const now = Date.now();
    breaker.recordFailure(403, now);
    assert.equal(breaker.canRequest(now), false);
    assert.equal(breaker.canRequest(now + 24 * 60 * 60 * 1000), false, "breaker se sám neresetuje časem");
  });

  test("401 i 402 mají stejný efekt jako 403", () => {
    for (const status of [401, 402]) {
      const breaker = new MatrixCircuitBreaker();
      breaker.recordFailure(status, Date.now());
      assert.equal(breaker.canRequest(Date.now()), false);
    }
  });
});

describe("MatrixCircuitBreaker — 13. 429/5xx nastaví cooldown aspoň na WALKING_MATRIX_COOLDOWN_MS", () => {
  test("po 429 je canRequest false hned po chybě", () => {
    const breaker = new MatrixCircuitBreaker();
    const now = Date.now();
    breaker.recordFailure(429, now);
    assert.equal(breaker.canRequest(now), false);
  });

  test("po uplynutí cooldownu canRequest zase povolí request (na rozdíl od breakeru)", () => {
    const breaker = new MatrixCircuitBreaker();
    const now = Date.now();
    breaker.recordFailure(503, now);
    assert.equal(breaker.canRequest(now + WALKING_MATRIX_COOLDOWN_MS - 1), false);
    assert.equal(breaker.canRequest(now + WALKING_MATRIX_COOLDOWN_MS + 1), true);
  });
});

describe("MatrixCircuitBreaker — 14. transient chyba nemění stav (žádný breaker, žádný cooldown)", () => {
  test("timeout/abort (status undefined) nezablokuje další request", () => {
    const breaker = new MatrixCircuitBreaker();
    const now = Date.now();
    breaker.recordFailure(undefined, now);
    assert.equal(breaker.canRequest(now), true);
  });

  test("404/422 nezablokuje další request", () => {
    const breaker = new MatrixCircuitBreaker();
    breaker.recordFailure(422, Date.now());
    assert.equal(breaker.canRequest(Date.now()), true);
  });
});

describe("MatrixCircuitBreaker — instance jsou nezávislé (žádný sdílený modulový stav mezi testy)", () => {
  test("otevření jedné instance neovlivní druhou", () => {
    const a = new MatrixCircuitBreaker();
    const b = new MatrixCircuitBreaker();
    a.recordFailure(403, Date.now());
    assert.equal(a.canRequest(Date.now()), false);
    assert.equal(b.canRequest(Date.now()), true);
  });
});
