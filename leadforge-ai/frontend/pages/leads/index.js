import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { showToast } from "../../components/Toast";
import { getStatusBadgeClass, formatStatus } from "../../lib/utils";

export default function LeadsPage() {
  const { data: leads, error, isLoading, mutate } = useSWR("leads", api.getLeads);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", source: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function handleAddLead(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createLead(form);
      setForm({ name: "", email: "", company: "", source: "" });
      setShowForm(false);
      mutate();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = searchQuery === "" ||
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // getStatusBadgeClass and formatStatus are imported from lib/utils

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Leads</h1>
            <p className="page-description">
              Manage and track all your prospects in one place
            </p>
          </div>
          <div className="page-actions">
            <Link href="/discover" className="btn btn-secondary">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Discover Leads
            </Link>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <div>
              <div className="card-title">Add new lead</div>
              <div className="card-subtitle">Only the email address is required</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowForm(false)} aria-label="Close form">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleAddLead} className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className="form-input"
                type="email"
                placeholder="john@company.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                className="form-input"
                placeholder="Acme Inc."
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Source</label>
              <input
                className="form-input"
                placeholder="LinkedIn, Website, Referral"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Adding…" : "Add lead"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="toolbar">
          <div className="toolbar-search">
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or company…"
              aria-label="Search leads"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select toolbar-select"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="NEW">New</option>
            <option value="OUTREACH_DRAFTED">Outreach drafted</option>
            <option value="OUTREACH_PENDING_APPROVAL">Awaiting approval</option>
            <option value="OUTREACH_SENT">Outreach sent</option>
            <option value="REPLIED">Replied</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="DISQUALIFIED">Disqualified</option>
          </select>

        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
          <div className="spinner"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="banner banner-error">
          Failed to load leads. Check your connection.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredLeads?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="empty-state-title">
            {searchQuery || statusFilter !== "ALL" ? "No leads found" : "No leads yet"}
          </h3>
          <p className="empty-state-description">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : "Get started by adding a lead or discovering new prospects"}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Lead</button>
              <Link href="/discover" className="btn btn-secondary">Discover Leads</Link>
            </div>
          )}
        </div>
      )}

      {/* Leads Table */}
      {filteredLeads && filteredLeads.length > 0 && (
        <div className="table-container table-scroll fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Company</th>
                <th>Source</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.name || lead.email}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                      {lead.email}
                    </div>
                  </td>
                  <td>{lead.company || "—"}</td>
                  <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {lead.source || "—"}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                      {formatStatus(lead.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/leads/${lead.id}`} className="btn btn-sm btn-ghost">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results count */}
      {filteredLeads && filteredLeads.length > 0 && (
        <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Showing <strong>{filteredLeads.length}</strong> of {leads.length} leads
        </div>
      )}
    </>
  );
}
