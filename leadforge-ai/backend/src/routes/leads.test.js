import test from "node:test";
import assert from "node:assert/strict";
import { leadUpdateSchema } from "./leads.js";

test("lead updates trim contact fields and allow clearing optional text", () => {
  const result = leadUpdateSchema.safeParse({
    name: "  Ada Lovelace  ",
    company: "",
    notes: "  Follow up next week.  ",
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    name: "Ada Lovelace",
    company: null,
    notes: "Follow up next week.",
  });
});

test("lead updates require a valid email and reject non-editable fields", () => {
  assert.equal(leadUpdateSchema.safeParse({ email: "not-an-email" }).success, false);
  assert.equal(leadUpdateSchema.safeParse({ status: "REPLIED" }).success, false);
  assert.equal(leadUpdateSchema.safeParse({}).success, false);
});
