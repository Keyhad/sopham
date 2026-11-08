import test from "node:test";
import assert from "node:assert/strict";
import { locationErrorMessage } from "../lib/location.ts";

test("location errors distinguish permission, unavailable position and timeout without claiming an address", () => {
  assert.match(locationErrorMessage(1), /webbplatsinställningar/);
  assert.match(locationErrorMessage(1), /Safari eller Chrome/);
  assert.match(locationErrorMessage(2), /platstjänster/);
  assert.match(locationErrorMessage(3), /för lång tid/);
  assert.match(locationErrorMessage(99), /kunde inte bestämmas/);
});
