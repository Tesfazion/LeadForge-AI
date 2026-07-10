import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";

export default function LeadsPage() {
  const { data: leads, error, isLoading, mutate } = useSWR("leads", api.getLeads);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", source: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createLead(form);
      setForm({ name: "", email: "", company: "", source: "" });
      setShowModal(false);
      mutate();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const statusConfig = {
    NEW: { label: "New", class: "badge-info" },
    OUTREACH_DRAFTED: { label: "Draft", class: "badge-neutral" },
    OUTREACH_PENDING_APPROVAL: { label: "Pending", class: "badge-warning" },
    OUTREACH_SENT: { label: "Sent", class: "badge-info" },
    REPLIED: { label: "Replied", class: "badge-success" },
    QUALIFIED: { label: "Qualified", class: "badge-success" },
    DISQUALIFIED: { label: "Disqualified", class: "badge-danger" },
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-description">
            Manage and track all your prospects
          </p>
        </div>
        <div className="header-actions">
          <Link href="/discovery" className="btn btn-secondary">
            Discover Leads
          </Link>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {leads && (
        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{leads.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">New</div>
            <div className="stat-value">
              {leads.filter((l) => l.status === "NEW").length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">
              {leads.filter((l) => l.status.includes("OUTREACH") || l.status === "REPLIED").length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Qualified</div>
            <div className="stat-value">
              {leads.filter((l) => l.status === "QUALIFIED").length}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ padding: "4rem", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
          <p className="text-muted">Loading leads...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "var(--danger)" }}>Failed to load leads</p>
          <p className="text-muted">Check if backend is running on port 1100</p>
        </div>
      )}

      {/* Empty State */}
      {leads?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">No leads yet</div>
          <div className="empty-state-description">
            Get started by adding your first lead or discovering new prospects
          </div>
          <div className="header-actions" style={{ marginTop: "1.5rem", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Lead
            </button>
            <Link href="/discovery" className="btn btn-secondary">
              Discover Leads
            </Link>
          </div>
        </div>
      )}

      {/* Leads Table */}
      {leads && leads.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/leads/${lead.id}`} style={{ fontWeight: 500 }}>
                      {lead.name || "—"}
                    </Link>
                  </td>
                  <td className="text-muted">{lead.company || "—"}</td>
                  <td className="text-muted">{lead.email}</td>
                  <td className="text-subtle">{lead.source || "Manual"}</td>
                  <td>
                    <span
                      className={`badge ${
                        statusConfig[lead.status]?.class || "badge-neutral"
                      }`}
                    >
                      {statusConfig[lead.status]?.label || lead.status}
                    </span>
                  </td>
                  <td className="text-subtle">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/leads/${lead.id}`} className="btn btn-sm btn-ghost">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Lead</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
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
                    placeholder="LinkedIn, Website, etc."
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
