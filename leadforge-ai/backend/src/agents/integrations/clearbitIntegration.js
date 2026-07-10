/**
 * Clearbit Integration
 * Company and person enrichment
 * Docs: https://clearbit.com/docs
 */

export async function enrichCompany(domain) {
  const apiKey = process.env.CLEARBIT_API_KEY;
  
  if (!apiKey) {
    throw new Error("CLEARBIT_API_KEY not configured in .env file");
  }

  const response = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${domain}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Company not found");
    }
    const error = await response.text();
    throw new Error(`Clearbit API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return mapClearbitCompany(data);
}

export async function enrichPerson(email) {
  const apiKey = process.env.CLEARBIT_API_KEY;
  
  if (!apiKey) {
    throw new Error("CLEARBIT_API_KEY not configured");
  }

  const response = await fetch(`https://person.clearbit.com/v2/people/find?email=${email}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Person not found");
    }
    const error = await response.text();
    throw new Error(`Clearbit person error: ${error}`);
  }

  const data = await response.json();
  return mapClearbitPersonToLead(data);
}

export async function prospectorSearch(criteria) {
  const apiKey = process.env.CLEARBIT_API_KEY;
  
  if (!apiKey) {
    throw new Error("CLEARBIT_API_KEY not configured");
  }

  const {
    role = ["ceo", "cto", "founder"],
    seniority = ["executive", "director"],
    titles,
    page = 1,
    perPage = 20,
  } = criteria;

  const response = await fetch("https://prospector.clearbit.com/v1/people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      role,
      seniority,
      titles,
      page,
      page_size: perPage,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Clearbit prospector error: ${error}`);
  }

  const data = await response.json();

  return {
    total: data.total,
    page: data.page,
    results: data.results?.map(mapClearbitPersonToLead) || [],
  };
}

function mapClearbitCompany(company) {
  return {
    name: company.name,
    domain: company.domain,
    logo: company.logo,
    description: company.description,
    foundedYear: company.foundedYear,
    location: company.location,
    timeZone: company.timeZone,
    employees: company.metrics?.employees,
    employeesRange: company.metrics?.employeesRange,
    marketCap: company.metrics?.marketCap,
    raised: company.metrics?.raised,
    annualRevenue: company.metrics?.annualRevenue,
    category: {
      sector: company.category?.sector,
      industryGroup: company.category?.industryGroup,
      industry: company.category?.industry,
      subIndustry: company.category?.subIndustry,
    },
    tags: company.tags,
    tech: company.tech,
    linkedin: company.linkedin?.handle,
    twitter: company.twitter?.handle,
    facebook: company.facebook?.handle,
  };
}

function mapClearbitPersonToLead(person) {
  return {
    name: person.name?.fullName || `${person.name?.givenName} ${person.name?.familyName}`.trim(),
    email: person.email,
    company: person.employment?.name,
    source: "Clearbit",
    notes: buildNotesFromClearbit(person),
    metadata: {
      title: person.employment?.title,
      role: person.employment?.role,
      seniority: person.employment?.seniority,
      domain: person.employment?.domain,
      linkedin: person.linkedin?.handle,
      twitter: person.twitter?.handle,
      github: person.github?.handle,
      avatar: person.avatar,
      location: person.location,
      timeZone: person.timeZone,
      bio: person.bio,
    },
  };
}

function buildNotesFromClearbit(person) {
  const parts = [];
  
  if (person.employment?.title) {
    parts.push(`Title: ${person.employment.title}`);
  }
  
  if (person.employment?.role) {
    parts.push(`Role: ${person.employment.role}`);
  }
  
  if (person.employment?.seniority) {
    parts.push(`Seniority: ${person.employment.seniority}`);
  }
  
  if (person.employment?.name) {
    parts.push(`Company: ${person.employment.name}`);
  }
  
  if (person.location) {
    parts.push(`Location: ${person.location}`);
  }
  
  if (person.linkedin?.handle) {
    parts.push(`LinkedIn: https://linkedin.com/in/${person.linkedin.handle}`);
  }
  
  if (person.twitter?.handle) {
    parts.push(`Twitter: @${person.twitter.handle}`);
  }
  
  if (person.bio) {
    parts.push(`Bio: ${person.bio}`);
  }
  
  return parts.join("\n");
}
