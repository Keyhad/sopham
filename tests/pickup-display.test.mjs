import test from "node:test";
import assert from "node:assert/strict";
import { pickupDay, pickupMaterials } from "../lib/pickup-display.ts";

test("pickup labels distinguish today, tomorrow, later and past across month, year and DST boundaries", () => {
  assert.deepEqual(pickupDay("2026-11-07", "2026-11-07"), { label: "IDAG", urgency: "today" });
  for (const [date, today] of [["2027-01-01", "2026-12-31"], ["2026-04-01", "2026-03-31"], ["2026-03-30", "2026-03-29"]]) {
    assert.deepEqual(pickupDay(date, today), { label: "IMORGON", urgency: "tomorrow" });
  }
  assert.deepEqual(pickupDay("2026-11-13", "2026-11-07"), { label: "OM 6 DAGAR", urgency: "later" });
  assert.deepEqual(pickupDay("2026-11-06", "2026-11-07"), { label: "PASSERAT", urgency: "past" });
  assert.throws(() => pickupDay("2026-02-30", "2026-11-07"));
});

test("material illustrations cover official combined bins and preserve unknown descriptions", () => {
  assert.deepEqual(pickupMaterials("Kärl 3 - glas och metall"), [{ icon: "glass", label: "Glas" }, { icon: "metal", label: "Metall" }]);
  assert.deepEqual(pickupMaterials("Kärl 2 - papper och plast"), [{ icon: "paper", label: "Papper" }, { icon: "plastic", label: "Plast" }]);
  assert.deepEqual(pickupMaterials("RESTAVFALL och MATAVFALL"), [{ icon: "waste", label: "Restavfall" }, { icon: "food", label: "Matavfall" }]);
  assert.deepEqual(pickupMaterials("Förpackningar"), [{ icon: "package", label: "Förpackningar" }]);
  assert.deepEqual(pickupMaterials("Plastflaskor"), [{ icon: "plastic", label: "Plast" }]);
  assert.deepEqual(pickupMaterials("Okänd kärlgrupp"), [{ icon: "package", label: "Okänd kärlgrupp" }]);
});
