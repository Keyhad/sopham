import test from "node:test";
import assert from "node:assert/strict";
import { createCalendar, fetchPickups, parsePickups, validDate, stockholmToday } from "../lib/pickups.ts";

test("validates calendar dates without rolling invalid dates forward", () => {
  assert.equal(validDate("2028-02-29"), true);
  for (const date of ["2026-02-29", "2026-13-01", "tomorrow", "2026-04-31"]) {
    assert.equal(validDate(date), false);
  }
  assert.match(stockholmToday(), /^\d{4}-\d{2}-\d{2}$/);
});

test("normalizes known source formats and sorts next pickups only", () => {
  assert.deepEqual(parsePickups([
    { Group: "Matavfall", ExecutionDate: "2026-12-10", FetchFrequency: "Varje vecka" },
    { group: "Restavfall", executionDate: "2026-12-02" },
  ]), [
    { group: "Restavfall", date: "2026-12-02", frequency: "" },
    { group: "Matavfall", date: "2026-12-10", frequency: "Varje vecka" },
  ]);
  assert.deepEqual(parsePickups([]), []);
  for (const data of [null, {}, [null], [{ group: "Mat", executionDate: "2026-02-30" }]]) {
    assert.throws(() => parsePickups(data));
  }
});

test("fetches encoded address without credentials and rejects HTTP failures", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.searchParams.get("address"), "Testvägen 1 & 2, Bromma");
    assert.equal(url.hostname, "www.stockholmvattenochavfall.se");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    return { ok: true, json: async () => [] };
  });
  assert.deepEqual(await fetchPickups("Testvägen 1 & 2, Bromma", new AbortController().signal), []);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false }));
  await assert.rejects(fetchPickups("Testvägen", new AbortController().signal));
});

test("exports non-recurring all-day events with escaped, folded lines and reminders", () => {
  const calendar = createCalendar([{ group: "Mat, plast;\nBEGIN:VEVENT " + "å".repeat(90), date: "2026-12-31", frequency: "Varje vecka" }], "Eget datum");
  assert.ok(calendar.includes("DTSTART;VALUE=DATE:20261231\r\n"));
  assert.ok(calendar.includes("DTEND;VALUE=DATE:20270101\r\n"));
  assert.ok(calendar.includes("TRIGGER:-PT12H"));
  assert.ok(calendar.includes("Mat\\, plast\\;\\nBEGIN:VEVENT"));
  assert.equal(calendar.match(/^BEGIN:VEVENT$/gm)?.length, 1);
  assert.ok(!calendar.includes("RRULE"));
  assert.ok(calendar.endsWith("END:VCALENDAR\r\n"));
  for (const line of calendar.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
  assert.throws(() => createCalendar([{ group: "Mat", date: "invalid", frequency: "" }], "Test"));
});
