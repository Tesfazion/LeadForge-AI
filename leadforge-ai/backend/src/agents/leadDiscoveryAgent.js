/**
 * Lead Discovery Agent
 *
 * Entry point: `discoverLeads(criteria)` — exported and called by the
 * /discovery/search route.
 *
 * Real prospect records come from Apollo. AI-generated fictional records are
 * available only through the explicit "ai" sample mode and are never a silent
 * fallback for live discovery.
 *
 * Real per-source logic lives in the integrations/ folder:
 *   - integrations/apolloIntegration.js
 *   - integrations/clearbitIntegration.js
 *   - integrations/hunterIntegration.js
 */

import { openai } from "../lib/openai.js";
import * as apollo   from "./integrations/apolloIntegration.js";

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
 * @param {string}  [criteria.source="apollo"|"ai"]   - Select live records or clearly fictional sample data
 * @returns {Promise<Array<{name,email,company,source,notes}>>}
 */
export function getDiscoverySources() {
  return {
    apollo: Boolean(process.env.APOLLO_API_KEY),
    aiSample: true,
  };
}

export async function discoverLeads(criteria) {
  const {
    industry    = "technology",
    location    = "United States",
    companySize = "1-50 employees",
    count       = 5,
    source      = "apollo",
  } = criteria;

  if (source === "ai") return discoverFromAI({ industry, location, companySize, count });
  if (source !== "apollo") throw new Error("Choose Apollo live search or AI sample mode.");
  if (!getDiscoverySources().apollo) {
    const error = new Error("Apollo is not configured. Add Apollo credentials in the backend environment, or explicitly choose AI sample mode.");
    error.status = 503;
    throw error;
  }

  return discoverFromApollo({ industry, location, companySize, count });
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
 * Generates clearly fictional sample records using GPT-4o-mini.
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
3. Use the placeholder email "contact@example.invalid" (never invent a deliverable address)
4. Job title (decision-maker level: CEO, CTO, Marketing Director, etc.)
5. Company description (one sentence)
6. Pain point — why they might need web dev services

Respond as strict JSON object:
{
  "leads": [
    {
      "name": "Person Name",
      "email": "contact@example.invalid",
      "company": "Company Name",
      "jobTitle": "Title",
      "companyDescription": "Brief description",
      "painPoint": "Their potential need",
      "source": "AI sample (fictional) - ${industry}"
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

  return leads.map((lead, index) => ({
    name:    lead.name,
    email:   `sample-${index + 1}@example.invalid`,
    company: lead.company,
    source:  `AI sample (fictional) - ${industry}`,
    notes:   [
      `Job Title: ${lead.jobTitle}`,
      `Company: ${lead.companyDescription}`,
      `Pain Point: ${lead.painPoint}`,
    ].join("\n"),
  }));
}
