/**
 * Hunter.io Integration
 * Email finder and verification
 * Docs: https://hunter.io/api-documentation/v2
 */

export async function domainSearch(domain, limit = 10) {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("HUNTER_API_KEY not configured in .env file");
  }

  const url = new URL("https://api.hunter.io/v2/domain-search");
  url.searchParams.append("domain", domain);
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("api_key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunter API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    domain: data.data.domain,
    organization: data.data.organization,
    emails: data.data.emails?.map(mapHunterEmailToLead) || [],
  };
}

export async function emailFinder(domain, firstName, lastName) {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("HUNTER_API_KEY not configured");
  }

  const url = new URL("https://api.hunter.io/v2/email-finder");
  url.searchParams.append("domain", domain);
  url.searchParams.append("first_name", firstName);
  url.searchParams.append("last_name", lastName);
  url.searchParams.append("api_key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunter email finder error: ${error}`);
  }

  const data = await response.json();
  
  return {
    email: data.data.email,
    score: data.data.score,
    firstName: data.data.first_name,
    lastName: data.data.last_name,
    position: data.data.position,
    linkedin: data.data.linkedin,
    twitter: data.data.twitter,
  };
}

export async function verifyEmail(email) {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("HUNTER_API_KEY not configured");
  }

  const url = new URL("https://api.hunter.io/v2/email-verifier");
  url.searchParams.append("email", email);
  url.searchParams.append("api_key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hunter verify error: ${error}`);
  }

  const data = await response.json();
  
  return {
    email: data.data.email,
    status: data.data.status, // valid, invalid, accept_all, webmail, disposable, unknown
    score: data.data.score,
    regexp: data.data.regexp,
    gibberish: data.data.gibberish,
    disposable: data.data.disposable,
    webmail: data.data.webmail,
    mxRecords: data.data.mx_records,
    smtpServer: data.data.smtp_server,
    smtpCheck: data.data.smtp_check,
    acceptAll: data.data.accept_all,
  };
}

function mapHunterEmailToLead(email) {
  return {
    name: `${email.first_name} ${email.last_name}`.trim(),
    email: email.value,
    company: email.organization || email.domain,
    source: "Hunter.io",
    notes: buildNotesFromHunter(email),
    metadata: {
      confidence: email.confidence,
      position: email.position,
      seniority: email.seniority,
      department: email.department,
      linkedin: email.linkedin,
      twitter: email.twitter,
      phoneNumber: email.phone_number,
      verification: email.verification?.status,
    },
  };
}

function buildNotesFromHunter(email) {
  const parts = [];
  
  if (email.position) {
    parts.push(`Position: ${email.position}`);
  }
  
  if (email.seniority) {
    parts.push(`Seniority: ${email.seniority}`);
  }
  
  if (email.department) {
    parts.push(`Department: ${email.department}`);
  }
  
  if (email.confidence) {
    parts.push(`Confidence: ${email.confidence}%`);
  }
  
  if (email.linkedin) {
    parts.push(`LinkedIn: ${email.linkedin}`);
  }
  
  if (email.phone_number) {
    parts.push(`Phone: ${email.phone_number}`);
  }
  
  if (email.verification) {
    parts.push(`Email Status: ${email.verification.status}`);
  }
  
  return parts.join("\n");
}
