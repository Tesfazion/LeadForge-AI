import test from "node:test";
import assert from "node:assert/strict";
import { generateSite } from "./developerAgent.js";
import { openai } from "../lib/openai.js";

test("website generation reports an empty model response instead of a placeholder site", async () => {
  const originalCreate = openai.chat.completions.create;
  openai.chat.completions.create = async () => ({ choices: [{ message: { content: "" } }] });

  try {
    await assert.rejects(
      generateSite({ siteType: "portfolio", features: [], integrations: [], brand: {} }),
      /AI provider returned an empty website component/
    );
  } finally {
    openai.chat.completions.create = originalCreate;
  }
});
