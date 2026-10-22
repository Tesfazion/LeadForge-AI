/**
 * Lead Discovery Agent
 *
 * Entry point: `discoverLeads(criteria)` — exported and called by the
 * /discovery/search route.
 *
 * Source priority (controlled by `criteria.source`):
 *   1. Apollo.io  — if APOLLO_API_KEY is set
 *   2. Clearbit   — if CLEARBIT_API_KEY is set
 *   3. AI fallback — GPT-4o-mini generates realistic fictional leads
 *
 * When `source` is "auto" (default), the agent tries each real source in
 * order and falls back to AI if none are configured or if they fail.
 * Pass `source: "ai"` to skip all real sources regardless of config.
 *
 * Real per-source logic lives in the integrations/ folder:
 *   - integrations/apolloIntegration.js
 *   - integrations/clearbitIntegration.js
 *   - integrations/hunterIntegration.js
 */

import { openai } from "../lib/openai.js";
import * as apollo   from "./integrations/apolloIntegration.js";
import * as clearbit from "./integrations/clearbitIntegration.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Discover leads based on search criteria.
 *
 * @param {object}  criteria
 * @param {string}  [criteria.industry="technology"]   - Target industry
 * @param {string}  [criteria.location="United States"] - Geographic location
 * @param {string}  [criteria.companySize="1-50 employees"] - Company size range
 * @param {number}  [criteria.count=5]                 - Number of leads to return
 * @param {string}  [criteria.source="auto"]           - "auto"|"apollo"|"clearbit"|"ai"
 * @returns {Promise<Array<{name,email,company,source,notes}>>}
 */
export async function discoverLeads(criteria) {
  const {
    industry    = "technology",
    location    = "United States",
    companySize = "1-50 employees",
    count       = 5,
    source      = "auto",
  } = criteria;

  // Attempt Apollo if the key is present and not explicitly bypassed
  if ((source === "auto" || source === "apollo") && process.env.APOLLO_API_KEY) {
    try {
      return await discoverFromApollo({ industry, location, companySize, count });
    } catch (err) {
      console.error("[discoverLeads] Apollo failed:", err.message);
      if (source === "apollo") throw err; // caller explicitly wanted Apollo → propagate
    }
  }

  // Attempt Clearbit if the key is present and not explicitly bypassed
  if ((source === "auto" || source === "clearbit") && process.env.CLEARBIT_API_KEY) {
    try {
      return await discoverFromClearbit({ count });
    } catch (err) {
      console.error("[discoverLeads] Clearbit failed:", err.message);
      if (source === "clearbit") throw err;
    }
  }

  // AI fallback — always available
  return await discoverFromAI({ industry, location, companySize, count });
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Discover leads via the Apollo.io integration.
 * Mapped to Apollo's person-search endpoint by apolloIntegration.js.
 */
async function discoverFromApollo({ industry, location, companySize, count }) {
  const industryId     = apollo.APOLLO_INDUSTRIES?.[industry]
    ? [apollo.APOLLO_INDUSTRIES[industry]]
    : null;
  const employeeRange  = apollo.mapCompanySizeToApollo?.(companySize);

  const result = await apollo.searchPeople({
    personTitles: ["CEO", "CTO", "Founder", "VP Engineering", "Head of Product"],
    organizationIndustryTagIds: industryId,
    organizationNumEmployeesRanges: employeeRange ? [employeeRange] : undefined,
    personLocations: location ? [location] : undefined,
    perPage: count,
  });

  return result.people.slice(0, count);
}

/**
 * Discover leads via the Clearbit Prospector integration.
 */
async function discoverFromClearbit({ count }) {
  const result = await clearbit.prospectorSearch({
    role:      ["ceo", "cto", "founder", "vp"],
    seniority: ["executive", "director"],
    perPage:   count,
  });

  return result.results.slice(0, count);
}

/**
 * AI fallback — generates realistic but fictional leads using GPT-4o-mini.
 * Used when no real lead-source API keys are configured, or when
 * `source: "ai"` is explicitly requested.
 *
 * ⚠️  All names, emails, and companies are fictional and for demo purposes only.
 */
async function discoverFromAI({ industry, location, companySize, count }) {
  const prompt = `Generate ${count} realistic B2B leads (potential customers) for a web development / automation agency.

Target criteria:
- Industry: ${industry}
- Location: ${location}
- Company size: ${companySize}

For each lead include:
1. Company name (realistic but fictional)
2. Contact person name (realistic but fictional)
3. Email (format: firstname.lastname@company.com)
4. Job title (decision-maker level: CEO, CTO, Marketing Director, etc.)
5. Company description (one sentence)
6. Pain point — why they might need web dev services

Respond as strict JSON object:
{
  "leads": [
    {
      "name": "Person Name",
      "email": "person@company.com",
      "company": "Company Name",
      "jobTitle": "Title",
      "companyDescription": "Brief description",
      "painPoint": "Their potential need",
      "source": "AI Discovery - ${industry}"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model:           "gpt-4o-mini",
    messages:        [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature:     0.8,
  });

  const raw    = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  const leads  = parsed.leads ?? (Array.isArray(parsed) ? parsed : []);

  return leads.map((lead) => ({
    name:    lead.name,
    email:   lead.email,
    company: lead.company,
    source:  lead.source ?? `AI Discovery - ${industry}`,
    notes:   [
      `Job Title: ${lead.jobTitle}`,
      `Company: ${lead.companyDescription}`,
      `Pain Point: ${lead.painPoint}`,
    ].join("\n"),
  }));
}
