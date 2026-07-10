import { useState } from "react";
import { api } from "../lib/api";
import { useRouter } from "next/router";

export default function DiscoverPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    industry: "SaaS",
    location: "United States",
    companySize: "1-50 employees",
    count: 10,
    autoAdd: true,
  });
  const [discovering, setDiscovering] = useState(false);
  const [results, setResults] = useState(null);

  async function handleDiscover(e) {
    e.preventDefault();
    setDiscovering(true);
    setResults(null);

    try {
      const result = await api.discoverLeads(form);
      setResults(result);
      
      if (form.autoAdd) {
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (err) {
      alert(`Discovery failed: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Lead Discovery</h1>
            <p className="page-description">
              Use AI to discover potential customers matching your criteria
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "24px" }}>
        {/* Discovery Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Search Criteria</div>
          </div>

          <form onSubmit={handleDiscover}>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select
                className="form-select"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                <option value="SaaS">SaaS / Software</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Consulting">Consulting</option>
                <option value="Marketing Agency">Marketing Agency</option>
                <option value="Restaurant">Restaurant / Food Service</option>
                <option value="Fitness">Fitness / Wellness</option>
                <option value="Education">Education</option>
                <option value="Legal">Legal Services</option>
                <option value="Construction">Construction</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                placeholder="United States, Europe, etc."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Size</label>
              <select
                className="form-select"
                value={form.companySize}
                onChange={(e) => setForm({ ...form, companySize: e.target.value })}
              >
                <option value="1-10 employees">1-10 employees (Startups)</option>
                <option value="11-50 employees">11-50 employees (Small)</option>
                <option value="51-200 employees">51-200 employees (Medium)</option>
                <option value="201-1000 employees">201-1000 employees (Large)</option>
                <option value="1000+ employees">1000+ employees (Enterprise)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Leads</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="20"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: parseInt(e.target.value) })}
              />
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                Maximum 20 leads per search
              </div>
            </div>

            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="autoAdd"
                checked={form.autoAdd}
                onChange={(e) => setForm({ ...form, autoAdd: e.target.checked })}
                style={{ width: "16px", height: "16px" }}
              />
              <label htmlFor="autoAdd" style={{ fontSize: "14px", cursor: "pointer", userSelect: "none" }}>
                Automatically add to leads database
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={discovering}
              style={{ width: "100%" }}
            >
              {discovering ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                  Discovering...
                </>
              ) : (
                <>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Discover Leads
                </>
              )}
            </button>

            <div style={{ marginTop: "24px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "8px" }}>How it works</div>
              <ul style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", paddingLeft: "20px", margin: 0 }}>
                <li>AI generates realistic leads matching your criteria</li>
                <li>Each lead includes contact info and pain points</li>
                <li>Leads are tagged with discovery source</li>
                <li>Ready for immediate outreach</li>
              </ul>
            </div>
          </form>
        </div>

        {/* Results */}
        <div>
          {discovering && (
            <div className="card">
              <div style={{ textAlign: "center", padding: "64px 32px" }}>
                <div className="spinner" style={{ margin: "0 auto 24px" }}></div>
                <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>
                  Discovering leads...
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  AI is generating {form.count} potential customers in {form.industry}
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="card fade-in">
              <div className="card-header">
                <div>
                  <div className="card-title">Discovery Results</div>
                  <div className="card-subtitle">
                    Found {results.discovered} leads
                    {form.autoAdd && `, added ${results.added} to database`}
                  </div>
                </div>
                {form.autoAdd && (
                  <span className="badge badge-success">Auto-added to leads</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {results.leads?.map((lead, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
                          {lead.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {lead.email}
                        </div>
                      </div>
                      <span className="badge badge-primary">{lead.company}</span>
                    </div>
                    {lead.notes && (
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                        {lead.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {form.autoAdd && (
                <div style={{ marginTop: "24px", padding: "16px", background: "var(--success)", color: "white", borderRadius: "var(--radius)", textAlign: "center" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
                    ✓ Leads added successfully
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>
                    Redirecting to leads page...
                  </div>
                </div>
              )}
            </div>
          )}

          {!discovering && !results && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Ready to discover leads</h3>
                <p className="empty-state-description">
                  Configure your search criteria and click "Discover Leads" to find potential customers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
