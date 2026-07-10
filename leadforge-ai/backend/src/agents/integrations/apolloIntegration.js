/**
 * Apollo.io Integration
 * Real B2B contact and company data
 * Docs: https://apolloio.github.io/apollo-api-docs/
 * 
 * Supports both:
 * - API Key authentication (APOLLO_API_KEY)
 * - OAuth authentication (APOLLO_CLIENT_ID + APOLLO_CLIENT_SECRET)
 */

// Get authentication headers based on available credentials
function getAuthHeaders() {
  const apiKey = process.env.APOLLO_API_KEY;
  const clientId = process.env.APOLLO_CLIENT_ID;
  const clientSecret = process.env.APOLLO_CLIENT_SECRET;

  // Prefer OAuth if credentials are available
  if (clientId && clientSecret) {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    return {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Authorization": `Basic ${basicAuth}`,
    };
  }

  // Fall back to API Key
  if (apiKey) {
    return {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    };
  }

  throw new Error("Apollo.io credentials not configured. Set either APOLLO_API_KEY or APOLLO_CLIENT_ID + APOLLO_CLIENT_SECRET in .env file");
}

export async function searchPeople(criteria) {
  const {
    personTitles = ["CEO", "CTO", "Founder", "VP", "Director"],
    organizationIndustryTagIds,
    organizationNumEmployeesRanges,
    personLocations,
    page = 1,
    perPage = 25,
  } = criteria;

  const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      page,
      per_page: perPage,
      person_titles: personTitles,
      organization_industry_tag_ids: organizationIndustryTagIds,
      organization_num_employees_ranges: organizationNumEmployeesRanges,
      person_locations: personLocations,
      reveal_personal_emails: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apollo API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    total: data.pagination?.total_entries || 0,
    page: data.pagination?.page || 1,
    perPage: data.pagination?.per_page || 25,
    people: data.people?.map(mapApolloPersonToLead) || [],
  };
}

export async function enrichPerson(email) {
  const response = await fetch("https://api.apollo.io/v1/people/match", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      email,
      reveal_personal_emails: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apollo enrich error: ${error}`);
  }

  const data = await response.json();
  return mapApolloPersonToLead(data.person);
}

function mapApolloPersonToLead(person) {
  return {
    name: person.name || `${person.first_name} ${person.last_name}`.trim(),
    email: person.email || person.primary_email,
    company: person.organization?.name,
    source: "Apollo.io",
    notes: buildNotesFromApollo(person),
    apolloId: person.id,
    metadata: {
      title: person.title,
      seniority: person.seniority,
      departments: person.departments,
      linkedin: person.linkedin_url,
      phone: person.phone_numbers?.[0]?.raw_number,
      organizationId: person.organization_id,
      industry: person.organization?.industry,
      employeeCount: person.organization?.estimated_num_employees,
      website: person.organization?.website_url,
    },
  };
}

function buildNotesFromApollo(person) {
  const parts = [];
  
  if (person.title) {
    parts.push(`Title: ${person.title}`);
  }
  
  if (person.seniority) {
    parts.push(`Seniority: ${person.seniority}`);
  }
  
  if (person.departments?.length > 0) {
    parts.push(`Departments: ${person.departments.join(", ")}`);
  }
  
  if (person.organization?.name) {
    parts.push(`Company: ${person.organization.name}`);
    
    if (person.organization.industry) {
      parts.push(`Industry: ${person.organization.industry}`);
    }
    
    if (person.organization.estimated_num_employees) {
      parts.push(`Employees: ${person.organization.estimated_num_employees}`);
    }
    
    if (person.organization.website_url) {
      parts.push(`Website: ${person.organization.website_url}`);
    }
  }
  
  if (person.linkedin_url) {
    parts.push(`LinkedIn: ${person.linkedin_url}`);
  }
  
  return parts.join("\n");
}

// Helper: Get industry IDs from Apollo
export const APOLLO_INDUSTRIES = {
  "Technology": "5567cd4673696439b10b0000",
  "Software": "5567cd4773696439b1180000",
  "SaaS": "5f6bda6f697e0c00018f3e3f",
  "E-commerce": "5567cd4673696439b1090000",
  "Healthcare": "5567cd4773696439b1160000",
  "Finance": "5567cd4773696439b1150000",
  "Real Estate": "5567cd4773696439b11c0000",
  "Consulting": "5567cd4673696439b10a0000",
  "Marketing": "5567cd4773696439b1190000",
  "Education": "5567cd4673696439b10d0000",
};

// Helper: Map company sizes to Apollo ranges
export function mapCompanySizeToApollo(size) {
  const sizeMap = {
    "1-10 employees": "1,10",
    "11-50 employees": "11,50",
    "51-200 employees": "51,200",
    "201-1000 employees": "201,1000",
    "1000+ employees": "1001,10000",
  };
  return sizeMap[size] || "1,10000";
}
