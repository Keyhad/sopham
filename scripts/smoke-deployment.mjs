function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchExpectedStatus(url, options, expectedStatus, label) {
  let lastFailure = "no response";
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
      if (response.status === expectedStatus) return response;
      const body = await response.text();
      lastFailure = `HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }
    if (attempt < 5) await delay(2000);
  }
  throw new Error(`${label} smoke check expected HTTP ${expectedStatus}; last result: ${lastFailure}`);
}

const pageUrl = new URL(required("SMOKE_PAGE_URL"));
const workerUrl = new URL(required("NEXT_PUBLIC_PICKUP_WORKER_URL"));
const allowedOrigin = required("SMOKE_ALLOWED_ORIGIN");

if (pageUrl.protocol !== "https:" || workerUrl.protocol !== "https:") {
  throw new Error("Smoke-test URLs must use HTTPS.");
}
if (workerUrl.pathname !== "/pickups" || workerUrl.search || workerUrl.hash) {
  throw new Error("NEXT_PUBLIC_PICKUP_WORKER_URL must be the Worker HTTPS URL ending in /pickups.");
}

const pageResponse = await fetchExpectedStatus(pageUrl, {}, 200, "GitHub Pages");
const pageHtml = await pageResponse.text();
const addressInput = pageHtml.match(/<input\b[^>]*\bid="address"[^>]*>/);
const pageProblems = [];

if (!pageHtml.includes("<title>Sopham")) pageProblems.push("the Sopham page title is missing");
if (!addressInput) pageProblems.push("the address input is missing");
else if (/\sdisabled(?:\s|=|>)/.test(addressInput[0])) pageProblems.push("the address input is disabled");
if (!pageHtml.includes("Adressökningen går via Sophams backend")) {
  pageProblems.push("the page was built without its Worker URL");
}
if (pageProblems.length) {
  throw new Error(`GitHub Pages smoke check failed: ${pageProblems.join("; ")}.`);
}
console.log(`GitHub Pages smoke check passed: ${pageUrl}`);

const workerResponse = await fetchExpectedStatus(workerUrl, {
  method: "OPTIONS",
  headers: {
    Origin: allowedOrigin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type",
  },
}, 204, "Worker CORS preflight");

if (workerResponse.headers.get("access-control-allow-origin") !== allowedOrigin ||
    !workerResponse.headers.get("access-control-allow-methods")?.split(",").map(value => value.trim()).includes("POST") ||
    !workerResponse.headers.get("access-control-allow-headers")?.toLowerCase().split(",").map(value => value.trim()).includes("content-type")) {
  throw new Error("Worker smoke check failed: CORS preflight headers do not allow the Sopham site.");
}
console.log(`Worker CORS smoke check passed: ${workerUrl}. No address was submitted.`);
