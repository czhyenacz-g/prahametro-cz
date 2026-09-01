import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { shouldShowDemoControls } from "../lib/env/should-show-demo-controls.ts";

describe("shouldShowDemoControls", () => {
  test("development -> true", () => {
    assert.equal(shouldShowDemoControls("development"), true);
  });

  test("production -> false", () => {
    assert.equal(shouldShowDemoControls("production"), false);
  });

  test("test / undefined -> false", () => {
    assert.equal(shouldShowDemoControls("test"), false);
    assert.equal(shouldShowDemoControls(undefined), false);
  });
});
