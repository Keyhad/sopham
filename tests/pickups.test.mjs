import test from "node:test";
import assert from "node:assert/strict";
import { createCalendar, fetchPickups, lookupAvailable, parsePickups, validDate, stockholmToday } from "../lib/pickups.ts";

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

test("sends addresses only in a POST body to the configured backend", async (t) => {
  const original = process.env.NEXT_PUBLIC_PICKUP_WORKER_URL;
  t.after(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_PICKUP_WORKER_URL;
    else process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = original;
  });
  delete process.env.NEXT_PUBLIC_PICKUP_WORKER_URL;
  assert.equal(lookupAvailable(), false);
  await assert.rejects(fetchPickups("Testvägen", new AbortController().signal), /avstängd/);
  process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = "https://sopham-pickups.example.workers.dev/pickups";
  assert.equal(lookupAvailable(), true);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.search, "");
    assert.equal(url.hostname, "sopham-pickups.example.workers.dev");
    assert.equal(options.method, "POST");
    assert.equal(JSON.parse(options.body).address, "Testvägen 1 & 2, Bromma");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    return { ok: true, json: async () => [] };
  });
  assert.deepEqual(await fetchPickups("Testvägen 1 & 2, Bromma", new AbortController().signal), []);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false }));
  await assert.rejects(fetchPickups("Testvägen", new AbortController().signal));
  process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = "http://example.com/pickups";
  await assert.rejects(fetchPickups("Testvägen", new AbortController().signal), /säker/);
  process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = "/pickups";
  t.mock.method(globalThis, "fetch", async url => {
    assert.equal(url.pathname, "/pickups");
    return { ok: true, json: async () => [] };
  });
  assert.deepEqual(await fetchPickups("Testvägen", new AbortController().signal), []);
  process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = "//example.com/pickups";
  await assert.rejects(fetchPickups("Testvägen", new AbortController().signal), /säker/);
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

test("calendar export works without secure-context randomUUID using cryptographic random bytes", () => {
  const original = crypto.randomUUID;
  try {
    crypto.randomUUID = undefined;
    const pickup = [{ group: "Matavfall", date: "2026-12-31", frequency: "" }];
    const first = createCalendar(pickup, "Eget datum").match(/^UID:([0-9a-f]{32})@sopham$/m)?.[1];
    const second = createCalendar(pickup, "Eget datum").match(/^UID:([0-9a-f]{32})@sopham$/m)?.[1];
    assert.ok(first);
    assert.ok(second);
    assert.notEqual(first, second);
  } finally {
    crypto.randomUUID = original;
  }
});
