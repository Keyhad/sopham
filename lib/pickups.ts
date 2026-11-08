import brand from "../docs/branding/brand.json" with { type: "json" };

export const OFFICIAL_URL =
  "https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen";

export type Pickup = {
  group: string;
  date: string;
  frequency: string;
};

export function lookupAvailable(): boolean {
  return true || Boolean(process.env.NEXT_PUBLIC_PICKUP_WORKER_URL);
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function stockholmToday(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function parsePickups(data: unknown): Pickup[] {
  if (!Array.isArray(data)) throw new Error("Oväntat svar från datakällan.");
  const pickups = data.map((row: unknown) => {
    if (!row || typeof row !== "object") throw new Error("Ogiltiga hämtningsuppgifter.");
    const record = row as Record<string, unknown>;
    const group = record.group ?? record.Group;
    const date = record.executionDate ?? record.ExecutionDate;
    const frequency = record.fetchFrequency ?? record.FetchFrequency ?? "";
    if (typeof group !== "string" || !group.trim() || group.length > 300 ||
        typeof date !== "string" || !validDate(date) || typeof frequency !== "string") {
      throw new Error("Hämtningsuppgifterna kunde inte tolkas säkert.");
    }
    return { group, date, frequency };
  });
  return pickups.sort((a, b) => a.date.localeCompare(b.date));
}

export class BackendError extends Error {}

export async function postLookup(body: { address: string } | { query: string }, signal: AbortSignal): Promise<unknown> {
  const endpoint = process.env.NEXT_PUBLIC_PICKUP_WORKER_URL;
  if (!endpoint) throw new BackendError("Adressökningen är avstängd i väntan på tillstånd från SVOA.");
  const sameOrigin = endpoint.startsWith("/") && !endpoint.startsWith("//");
  const url = new URL(endpoint, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && (sameOrigin || ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new BackendError("Adressökningen kräver en säker backendadress.");
  }
  if ("query" in body) {
    if (!url.pathname.endsWith("/pickups")) throw new BackendError("Backendadressen måste sluta med /pickups för att hitta adressförslag.");
    url.pathname = url.pathname.replace(/\/pickups$/, "/addresses");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Kontrollera gatuadressen och skriv minst tre tecken för adressförslag.",
      403: "Denna webbplats är inte tillåten av backend. Kontakta den som driver Sopham.",
      422: "Gatuförkortningen matchar flera gator. Skriv mer av gatunamnet och försök igen.",
      429: "För många sökningar. Vänta en minut och försök igen.",
      502: "SVOA kunde inte lämna läsbara uppgifter. Använd Hitta rätt adress och välj den fullständiga adressen.",
      503: "Adressökningens backend är avstängd eller inte tillgänglig just nu.",
      504: "SVOA svarade inte i tid. Försök igen.",
    };
    throw new BackendError(messages[response.status] || "Datakällan svarade inte. Försök igen eller sök direkt hos SVOA.");
  }
  return response.json();
}

export async function fetchPickups(address: string, signal: AbortSignal): Promise<Pickup[]> {
  return parsePickups(await postLookup({ address }, signal));
}

function escapeCalendar(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n|\r/g, "\\n")
    .replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  const chunks: string[] = [];
  let chunk = "";
  let bytes = 0;
  for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (bytes + size > 75) {
      chunks.push(chunk);
      chunk = " ";
      bytes = 1;
    }
    chunk += character;
    bytes += size;
  }
  chunks.push(chunk);
  return chunks.join("\r\n");
}

function calendarId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function createCalendar(pickups: Pickup[], source: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:${escapeCalendar(brand.calendarProductId)}`,
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const pickup of pickups) {
    if (!validDate(pickup.date)) throw new Error("Ogiltigt kalenderdatum.");
    const end = new Date(`${pickup.date}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    lines.push("BEGIN:VEVENT", `UID:${calendarId()}@${brand.calendarUidDomain}`,
      `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${pickup.date.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replaceAll("-", "")}`,
      `SUMMARY:${escapeCalendar(`Sophämtning: ${pickup.group}`)}`,
      `DESCRIPTION:${escapeCalendar(`${source}. Kontrollera datum hos Stockholm Vatten och Avfall. Gör kärlet redo kvällen före.`)}`,
      "BEGIN:VALARM", "TRIGGER:-PT12H", "ACTION:DISPLAY",
      "DESCRIPTION:Gör kärlet redo inför sophämtningen", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
