import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getBrowserSessionStorage, safeGet, safeRemove, safeSet, type StorageLike } from "../lib/storage/safe-storage.ts";

function throwingStorage(): StorageLike {
  return {
    getItem() {
      throw new Error("SecurityError: localStorage zakázán (private mode)");
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
    removeItem() {
      throw new Error("SecurityError");
    },
  };
}

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe("safeGet", () => {
  test("bez storage (null) vrátí null, nespadne", () => {
    assert.equal(safeGet(null, "x"), null);
    assert.equal(safeGet(undefined, "x"), null);
  });

  test("storage, který při čtení vyhodí výjimku -> null, nespadne", () => {
    assert.doesNotThrow(() => safeGet(throwingStorage(), "x"));
    assert.equal(safeGet(throwingStorage(), "x"), null);
  });

  test("funkční storage vrátí uloženou hodnotu", () => {
    const storage = memoryStorage();
    storage.setItem("key", "value");
    assert.equal(safeGet(storage, "key"), "value");
  });

  test("chybějící klíč vrátí null", () => {
    assert.equal(safeGet(memoryStorage(), "missing"), null);
  });
});

describe("safeSet", () => {
  test("bez storage (null) nic neudělá, nespadne", () => {
    assert.doesNotThrow(() => safeSet(null, "x", "y"));
  });

  test("storage, který při zápisu vyhodí výjimku, se bezpečně ignoruje", () => {
    assert.doesNotThrow(() => safeSet(throwingStorage(), "x", "y"));
  });

  test("funkční storage uloží hodnotu, kterou pak safeGet přečte", () => {
    const storage = memoryStorage();
    safeSet(storage, "key", "value");
    assert.equal(safeGet(storage, "key"), "value");
  });
});

describe("safeRemove", () => {
  test("bez storage (null) nic neudělá, nespadne", () => {
    assert.doesNotThrow(() => safeRemove(null, "x"));
    assert.doesNotThrow(() => safeRemove(undefined, "x"));
  });

  test("storage, který při odstranění vyhodí výjimku, se bezpečně ignoruje", () => {
    assert.doesNotThrow(() => safeRemove(throwingStorage(), "x"));
  });

  test("mock bez removeItem se bezpečně přeskočí, nespadne", () => {
    const partial: StorageLike = { getItem: () => null, setItem: () => {} };
    assert.doesNotThrow(() => safeRemove(partial, "x"));
  });

  test("28. funkční storage odstraní uloženou hodnotu — starý neplatný výběr reklamy zmizí (viz hooks/useSelectedAd.ts)", () => {
    const storage = memoryStorage();
    safeSet(storage, "key", "stale-campaign-id");
    safeRemove(storage, "key");
    assert.equal(safeGet(storage, "key"), null);
  });
});

describe("getBrowserSessionStorage", () => {
  test("12. mimo prohlížeč (bez window) bezpečně vrátí null, nespadne — reklama pak jen znovu vybere kampaň", () => {
    assert.doesNotThrow(() => getBrowserSessionStorage());
    assert.equal(getBrowserSessionStorage(), null);
  });
});
