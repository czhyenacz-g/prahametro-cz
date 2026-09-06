import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchWalkingMatrix, MapyRoutingError, type WalkingDestination } from "../lib/routing/mapy-walking-matrix.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(handler: (url: URL, init: RequestInit) => Promise<Response> | Response) {
  let capturedUrl: URL | null = null;
  let capturedInit: RequestInit | null = null;
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    capturedUrl = new URL(input as string | URL);
    capturedInit = init ?? {};
    return handler(capturedUrl, capturedInit);
  }) as typeof fetch;
  return {
    get url() {
      return capturedUrl!;
    },
    get init() {
      return capturedInit!;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const origin = { lat: 50.0811, lon: 14.4207 };
const destinations: WalkingDestination[] = [
  { entranceId: "e1", coordinates: { lat: 50.083, lon: 14.421 } },
  { entranceId: "e2", coordinates: { lat: 50.084, lon: 14.422 } },
];

describe("fetchWalkingMatrix — 9./10./11. sestavení requestu", () => {
  test("9. jeden origin (starts) a správný počet destinations (ends)", async () => {
    const captured = mockFetch(() => jsonResponse({ matrix: [[{ length: 100, duration: 90 }, { length: 200, duration: 150 }]] }));
    await fetchWalkingMatrix(origin, destinations, { apiKey: "test-key", timeoutMs: 1000 });
    assert.equal(captured.url.searchParams.getAll("starts").length, 1);
    assert.equal(captured.url.searchParams.getAll("ends").length, 2);
  });

  test("10. používá routeType=foot_fast (pěší rychlý režim)", async () => {
    const captured = mockFetch(() => jsonResponse({ matrix: [[{ length: 100, duration: 90 }, { length: 200, duration: 150 }]] }));
    await fetchWalkingMatrix(origin, destinations, { apiKey: "test-key", timeoutMs: 1000 });
    assert.equal(captured.url.searchParams.get("routeType"), "foot_fast");
  });

  test("11. souřadnice v pořadí lon,lat (Mapy.com), ne lat,lon", async () => {
    const captured = mockFetch(() => jsonResponse({ matrix: [[{ length: 100, duration: 90 }, { length: 200, duration: 150 }]] }));
    await fetchWalkingMatrix(origin, destinations, { apiKey: "test-key", timeoutMs: 1000 });
    assert.equal(captured.url.searchParams.get("starts"), `${origin.lon},${origin.lat}`);
    assert.equal(captured.url.searchParams.getAll("ends")[0], `${destinations[0].coordinates.lon},${destinations[0].coordinates.lat}`);
  });

  test("API klíč se posílá jako query parametr apikey", async () => {
    const captured = mockFetch(() => jsonResponse({ matrix: [[{ length: 100, duration: 90 }, { length: 200, duration: 150 }]] }));
    await fetchWalkingMatrix(origin, destinations, { apiKey: "my-secret-key", timeoutMs: 1000 });
    assert.equal(captured.url.searchParams.get("apikey"), "my-secret-key");
  });
});

describe("fetchWalkingMatrix — 12./13. runtime validace a mapování odpovědi", () => {
  test("12. nevalidní odpověď (chybí matrix) vyhodí MapyRoutingError", async () => {
    mockFetch(() => jsonResponse({ nonsense: true }));
    await assert.rejects(() => fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 1000 }), MapyRoutingError);
  });

  test("13. výsledky se mapují zpět na entranceId podle pořadí destinations, ne podle libovolného předpokladu", async () => {
    mockFetch(() => jsonResponse({ matrix: [[{ length: 111, duration: 99 }, { length: 222, duration: 199 }]] }));
    const result = await fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 1000 });
    assert.deepEqual(result, [
      { entranceId: "e1", distanceMeters: 111, durationSeconds: 99 },
      { entranceId: "e2", distanceMeters: 222, durationSeconds: 199 },
    ]);
  });
});

