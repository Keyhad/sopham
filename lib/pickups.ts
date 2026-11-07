export const OFFICIAL_URL =
  "https://www.stockholmvattenochavfall.se/villa-och-radhus/avfallstjanster/nar-kommer-sopbilen";

export type Pickup = {
  group: string;
  date: string;
  frequency: string;
};

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

export async function fetchPickups(address: string, signal: AbortSignal): Promise<Pickup[]> {
  const url = new URL(`${OFFICIAL_URL}/Search`);
  url.searchParams.set("address", address);
  const response = await fetch(url, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Datakällan svarade inte.");
  return parsePickups(await response.json());
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

export function createCalendar(pickups: Pickup[], source: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sopham//Sophämtning//SV",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const pickup of pickups) {
    if (!validDate(pickup.date)) throw new Error("Ogiltigt kalenderdatum.");
    const end = new Date(`${pickup.date}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    lines.push("BEGIN:VEVENT", `UID:${crypto.randomUUID()}@sopham`,
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
