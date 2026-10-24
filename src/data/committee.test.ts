import { test } from "node:test";
import assert from "node:assert/strict";
import { COMMITTEE } from "./committee";

test("trustees are shown in the trust's chosen order", () => {
  assert.deepEqual(
    COMMITTEE.map((m) => m.id),
    ["01", "03", "04", "02", "05", "06", "07"]
  );
});
