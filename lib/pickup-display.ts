import materials from "../docs/branding/icons/materials.json" with { type: "json" };
import { validDate } from "./pickups.ts";

const materialIds = ["paper", "plastic", "glass", "glass-colored", "glass-clear", "metal", "waste", "food", "package"] as const;
export type MaterialId = typeof materialIds[number];

export const sortingMaterials = (["waste", "food", "paper", "plastic", "glass-colored", "glass-clear", "metal"] as const)
  .map(icon => ({ icon, ...materials[icon] }));

export function pickupMaterials(group: string): { icon: MaterialId; label: string }[] {
  const text = group.toLocaleLowerCase("sv-SE");
  const matches = (id: MaterialId) => materials[id].terms.some(term => id.startsWith("glass-")
    ? text.includes("glas") && new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(text)
    : (id === "metal" ? text.replace(/(?:glas|plast)burk/gu, "") : text).includes(term));
  const specific = materialIds.filter(id => id !== "package" &&
    !(id === "glass" && text.includes("plast") && !text.includes("glas")) &&
    matches(id));
  const glassKindKnown = specific.some(id => id === "glass-colored" || id === "glass-clear");
  const matched = specific.length ? specific.filter(id => id !== "glass" || !glassKindKnown) : materialIds.filter(matches);
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
