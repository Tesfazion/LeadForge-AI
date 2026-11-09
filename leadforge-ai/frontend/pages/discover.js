/**
 * Lead Discovery page
 *
 * Lets the user configure search criteria and asks the AI agent (with
 * optional Apollo / Clearbit fallback) to generate a list of potential leads.
 * Results can be automatically saved to the database.
 */

import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

const INDUSTRIES = [
  "SaaS", "E-commerce", "Healthcare", "Real Estate", "Consulting",
  "Marketing Agency", "Restaurant", "Fitness", "Education",
  "Legal", "Construction", "Technology", "Finance", "Manufacturing",
];

const COMPANY_SIZES = [
  { label: "1–10 employees (Startups)",        value: "1-10 employees" },
  { label: "11–50 employees (Small)",           value: "11-50 employees" },
  { label: "51–200 employees (Medium)",         value: "51-200 employees" },
  { label: "201–1000 employees (Large)",        value: "201-1000 employees" },
  { label: "1000+ employees (Enterprise)",      value: "1000+ employees" },
];

const DEFAULT_FORM = {
  industry:    "SaaS",
  location:    "United States",
  companySize: "1-50 employees",
  count:       10,
  autoAdd:     true,
};

export default function DiscoverPage() {
  const router = useRouter();
  const [form,        setForm]       = useState(DEFAULT_FORM);
  const [discovering, setDiscovering] = useState(false);
  const [results,     setResults]    = useState(null);

  async function handleDiscover(e) {
    e.preventDefault();
    setDiscovering(true);
    setResults(null);

    try {
      const result = await api.discoverLeads(form);
      setResults(result);
      showToast(`Discovered ${result.discovered} leads`, "success");

      if (form.autoAdd) {
        // Give the user a moment to see the results before redirecting
        setTimeout(() => router.push("/leads"), 3000);
      }
    } catch (err) {
      showToast(`Discovery failed: ${err.message}`, "error");
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

      <div className="grid-form">
        {/* ---------------------------------------------------------------- */}
        {/* Search criteria form                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Search criteria</div>
              <div className="card-subtitle">Tell the agent who to look for</div>
            </div>
          </div>

          <form onSubmit={handleDiscover}>
            <div className="form-group">
              <label className="form-label" htmlFor="discover-industry">Industry</label>
              <select
                id="discover-industry"
                className="form-select"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discover-location">Location</label>
              <input
                id="discover-location"
                className="form-input"
                placeholder="United States, Europe, etc."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discover-size">Company size</label>
              <select
                id="discover-size"
                className="form-select"
                value={form.companySize}
                onChange={(e) => setForm({ ...form, companySize: e.target.value })}
              >
                {COMPANY_SIZES.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discover-count">Number of leads</label>
              <input
                id="discover-count"
                className="form-input"
                type="number"
                min={1}
                max={20}
                value={form.count}
                onChange={(e) => setForm({ ...form, count: parseInt(e.target.value, 10) })}
              />
              <div className="form-hint">Maximum 20 leads per search</div>
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="autoAdd"
                checked={form.autoAdd}
                onChange={(e) => setForm({ ...form, autoAdd: e.target.checked })}
              />
              <label htmlFor="autoAdd">Add results to the leads database</label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={discovering}
              style={{ width: "100%" }}
            >
              {discovering ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                  Discovering…
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

            {/* How it works */}
            <div className="info-strip" style={{ marginTop: "24px", display: "block" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                How it works
              </div>
              <ul style={{ lineHeight: 1.8, paddingLeft: "18px", margin: 0 }}>
                <li>AI generates realistic leads matching your criteria</li>
                <li>Each lead includes contact info and pain points</li>
                <li>Leads are tagged with their discovery source</li>
                <li>Ready for immediate outreach</li>
              </ul>
            </div>
          </form>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Results panel                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div>
          {/* Discovering spinner */}
          {discovering && (
            <div className="card">
              <div style={{ textAlign: "center", padding: "64px 32px" }}>
                <div className="spinner" style={{ margin: "0 auto 24px" }} />
                <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>
                  Discovering leads…
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  AI is generating {form.count} potential customers in {form.industry}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
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

              <div className="grid-stack" style={{ gap: "12px" }}>
                {results.leads?.map((lead, index) => (
                  <div key={index} className="list-tile">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px", marginBottom: "8px" }}>
                      <div>
                        <div className="list-tile-title">{lead.name}</div>
                        <div className="list-tile-meta">{lead.email}</div>
                      </div>
                      <span className="badge badge-primary">{lead.company}</span>
                    </div>
                    {lead.notes && (
                      <div className="list-tile-body">{lead.notes}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Auto-redirect notice */}
              {form.autoAdd && (
                <div className="banner banner-success" style={{ marginTop: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
                    ✓ Leads added successfully
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>
                    Redirecting to leads page…
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Idle placeholder */}
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
                  Configure your search criteria and click "Discover Leads"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
