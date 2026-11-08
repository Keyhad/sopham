import { OFFICIAL_URL, parsePickups } from "../lib/pickups.ts";
import { parseAddresses } from "../lib/addresses.ts";

type Environment = {
  ALLOWED_ORIGIN: string;
  SVOA_ACCESS_APPROVED: string;
  RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
};

class LookupError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function readLimited(body: ReadableStream<Uint8Array> | null, maximum: number): Promise<string> {
  if (!body) throw new LookupError(400, "EMPTY_BODY");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > maximum) {
        await reader.cancel();
        throw new LookupError(413, "BODY_TOO_LARGE");
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function readSource(url: URL, signal: AbortSignal): Promise<unknown> {
  const upstream = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal,
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!upstream.ok || upstream.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    await upstream.body?.cancel();
    throw new LookupError(502, "UPSTREAM_UNAVAILABLE");
  }
  try {
    return JSON.parse(await readLimited(upstream.body, 65536));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof LookupError) throw new LookupError(502, "UPSTREAM_INVALID");
    throw error;
  }
}

async function lookupAddresses(query: string, signal: AbortSignal) {
  const read = async (term: string) => {
    const url = new URL(`${OFFICIAL_URL}/AutoCompleteMe`);
    url.searchParams.set("query", term);
    const data = await readSource(url, signal);
    try {
      return parseAddresses(data);
    } catch {
      throw new LookupError(502, "UPSTREAM_INVALID");
    }
  };
  const term = query.split(",")[0].trim();
  if (term.length < 3) throw new LookupError(400, "INVALID_QUERY");
  const exact = await read(term);
  if (exact.length) return exact;
  const house = /^(.*?)\s+(\d+\s*[A-Za-z]?)$/.exec(term);
  if (!house || house[1].length < 3) return [];
  const candidates = await read(house[1]);
  const streets = new Set(candidates.map(candidate => {
    const street = candidate.value.split(",")[0].trim();
    const name = street.replace(/\s+\d+\s*[A-Za-z]?$/, "");
    return name !== street ? name : "";
  }).filter(Boolean));
  if (streets.size > 1) throw new LookupError(422, "AMBIGUOUS_STREET");
  const street = [...streets][0];
  return street ? read(`${street} ${house[2]}`) : [];
}

const worker = {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    });
    const respond = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
    if (!env.ALLOWED_ORIGIN || request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
      return respond(403, { error: "ORIGIN_NOT_ALLOWED" });
    }
    headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN);
    const route = new URL(request.url).pathname;
    if (!["/pickups", "/addresses"].includes(route)) return respond(404, { error: "NOT_FOUND" });
    if (request.method === "OPTIONS") {
      const requestedHeaders = (request.headers.get("Access-Control-Request-Headers") || "").toLowerCase().split(",").map(value => value.trim()).filter(Boolean);
      if (request.headers.get("Access-Control-Request-Method") !== "POST" || requestedHeaders.some(value => value !== "content-type")) {
        return respond(403, { error: "PREFLIGHT_NOT_ALLOWED" });
      }
      headers.set("Access-Control-Allow-Methods", "POST");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      headers.set("Allow", "POST, OPTIONS");
      return respond(405, { error: "METHOD_NOT_ALLOWED" });
    }
    if (env.SVOA_ACCESS_APPROVED !== "true") return respond(503, { error: "ACCESS_NOT_APPROVED" });
    if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return respond(415, { error: "JSON_REQUIRED" });
    }
    try {
      const ip = request.headers.get("CF-Connecting-IP");
      if (!ip || !env.RATE_LIMITER) throw new LookupError(503, "RATE_LIMIT_UNAVAILABLE");
      if (!(await env.RATE_LIMITER.limit({ key: ip })).success) {
        headers.set("Retry-After", "60");
        throw new LookupError(429, "RATE_LIMITED");
      }
      let data: unknown;
      try {
        data = JSON.parse(await readLimited(request.body, 2048));
      } catch (error) {
        if (error instanceof SyntaxError) throw new LookupError(400, "INVALID_JSON");
        throw error;
      }
      const field = route === "/addresses" ? "query" : "address";
      const text = data && typeof data === "object" ? (data as Record<string, unknown>)[field] : undefined;
      if (typeof text !== "string" || text.trim().length < (field === "query" ? 3 : 1) ||
          text.length > 200 || /[\u0000-\u001f\u007f]/.test(text)) {
        throw new LookupError(400, field === "query" ? "INVALID_QUERY" : "INVALID_ADDRESS");
      }
      const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)]);
      if (route === "/addresses") return respond(200, await lookupAddresses(text.trim(), signal));
      const url = new URL(`${OFFICIAL_URL}/Search`);
      url.searchParams.set("address", text.trim());
      const rows = await readSource(url, signal);
      let pickups: ReturnType<typeof parsePickups>;
      try {
        pickups = parsePickups(rows);
      } catch {
        throw new LookupError(502, "UPSTREAM_INVALID");
      }
      return respond(200, pickups.map(pickup => ({
        group: pickup.group, executionDate: pickup.date, fetchFrequency: pickup.frequency,
      })));
    } catch (error) {
      const status = error instanceof LookupError ? error.status : error instanceof Error && error.name === "TimeoutError" ? 504 : 502;
      const code = error instanceof LookupError ? error.code : status === 504 ? "UPSTREAM_TIMEOUT" : "LOOKUP_FAILED";
      // Never log request bodies, addresses, IPs or upstream URLs.
      console.error("Pickup lookup rejected", { status, code });
      return respond(status, { error: code });
    }
  },
};

export default worker;
