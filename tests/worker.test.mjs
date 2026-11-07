import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.ts";

const origin = "https://keyhad.github.io";
const environment = () => ({
  ALLOWED_ORIGIN: origin,
  SVOA_ACCESS_APPROVED: "true",
  RATE_LIMITER: { limit: async () => ({ success: true }) },
});
const request = (body = JSON.stringify({ address: "Testgatan 12, Stockholm" }), options = {}) => new Request("https://worker.example/pickups", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" },
  body,
  ...options,
});

test("Worker enforces permission, origin, method, route and preflight without contacting SVOA", async t => {
  t.mock.method(globalThis, "fetch", async () => { assert.fail("Unexpected upstream request"); });
  assert.equal((await worker.fetch(request(), { ...environment(), SVOA_ACCESS_APPROVED: "false" })).status, 503);
  assert.equal((await worker.fetch(request("", { headers: { Origin: "https://other.example" } }), environment())).status, 403);
  assert.equal((await worker.fetch(request(null, { method: "GET" }), environment())).status, 405);
  assert.equal((await worker.fetch(new Request("https://worker.example/other", { headers: { Origin: origin } }), environment())).status, 404);
  const preflight = new Request("https://worker.example/pickups", {
    method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
  });
  const response = await worker.fetch(preflight, environment());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
});

test("Worker rejects invalid, oversized and rate-limited requests without upstream fetch", async t => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => { assert.fail("Unexpected upstream request"); });
  for (const body of ["{", "null", '{"address":""}', '{"address":22}', JSON.stringify({ address: "x".repeat(201) }), JSON.stringify({ address: "a\nb" })]) {
    assert.equal((await worker.fetch(request(body), environment())).status, 400);
  }
  assert.equal((await worker.fetch(request("x".repeat(2049)), environment())).status, 413);
  assert.equal((await worker.fetch(request("{}", { headers: { Origin: origin, "Content-Type": "text/plain" } }), environment())).status, 415);
  const limited = await worker.fetch(request(), { ...environment(), RATE_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  assert.equal((await worker.fetch(request(), { ...environment(), RATE_LIMITER: undefined })).status, 503);
});

test("Worker uses fixed upstream URL and returns only validated pickup fields", async t => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.hostname, "www.stockholmvattenochavfall.se");
    assert.equal(url.searchParams.get("address"), "Testgatan 12, Stockholm");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([{ group: "Matavfall", executionDate: "2026-12-31", fetchFrequency: "Varje vecka", extra: "not forwarded" }]);
  });
  const response = await worker.fetch(request(), environment());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.deepEqual(await response.json(), [{ group: "Matavfall", executionDate: "2026-12-31", fetchFrequency: "Varje vecka" }]);
});

test("Worker surfaces upstream errors without logging personal data", async t => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  for (const upstream of [
    new Response("Unavailable", { status: 500 }),
    new Response("<html>not data</html>", { headers: { "Content-Type": "text/html" } }),
    Response.json([{ group: "Matavfall", executionDate: "invalid" }]),
    new Response("x".repeat(65537), { headers: { "Content-Type": "application/json" } }),
  ]) {
    t.mock.method(globalThis, "fetch", async () => upstream);
    const response = await worker.fetch(request(), environment());
    assert.equal(response.status, 502);
    assert.ok((await response.json()).error);
  }
  t.mock.method(globalThis, "fetch", async () => { throw new DOMException("private URL", "TimeoutError"); });
  assert.equal((await worker.fetch(request(), environment())).status, 504);
  assert.ok(!JSON.stringify(logs).includes("Testgatan"));
  assert.ok(!JSON.stringify(logs).includes("192.0.2.1"));
  assert.ok(!JSON.stringify(logs).includes("private URL"));
});
