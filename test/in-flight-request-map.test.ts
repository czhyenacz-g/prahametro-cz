import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { InFlightRequestMap } from "../lib/routing/in-flight-request-map.ts";

describe("InFlightRequestMap — 3. souběžné shodné požadavky sdílejí jeden Promise", () => {
  test("dva souběžné run() se stejným klíčem spustí factory jen jednou", async () => {
    const map = new InFlightRequestMap<number>();
    let factoryCalls = 0;
    const factory = () =>
      new Promise<number>((resolve) => {
        factoryCalls++;
        setTimeout(() => resolve(42), 10);
      });

    const [a, b] = await Promise.all([map.run("key", factory), map.run("key", factory)]);
    assert.equal(factoryCalls, 1);
    assert.equal(a, 42);
    assert.equal(b, 42);
  });

  test("jiný klíč spustí vlastní factory (žádná falešná deduplikace napříč klíči)", async () => {
    const map = new InFlightRequestMap<string>();
    const calls: string[] = [];
    const result = await Promise.all([
      map.run("a", async () => {
        calls.push("a");
        return "A";
      }),
      map.run("b", async () => {
        calls.push("b");
        return "B";
      }),
    ]);
    assert.deepEqual(calls.sort(), ["a", "b"]);
    assert.deepEqual(result, ["A", "B"]);
  });

  test("po dokončení (úspěch) se klíč uklidí — další run() se stejným klíčem spustí NOVOU factory", async () => {
    const map = new InFlightRequestMap<number>();
    let calls = 0;
    const factory = async () => {
      calls++;
      return calls;
    };
    await map.run("key", factory);
    await map.run("key", factory);
    assert.equal(calls, 2);
  });

  test("po dokončení (chyba) se klíč taky uklidí, další run() zkusí znovu", async () => {
    const map = new InFlightRequestMap<number>();
    let calls = 0;
    const failingFactory = async () => {
      calls++;
      throw new Error("boom");
    };
    await assert.rejects(() => map.run("key", failingFactory));
    await assert.rejects(() => map.run("key", failingFactory));
    assert.equal(calls, 2);
  });

  test("souběžné volání se stejným klíčem, kde první selže, druhé dostane STEJNÉ zamítnutí (ne vlastní pokus)", async () => {
    const map = new InFlightRequestMap<number>();
    let calls = 0;
    const factory = () =>
      new Promise<number>((_resolve, reject) => {
        calls++;
        setTimeout(() => reject(new Error("boom")), 10);
      });

    const first = map.run("key", factory);
    const second = map.run("key", factory);
    await assert.rejects(() => first);
    await assert.rejects(() => second);
    assert.equal(calls, 1);
  });
});
