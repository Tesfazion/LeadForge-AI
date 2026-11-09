/**
 * Lead Discovery page
 *
 * Searches Apollo for real prospects or creates clearly labeled fictional
 * samples that cannot be saved to the contactable pipeline.
 */

import { useState } from "react";
import useSWR from "swr";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

const INDUSTRIES = [
  "Technology", "Software", "SaaS", "E-commerce", "Healthcare",
  "Finance", "Real Estate", "Consulting", "Marketing", "Education",
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
  autoAdd:     false,
  source:      "apollo",
};

export default function DiscoverPage() {
  const { data: sources } = useSWR("discovery-sources", api.getDiscoverySources);
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
      showToast(result.isSampleData
        ? `Generated ${result.discovered} fictional sample records`
        : form.autoAdd
          ? `Found ${result.discovered} prospects; added ${result.added} to your pipeline`
          : `Found ${result.discovered} prospects for review`, "success");
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
                Find real prospects with Apollo, or preview the workflow using clearly marked fictional sample records.
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
              <label className="form-label" htmlFor="discover-source">Data source</label>
              <select
                id="discover-source"
                className="form-select"
                value={form.source}
                onChange={(event) => {
                  const source = event.target.value;
                  setForm({ ...form, source, autoAdd: false });
                  setResults(null);
                }}
              >
                <option value="apollo">Apollo · live prospect records</option>
                <option value="ai">AI sample · fictional records only</option>
              </select>
              {form.source === "apollo" && sources && !sources.apollo && (
                <div className="form-hint" role="status">
                  Apollo credentials are not configured. Add them to the backend environment, or switch to AI sample mode.
                </div>
              )}
              {form.source === "ai" && (
                <div className="banner banner-warning" role="note" style={{ marginTop: "10px" }}>
                  These contacts are fictional examples. They cannot be saved to your lead pipeline or contacted.
                </div>
              )}
            </div>
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
                required
                value={form.count}
                onChange={(e) => setForm({
                  ...form,
                  count: e.target.value === "" ? "" : Number.parseInt(e.target.value, 10),
                })}
              />
              <div className="form-hint">Maximum 20 leads per search</div>
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="autoAdd"
                checked={form.autoAdd && form.source !== "ai"}
                disabled={form.source === "ai"}
                onChange={(e) => setForm({ ...form, autoAdd: e.target.checked })}
              />
              <label htmlFor="autoAdd">Save real prospects to my pipeline after search</label>
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
                <li>Apollo search returns provider-sourced prospect records</li>
                <li>Review records before they enter the contactable pipeline</li>
                <li>AI sample mode is fictional and cannot be contacted</li>
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
                {form.source === "ai"
                  ? `Generating ${form.count} fictional sample records in ${form.industry}`
                  : `Searching Apollo for up to ${form.count} prospects in ${form.industry}`}
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
                    {results.isSampleData
                      ? `Generated ${results.discovered} fictional sample records`
                      : `Found ${results.discovered} real prospects${form.autoAdd ? `; added ${results.added} to your pipeline` : ""}`}
                  </div>
                </div>
                {results.isSampleData ? (
                  <span className="badge badge-warning">Fictional · not contactable</span>
                ) : results.added > 0 ? (
                  <span className="badge badge-success">Added to pipeline</span>
                ) : form.autoAdd ? (
                  <span className="badge badge-gray">No new contacts added</span>
                ) : (
                  <span className="badge badge-gray">Preview only</span>
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

              {!results.isSampleData && results.added > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <a className="btn btn-secondary" href="/leads">Review saved prospects</a>
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
