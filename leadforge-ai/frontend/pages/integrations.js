import { useState } from "react";

export default function IntegrationsPage() {
  const [saving, setSaving] = useState(false);
  
  const integrations = [
    {
      name: "Apollo.io",
      description: "B2B database with 265M+ contacts and 60M+ companies",
      status: "not_configured",
      logo: "https://www.apollo.io/favicon.ico",
      docs: "https://apolloio.github.io/apollo-api-docs/",
      pricing: "$49-99/month",
      features: ["Contact search", "Company data", "Email verification", "Technographics"],
      envKey: "APOLLO_API_KEY",
      setupSteps: [
        "Sign up at app.apollo.io",
        "Go to Settings > Integrations",
        "Click 'Generate API Key'",
        "Copy key and add to backend/.env",
      ],
    },
    {
      name: "Hunter.io",
      description: "Find and verify professional email addresses",
      status: "not_configured",
      logo: "https://hunter.io/favicon.ico",
      docs: "https://hunter.io/api-documentation/v2",
      pricing: "$49-399/month",
      features: ["Email finder", "Domain search", "Email verification", "Bulk tasks"],
      envKey: "HUNTER_API_KEY",
      setupSteps: [
        "Sign up at hunter.io",
        "Go to API section",
        "Copy your API key",
        "Add to backend/.env",
      ],
    },
    {
      name: "Clearbit",
      description: "Real-time business intelligence and lead enrichment",
      status: "not_configured",
      logo: "https://clearbit.com/favicon.ico",
      docs: "https://clearbit.com/docs",
      pricing: "$99-999/month",
      features: ["Person enrichment", "Company enrichment", "Prospector", "Lead scoring"],
      envKey: "CLEARBIT_API_KEY",
      setupSteps: [
        "Sign up at clearbit.com",
        "Go to Account > API Keys",
        "Copy your API key",
        "Add to backend/.env",
      ],
    },
  ];

  const crmIntegrations = [
    {
      name: "Salesforce",
      description: "Sync leads and activities with Salesforce CRM",
      status: "coming_soon",
      logo: "https://www.salesforce.com/favicon.ico",
    },
    {
      name: "HubSpot",
      description: "Bi-directional sync with HubSpot CRM",
      status: "coming_soon",
      logo: "https://www.hubspot.com/favicon.ico",
    },
    {
      name: "Pipedrive",
      description: "Push leads to Pipedrive pipeline",
      status: "coming_soon",
      logo: "https://www.pipedrive.com/favicon.ico",
    },
  ];

  const getStatusBadge = (status) => {
    if (status === "configured") {
      return <span className="badge badge-success">Connected</span>;
    } else if (status === "coming_soon") {
      return <span className="badge badge-gray">Coming Soon</span>;
    }
    return <span className="badge badge-warning">Not Configured</span>;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Integrations</h1>
            <p className="page-description">
              Connect external services to enhance lead discovery and enrichment
            </p>
          </div>
        </div>
      </div>

      {/* Lead Source Integrations */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Lead Sources
        </h2>
        
        <div style={{ display: "grid", gap: "16px" }}>
          {integrations.map((integration) => (
            <div key={integration.name} className="card">
              <div style={{ display: "flex", gap: "24px" }}>
                {/* Logo */}
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: "var(--bg-secondary)",
                }}>
                  <img 
                    src={integration.logo} 
                    alt={integration.name}
                    style={{ width: "32px", height: "32px" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = integration.name[0];
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                        {integration.name}
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                        {integration.description}
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                    {integration.features.map((feature) => (
                      <span
                        key={feature}
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          background: "var(--bg-secondary)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Pricing & Docs */}
                  <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "16px" }}>
                    <span>💰 {integration.pricing}</span>
                    <a 
                      href={integration.docs} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: "var(--primary-600)" }}
                    >
                      📚 Documentation
                    </a>
                  </div>

                  {/* Setup Steps */}
                  <details>
                    <summary style={{ 
                      cursor: "pointer", 
                      fontSize: "14px", 
                      fontWeight: 500,
                      marginBottom: "12px",
                      userSelect: "none",
                    }}>
                      Setup Instructions
                    </summary>
                    <div style={{
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius)",
                      marginTop: "8px",
                    }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>
                        Add to backend/.env:
                      </div>
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        padding: "8px 12px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "12px",
                      }}>
                        {integration.envKey}=your_api_key_here
                      </div>
                      <ol style={{ paddingLeft: "20px", margin: 0, fontSize: "13px", lineHeight: "1.8" }}>
                        {integration.setupSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CRM Integrations */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          CRM Systems
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {crmIntegrations.map((integration) => (
            <div key={integration.name} className="card">
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                  {integration.name}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  {integration.description}
                </div>
                {getStatusBadge(integration.status)}
              </div>
              <button className="btn btn-secondary btn-sm" disabled style={{ width: "100%" }}>
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="card" style={{ marginTop: "32px", background: "var(--primary-50)" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "start" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius)",
            background: "var(--primary-600)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
              Need help setting up integrations?
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
              Check our documentation or contact support for assistance with API configuration.
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <a href="#" className="btn btn-sm btn-primary">
                View Docs
              </a>
              <a href="#" className="btn btn-sm btn-secondary">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
