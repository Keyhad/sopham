import { stockholmToday, type Pickup } from "./pickups.ts";

export const DEMO_SOURCE = "DEMO – syntetiska exempeldata, inte från SVOA";
export const DEMO_FILENAME = "sopham-demo.ics";

export async function demoPickups(signal: AbortSignal): Promise<Pickup[]> {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 700);
    signal.addEventListener("abort", abort, { once: true });
  });
  signal.throwIfAborted();
  const today = stockholmToday();
  return [2, 5].map((offset, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return {
      date: date.toISOString().slice(0, 10),
      group: index === 0 ? "DEMO – Restavfall och matavfall" : "DEMO – Förpackningar",
      frequency: "Exempel – inte ett verkligt hämtningsschema",
    };
  });
}
