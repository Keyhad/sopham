import test from "node:test";
import assert from "node:assert/strict";
import { demoPickups, DEMO_SOURCE, DEMO_FILENAME } from "../lib/demo.ts";
import { createCalendar, stockholmToday, validDate } from "../lib/pickups.ts";

test("demo produces future, labelled sample data without network requests", async t => {
  t.mock.method(globalThis, "fetch", () => { assert.fail("Demo must not fetch"); });
  const results = await demoPickups(new AbortController().signal);
  assert.equal(results.length, 2);
  for (const pickup of results) {
    assert.ok(validDate(pickup.date));
    assert.ok(pickup.date > stockholmToday());
    assert.match(pickup.group, /^DEMO/);
    assert.match(pickup.frequency, /inte ett verkligt/);
  }
  const calendar = createCalendar(results, DEMO_SOURCE);
  assert.match(calendar, /SUMMARY:.*DEMO/);
  assert.match(calendar, /DESCRIPTION:DEMO/);
  assert.equal(DEMO_FILENAME, "sopham-demo.ics");
});

test("demo handles cancellation before and during simulated loading", async () => {
  const before = new AbortController();
  before.abort();
  await assert.rejects(demoPickups(before.signal), { name: "AbortError" });
  const during = new AbortController();
  const pending = demoPickups(during.signal);
  during.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
