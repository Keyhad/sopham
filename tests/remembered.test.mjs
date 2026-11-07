import test from "node:test";
import assert from "node:assert/strict";
import { REMEMBERED_KEY, readRemembered, saveRemembered, forgetRemembered } from "../lib/remembered.ts";

const snapshot = {
  version: 1, address: "Exempelgatan 12, Stockholm", endpoint: "/pickups", provider: "lokal testserver",
  checkedAt: "2026-11-07T12:00:00.000Z",
  pickups: [{ date: "2026-11-13", group: "Glas och metall", frequency: "Varannan vecka" }],
};

test("opt-in snapshot roundtrips and forgetting removes only Sopham's key", () => {
  const values = new Map([["other-app", "keep"]]);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  assert.equal(readRemembered(storage), null);
  saveRemembered(storage, snapshot);
  assert.deepEqual(readRemembered(storage), snapshot);
  forgetRemembered(storage);
  assert.equal(values.has(REMEMBERED_KEY), false);
  assert.equal(values.get("other-app"), "keep");
});

test("invalid or corrupt persisted data is rejected instead of authorising a request", () => {
  for (const data of [
    "broken json", "null", JSON.stringify({ ...snapshot, version: 2 }),
    JSON.stringify({ ...snapshot, address: "" }),
    JSON.stringify({ ...snapshot, checkedAt: "invalid" }),
    JSON.stringify({ ...snapshot, checkedAt: null }),
    JSON.stringify({ ...snapshot, pickups: [{ date: "2026-02-30", group: "Glas", frequency: "" }] }),
    JSON.stringify({ ...snapshot, pickups: [null] }),
    "x".repeat(100001),
  ]) {
    assert.throws(() => readRemembered({ getItem: () => data }));
  }
});

test("blocked storage operations surface errors to their caller", () => {
  const blocked = () => { throw new Error("Storage blocked"); };
  assert.throws(() => readRemembered({ getItem: blocked }), /Storage blocked/);
  assert.throws(() => saveRemembered({ setItem: blocked }, snapshot), /Storage blocked/);
  assert.throws(() => forgetRemembered({ removeItem: blocked }), /Storage blocked/);
});
