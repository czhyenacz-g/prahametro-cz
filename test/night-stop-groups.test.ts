import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getStopGroupKey } from "../lib/night-transport/stop-groups.ts";

describe("getStopGroupKey", () => {
  test("6. dvě nástupiště se stejným parent_station patří do stejné skupiny", () => {
    const a = getStopGroupKey({ stop_id: "S1", parent_station: "P1", asw_node_id: "" });
    const b = getStopGroupKey({ stop_id: "S2", parent_station: "P1", asw_node_id: "999" });
    assert.equal(a, b);
  });

  test("6. bez parent_station spadne na asw_node_id (případ 'Lazarská' — 4 nástupiště, žádné parent_station)", () => {
    const a = getStopGroupKey({ stop_id: "U997Z1P", parent_station: "", asw_node_id: "997" });
    const b = getStopGroupKey({ stop_id: "U997Z2P", parent_station: "", asw_node_id: "997" });
    assert.equal(a, b);
  });

  test("parent_station má přednost před asw_node_id, i kdyby se asw_node_id lišilo", () => {
    const a = getStopGroupKey({ stop_id: "S1", parent_station: "P1", asw_node_id: "111" });
    const b = getStopGroupKey({ stop_id: "S2", parent_station: "P1", asw_node_id: "222" });
    assert.equal(a, b);
  });

  test("bez parent_station i asw_node_id se zachová jako samostatná zastávka (fallback na vlastní stop_id)", () => {
    const a = getStopGroupKey({ stop_id: "T53041", parent_station: "", asw_node_id: "" });
    const b = getStopGroupKey({ stop_id: "T53047", parent_station: "", asw_node_id: "" });
    assert.notEqual(a, b);
  });

  test("různý asw_node_id (různá fyzická místa) → různé skupiny", () => {
    const a = getStopGroupKey({ stop_id: "S1", parent_station: "", asw_node_id: "111" });
    const b = getStopGroupKey({ stop_id: "S2", parent_station: "", asw_node_id: "222" });
    assert.notEqual(a, b);
  });
});
