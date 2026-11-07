import materials from "../docs/branding/icons/materials.json" with { type: "json" };
import { validDate } from "./pickups.ts";

const materialIds = ["paper", "plastic", "glass", "metal", "waste", "food", "package"] as const;
export type MaterialId = typeof materialIds[number];

export function pickupMaterials(group: string): { icon: MaterialId; label: string }[] {
  const text = group.toLocaleLowerCase("sv-SE");
  const specific = materialIds.filter(id => id !== "package" &&
    !(id === "glass" && text.includes("plast") && !text.includes("glas")) &&
    materials[id].terms.some(term => text.includes(term)));
  const matched = specific.length ? specific : materialIds.filter(id => materials[id].terms.some(term => text.includes(term)));
  return matched.length ? matched.map(icon => ({ icon, label: materials[icon].label })) : [{ icon: "package", label: group }];
}

export function pickupDay(date: string, today: string): { label: string; urgency: "today" | "tomorrow" | "later" | "past" } {
  if (!validDate(date) || !validDate(today)) throw new Error("Ogiltigt datum för hämtningsvyn.");
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
  if (days < 0) return { label: "PASSERAT", urgency: "past" };
  if (days === 0) return { label: "IDAG", urgency: "today" };
  if (days === 1) return { label: "IMORGON", urgency: "tomorrow" };
  return { label: `OM ${days} DAGAR`, urgency: "later" };
}
