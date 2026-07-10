import { openai } from "../lib/openai.js";
import * as apollo from "./integrations/apolloIntegration.js";
import * as hunter from "./integrations/hunterIntegration.js";
import * as clearbit from "./integrations/clearbitIntegration.js";

/**
 * Lead Discovery Agent
 * 
 * Generates potential leads based on search criteria.
 * In production, this would integrate with:
 * - Apollo.io API
 * - Clearbit Prospector
 * - Hunter.io
 * - LinkedIn Sales Navigator
 * - Google Maps API for local businesses
 * 
 * For now, this demonstrates the concept with AI-generated leads
 * that you can later replace with real API calls.
 */

/**
 * Discover leads based on criteria
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.industry - Target industry (e.g., "SaaS", "E-commerce")
 * @param {string} criteria.location - Geographic location
 * @param {string} criteria.companySize - Company size range
 * @param {number} criteria.count - Number of leads to generate
 */
export async function discoverLeads(criteria) {
  const {
    industry = "technology",
    location = "United States",
    companySize = "1-50 employees",
    count = 5,
    source = "auto", // "auto", "apollo", "hunter", "clearbit", "ai"
  } = criteria;

  // Try real sources first if API keys are configured
  if (source === "auto" || source === "apollo") {
    if (process.env.APOLLO_API_KEY) {
      try {
        return await discoverFromApollo(criteria);
      } catch (err) {
        console.error("Apollo discovery failed:", err.message);
        if (source === "apollo") throw err;
      }
    }
  }

  if (source === "auto" || source === "clearbit") {
    if (process.env.CLEARBIT_API_KEY) {
      try {
        return await discoverFromClearbit(criteria);
      } catch (err) {
        console.error("Clearbit discovery failed:", err.message);
        if (source === "clearbit") throw err;
      }
    }
  }

  // Fallback to AI generation
  return await discoverFromAI(criteria);
}

async function discoverFromApollo(criteria) {
  const { industry, location, companySize, count } = criteria;
  
  const industryIds = apollo.APOLLO_INDUSTRIES[industry] 
    ? [apollo.APOLLO_INDUSTRIES[industry]] 
    : null;
  
  const employeeRange = apollo.mapCompanySizeToApollo(companySize);
  
  const result = await apollo.searchPeople({
    personTitles: ["CEO", "CTO", "Founder", "VP Engineering", "Head of Product"],
    organizationIndustryTagIds: industryIds,
    organizationNumEmployeesRanges: [employeeRange],
    personLocations: location ? [location] : null,
    perPage: count,
  });

  return result.people.slice(0, count);
}

async function discoverFromClearbit(criteria) {
  const { count } = criteria;
  
  const result = await clearbit.prospectorSearch({
    role: ["ceo", "cto", "founder", "vp"],
    seniority: ["executive", "director"],
    perPage: count,
  });

  return result.results.slice(0, count);
}

async function discoverFromAI(criteria) {
  const {
    industry = "technology",
    location = "United States",
    companySize = "1-50 employees",
    count = 5,
  } = criteria;

  // In production, you would call real APIs here:
  // const apolloLeads = await fetchFromApollo(criteria);
  // const hunterLeads = await fetchFromHunter(criteria);
  
  // For demonstration, we'll generate realistic-looking leads with AI
  const prompt = `Generate ${count} realistic B2B leads (potential customers) for a web development/automation agency.

Target criteria:
- Industry: ${industry}
- Location: ${location}
- Company size: ${companySize}

For each lead, provide:
1. Company name (realistic but fictional)
2. Contact person name (realistic but fictional)
3. Email (format: firstname.lastname@company.com)
4. Job title (decision-maker level: CEO, CTO, Marketing Director, etc.)
5. Company description (1 sentence)
6. Pain point / need (why they might need web dev services)

Respond as strict JSON array:
[
  {
    "name": "Person Name",
    "email": "person@company.com",
    "company": "Company Name",
    "jobTitle": "Title",
    "companyDescription": "Brief description",
    "painPoint": "Their potential need",
    "source": "AI Discovery - ${industry}"
  }
]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  
  // The response might be wrapped in an object with a 'leads' key
  const leads = Array.isArray(parsed) ? parsed : (parsed.leads || []);
  
  return leads.map(lead => ({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    source: lead.source || `AI Discovery - ${industry}`,
    notes: `Job Title: ${lead.jobTitle}\nCompany: ${lead.companyDescription}\nPain Point: ${lead.painPoint}`,
  }));
}

/**
 * Integration placeholders for real lead sources
 * Uncomment and implement when you have API keys
 */

// Apollo.io Integration
export async function fetchFromApollo(criteria) {
  if (!process.env.APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY not configured");
  }
  
  const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": process.env.APOLLO_API_KEY,
    },
    body: JSON.stringify({
      // API parameters - see https://apolloio.github.io/apollo-api-docs/
      person_titles: ["CEO", "CTO", "Founder", "Marketing Director"],
      organization_num_employees_ranges: [criteria.companySize],
      // ... add more filters
    }),
  });

  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status}`);
  }

  const data = await response.json();
  
  return data.people?.map(person => ({
    name: person.name,
    email: person.email,
    company: person.organization?.name,
    source: "Apollo.io",
    notes: `Title: ${person.title}\nLinkedIn: ${person.linkedin_url}`,
  })) || [];
}

// Hunter.io Integration
export async function fetchFromHunter(criteria) {
  if (!process.env.HUNTER_API_KEY) {
    throw new Error("HUNTER_API_KEY not configured");
  }

  // Example: domain search
  const domain = criteria.domain || "example.com";
  const response = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Hunter API error: ${response.status}`);
  }

  const data = await response.json();
  
  return data.data?.emails?.map(email => ({
    name: `${email.first_name} ${email.last_name}`,
    email: email.value,
    company: data.data.domain,
    source: "Hunter.io",
    notes: `Position: ${email.position}\nDepartment: ${email.department}`,
  })) || [];
}

// Clearbit Prospector Integration
export async function fetchFromClearbit(criteria) {
  if (!process.env.CLEARBIT_API_KEY) {
    throw new Error("CLEARBIT_API_KEY not configured");
  }

  const response = await fetch("https://prospector.clearbit.com/v1/people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.CLEARBIT_API_KEY}`,
    },
    body: JSON.stringify({
      // API parameters
      role: ["ceo", "cto", "founder"],
      // ... add more filters
    }),
  });

  if (!response.ok) {
    throw new Error(`Clearbit API error: ${response.status}`);
  }

  const data = await response.json();
  
  return data.results?.map(person => ({
    name: person.name,
    email: person.email,
    company: person.company?.name,
    source: "Clearbit",
    notes: `Role: ${person.role}\nSeniority: ${person.seniority}`,
  })) || [];
}
