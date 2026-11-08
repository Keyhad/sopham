import { postLookup } from "./pickups.ts";

export type AddressSuggestion = { value: string };

export function parseAddresses(data: unknown): AddressSuggestion[] {
  if (!Array.isArray(data) || data.length > 100) throw new Error("Oväntade adressförslag från datakällan.");
  const addresses = data.map((row: unknown) => {
    if (!row || typeof row !== "object" || !("value" in row) ||
        typeof row.value !== "string" || !row.value.trim() || row.value.length > 200 ||
        /[\u0000-\u001f\u007f]/.test(row.value)) {
      throw new Error("Adressförslagen kunde inte tolkas säkert.");
    }
    return { value: row.value.trim() };
  });
  return [...new Map(addresses.map(address => [address.value, address])).values()];
}

export async function fetchAddresses(query: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
  return parseAddresses(await postLookup({ query }, signal));
}