describe("fetchWalkingMatrix — 14./15./16. částečně nedostupná/neplatná trasa", () => {
  test("14. jeden cíl bez dat (chybějící buňka) se vyřadí, zbytek zůstane", async () => {
    mockFetch(() => jsonResponse({ matrix: [[{ length: 111, duration: 99 }]] })); // druhá buňka chybí
    const result = await fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 1000 });
    assert.deepEqual(result, [{ entranceId: "e1", distanceMeters: 111, durationSeconds: 99 }]);
  });

  test("15. záporná vzdálenost (chybový kód Mapy.com) se vyřadí", async () => {
    mockFetch(() => jsonResponse({ matrix: [[{ length: -3, duration: -3 }, { length: 222, duration: 199 }]] }));
    const result = await fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 1000 });
    assert.deepEqual(result, [{ entranceId: "e2", distanceMeters: 222, durationSeconds: 199 }]);
  });

  test("16. záporný čas se vyřadí, i kdyby vzdálenost byla platná", async () => {
    mockFetch(() => jsonResponse({ matrix: [[{ length: 111, duration: -1 }, { length: 222, duration: 199 }]] }));
    const result = await fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 1000 });
    assert.deepEqual(result, [{ entranceId: "e2", distanceMeters: 222, durationSeconds: 199 }]);
  });
});

describe("fetchWalkingMatrix — 17./18. timeout a abort", () => {
  function hangingFetch(_url: URL, init: RequestInit): Promise<Response> {
    return new Promise((_resolve, reject) => {
      const signal = init.signal!;
      const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort);
    });
  }

  test("17. timeout vyhodí MapyRoutingError místo věčného čekání", async () => {
    mockFetch(hangingFetch);
    await assert.rejects(() => fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 20 }), MapyRoutingError);
  });

  test("18. externí AbortSignal zruší request", async () => {
    mockFetch(hangingFetch);
    const controller = new AbortController();
    const promise = fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 5000, signal: controller.signal });
    controller.abort();
    await assert.rejects(() => promise, MapyRoutingError);
  });
});

describe("fetchWalkingMatrix — 19./20. HTTP chyba a chybějící klíč", () => {
  test("19. HTTP chyba (např. 403 kvůli referer restriction) vyhodí MapyRoutingError", async () => {
    mockFetch(() => jsonResponse({ detail: [{ msg: "Forbidden" }] }, 403));
    await assert.rejects(() => fetchWalkingMatrix(origin, destinations, { apiKey: "k", timeoutMs: 1000 }), MapyRoutingError);
  });

  test("20. chybějící API klíč vyhodí MapyRoutingError bez síťového volání", async () => {
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return jsonResponse({ matrix: [] });
    }) as typeof fetch;
    await assert.rejects(() => fetchWalkingMatrix(origin, destinations, { apiKey: "", timeoutMs: 1000 }), MapyRoutingError);
    assert.equal(fetchCalled, false);
  });
});

describe("fetchWalkingMatrix — validace vstupních souřadnic", () => {
  test("NaN v origin se odmítne bez síťového volání", async () => {
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return jsonResponse({ matrix: [] });
    }) as typeof fetch;
    await assert.rejects(() => fetchWalkingMatrix({ lat: NaN, lon: 14.42 }, destinations, { apiKey: "k", timeoutMs: 1000 }), MapyRoutingError);
    assert.equal(fetchCalled, false);
  });

  test("Infinity v cíli se odmítne", async () => {
    await assert.rejects(
      () =>
        fetchWalkingMatrix(origin, [{ entranceId: "bad", coordinates: { lat: Infinity, lon: 14.42 } }], { apiKey: "k", timeoutMs: 1000 }),
      MapyRoutingError
    );
  });

  test("víc než 12 destinations se odmítne", async () => {
    const tooMany: WalkingDestination[] = Array.from({ length: 13 }, (_, i) => ({ entranceId: `e${i}`, coordinates: { lat: 50.08, lon: 14.42 } }));
    await assert.rejects(() => fetchWalkingMatrix(origin, tooMany, { apiKey: "k", timeoutMs: 1000 }), MapyRoutingError);
  });

  test("prázdný seznam destinations vrátí prázdný výsledek bez síťového volání", async () => {
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return jsonResponse({ matrix: [] });
    }) as typeof fetch;
    const result = await fetchWalkingMatrix(origin, [], { apiKey: "k", timeoutMs: 1000 });
    assert.deepEqual(result, []);
    assert.equal(fetchCalled, false);
  });
});
