import test from "node:test";
import assert from "node:assert/strict";
import { openai } from "../lib/openai.js";
import { continueConversation } from "./chatAgent.js";
import { discoverLeads } from "./leadDiscoveryAgent.js";
import { draftOutreachEmail } from "./outreachAgent.js";
import { extractRequirements } from "./requirementsAgent.js";

test("AI workflows use OpenRouter-qualified OpenAI model identifiers", async () => {
  const originalCreate = openai.chat.completions.create;
  const models = [];
  const responses = [
    "Hello",
    JSON.stringify({ subject: "A question", body: "Hello there." }),
    JSON.stringify({
      siteType: "portfolio",
      features: [],
      integrations: [],
      pages: [],
      brand: {},
      openQuestions: [],
    }),
    JSON.stringify({ leads: [] }),
  ];

  openai.chat.completions.create = async ({ model }) => {
    models.push(model);
    return { choices: [{ message: { content: responses[models.length - 1] } }] };
  };

  try {
    await continueConversation([]);
    await draftOutreachEmail({ name: "Sample", company: "Example" });
    await extractRequirements([]);
    await discoverLeads({ source: "ai", count: 1 });
    assert.deepEqual(models, Array(4).fill("openai/gpt-4o-mini"));
  } finally {
    openai.chat.completions.create = originalCreate;
  }
});
