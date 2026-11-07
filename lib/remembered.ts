import { parsePickups, type Pickup } from "./pickups.ts";

export const REMEMBERED_KEY = "sopham.remembered-v1";

export type RememberedPickup = {
  version: 1;
  address: string;
  endpoint: string;
  provider: string;
  checkedAt: string | null;
  pickups: Pickup[];
};

export function readRemembered(storage: Pick<Storage, "getItem">): RememberedPickup | null {
  const raw = storage.getItem(REMEMBERED_KEY);
  if (raw === null) return null;
  if (raw.length > 100000) throw new Error("De sparade uppgifterna är för stora.");
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 ||
      !("address" in data) || typeof data.address !== "string" || !data.address.trim() || data.address.length > 200 ||
      !("endpoint" in data) || typeof data.endpoint !== "string" ||
      !("provider" in data) || typeof data.provider !== "string" ||
      !("checkedAt" in data) || (data.checkedAt !== null && (typeof data.checkedAt !== "string" || !Number.isFinite(Date.parse(data.checkedAt)))) ||
      !("pickups" in data) || !Array.isArray(data.pickups) || data.pickups.length > 100) {
    throw new Error("De sparade uppgifterna kunde inte läsas säkert.");
  }
  const rows = data.pickups.map((row: unknown) => {
    if (!row || typeof row !== "object" || !("date" in row) || !("group" in row) || !("frequency" in row)) {
      throw new Error("De sparade hämtningsuppgifterna är ogiltiga.");
    }
    return { executionDate: row.date, group: row.group, fetchFrequency: row.frequency };
  });
  const pickups = parsePickups(rows);
  if (data.checkedAt === null && pickups.length) throw new Error("Sparade datum saknar kontrolltid.");
  return { version: 1, address: data.address, endpoint: data.endpoint, provider: data.provider, checkedAt: data.checkedAt, pickups };
}

export function saveRemembered(storage: Pick<Storage, "setItem">, data: RememberedPickup): void {
  storage.setItem(REMEMBERED_KEY, JSON.stringify(data));
}

export function forgetRemembered(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(REMEMBERED_KEY);
}
