import test from "node:test";
import assert from "node:assert/strict";
import { fetchAddresses, parseAddresses } from "../lib/addresses.ts";

test("official address suggestions are validated, deduplicated and stripped of unrelated fields", () => {
  assert.deepEqual(parseAddresses([
    { value: " Testvägen 12, Exempelort, 123 45 ", data: "123 45", extra: "not forwarded" },
    { value: "Testvägen 12, Exempelort, 123 45" },
  ]), [{ value: "Testvägen 12, Exempelort, 123 45" }]);
  assert.deepEqual(parseAddresses([]), []);
  for (const data of [{}, [null], [{ value: "" }], [{ value: "a\nb" }], [{ value: "a".repeat(201) }], Array(101).fill({ value: "Test" })]) {
    assert.throws(() => parseAddresses(data));
  }
});

test("address suggestions use the sibling backend route, POST body, cancellation and explicit errors", async t => {
  const original = process.env.NEXT_PUBLIC_PICKUP_WORKER_URL;
  t.after(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_PICKUP_WORKER_URL;
    else process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = original;
  });
  process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = "/pickups";
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.pathname, "/addresses");
    assert.equal(url.search, "");
    assert.equal(options.signal, signal);
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { query: "Testv 12" });
    assert.equal(options.credentials, "omit");
    return Response.json([{ value: "Testvägen 12, Exempelort, 123 45" }]);
  });
  assert.deepEqual(await fetchAddresses("Testv 12", signal), [{ value: "Testvägen 12, Exempelort, 123 45" }]);
  process.env.NEXT_PUBLIC_PICKUP_WORKER_URL = "https://backend.example/api/pickups";
  t.mock.method(globalThis, "fetch", async url => {
    assert.equal(url.pathname, "/api/addresses");
    return new Response("", { status: 429 });
  });
  await assert.rejects(fetchAddresses("Test", signal), /Vänta en minut/);
});
