import test from "node:test";
import assert from "node:assert/strict";
import { discoverLeads, getDiscoverySources } from "./leadDiscoveryAgent.js";
import { openai } from "../lib/openai.js";

test("Apollo is reported unavailable without credentials and live search does not fall back", async () => {
  const keys = ["APOLLO_API_KEY", "APOLLO_CLIENT_ID", "APOLLO_CLIENT_SECRET"];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  keys.forEach((key) => delete process.env[key]);

  try {
    assert.deepEqual(getDiscoverySources(), { apollo: false, aiSample: true });
    process.env.APOLLO_CLIENT_ID = "client-id";
    process.env.APOLLO_CLIENT_SECRET = "client-secret";
    assert.equal(getDiscoverySources().apollo, false);
    await assert.rejects(
      discoverLeads({ source: "apollo" }),
      (error) => error.status === 503 && error.message.includes("Apollo is not configured")
    );
    await assert.rejects(
      discoverLeads({ source: "clearbit" }),
      /Choose Apollo live search or AI sample mode/
    );
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("AI sample records use non-deliverable placeholder addresses", async () => {
  const originalCreate = openai.chat.completions.create;
  openai.chat.completions.create = async () => ({
    choices: [{
      message: {
        content: JSON.stringify({
          leads: [{
            name: "Sample Person",
            email: "someone@real-looking-company.com",
            company: "Example Company",
            jobTitle: "Owner",
            companyDescription: "A fictional business",
            painPoint: "Needs a website",
          }],
        }),
      },
    }],
  });

  try {
    const [lead] = await discoverLeads({ source: "ai", count: 1 });
    assert.equal(lead.email, "sample-1@example.invalid");
    assert.match(lead.source, /fictional/);
  } finally {
    openai.chat.completions.create = originalCreate;
  }
});
