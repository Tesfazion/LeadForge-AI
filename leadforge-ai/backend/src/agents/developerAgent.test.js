import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "./developerAgent.js";
import { openai } from "../lib/openai.js";

test("website generation reports an empty model response instead of a placeholder site", async () => {
  const originalCreate = openai.chat.completions.create;
  let requestedModel;
  openai.chat.completions.create = async ({ model }) => {
    requestedModel = model;
    return { choices: [{ message: { content: "" } }] };
  };

  try {
    await assert.rejects(
      generateSite({ siteType: "portfolio", features: [], integrations: [], brand: {} }),
      /AI provider returned an empty website component/
    );
    assert.equal(requestedModel, "openai/gpt-4o");
  } finally {
    openai.chat.completions.create = originalCreate;
  }
});
