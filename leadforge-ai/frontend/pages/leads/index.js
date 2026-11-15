import useSWR from "swr";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { showToast } from "../../components/Toast";
import { getStatusBadgeClass, formatStatus } from "../../lib/utils";
import { supabase } from "../../lib/supabase";

const LEAD_STATUSES = [
  "ALL",
  "NEW",
  "OUTREACH_DRAFTED",
  "OUTREACH_PENDING_APPROVAL",
  "OUTREACH_SENT",
  "REPLIED",
  "QUALIFIED",
  "DISQUALIFIED",
];
const SORT_FIELDS = ["name", "company", "status", "createdAt"];
const VIEW_MODES = ["table", "board"];
const BOARD_STATUSES = [
  "NEW",
  "OUTREACH_DRAFTED",
  "OUTREACH_PENDING_APPROVAL",
  "OUTREACH_SENT",
  "REPLIED",
  "QUALIFIED",
  "DISQUALIFIED",
];

export default function LeadsPage() {
  const { data: leads, error, isLoading, mutate } = useSWR("leads", api.getLeads);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", source: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewMode, setViewMode] = useState("table");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesKey, setPreferencesKey] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      try {
        if (!supabase) return;
        const { data, error: accountError } = await supabase.auth.getUser();
        if (accountError) throw accountError;
        if (!data.user) return;

        const key = `leadforge.lead-list.${data.user.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          let preferences;
          try {
            preferences = JSON.parse(saved);
          } catch {
            localStorage.removeItem(key);
            showToast("Saved lead-list preferences could not be read and were reset.", "error");
          }

          if (preferences && typeof preferences === "object" && !Array.isArray(preferences)) {
            if (typeof preferences.searchQuery === "string") setSearchQuery(preferences.searchQuery);
            if (LEAD_STATUSES.includes(preferences.statusFilter)) setStatusFilter(preferences.statusFilter);
            if (SORT_FIELDS.includes(preferences.sortBy)) setSortBy(preferences.sortBy);
            if (preferences.sortDirection === "asc" || preferences.sortDirection === "desc") {
              setSortDirection(preferences.sortDirection);
            }
            if (VIEW_MODES.includes(preferences.viewMode)) setViewMode(preferences.viewMode);
          } else if (preferences !== undefined) {
            localStorage.removeItem(key);
            showToast("Saved lead-list preferences were invalid and have been reset.", "error");
          }
        }
        if (active) setPreferencesKey(key);
      } catch (preferencesError) {
        if (active) showToast(`Could not load saved lead-list preferences: ${preferencesError.message}`, "error");
      } finally {
        if (active) setPreferencesReady(true);
      }
    }

    loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!preferencesReady || !preferencesKey) return;
    try {
      localStorage.setItem(preferencesKey, JSON.stringify({
        searchQuery,
        statusFilter,
        sortBy,
        sortDirection,
        viewMode,
      }));
    } catch (preferencesError) {
      showToast(`Could not save lead-list preferences: ${preferencesError.message}`, "error");
    }
  }, [preferencesKey, preferencesReady, searchQuery, statusFilter, sortBy, sortDirection, viewMode]);

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

  const filteredLeads = leads?.filter((lead) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.company?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const sortedLeads = filteredLeads && [...filteredLeads].sort((left, right) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (sortBy === "createdAt") {
      const leftDate = Date.parse(left.createdAt);
      const rightDate = Date.parse(right.createdAt);
      if (!Number.isFinite(leftDate) || !Number.isFinite(rightDate)) return 0;
      return (leftDate - rightDate) * direction;
    }
    const leftValue = String(sortBy === "name" ? left.name || left.email : left[sortBy] || "").toLowerCase();
    const rightValue = String(sortBy === "name" ? right.name || right.email : right[sortBy] || "").toLowerCase();
    return leftValue.localeCompare(rightValue, undefined, { numeric: true }) * direction;
  });
  const hasCustomLeadView = Boolean(searchQuery || statusFilter !== "ALL" || sortBy !== "createdAt" || sortDirection !== "desc" || viewMode !== "table");
  const statusCounts = (leads ?? []).reduce((counts, lead) => {
    counts[lead.status] = (counts[lead.status] || 0) + 1;
    return counts;
  }, {});

  function handleExport() {
    if (!sortedLeads?.length) return;

    const columns = ["name", "email", "company", "status", "source", "createdAt"];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columns.join(","),
      ...sortedLeads.map((lead) => columns.map((column) => escape(lead[column])).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `leadforge-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortBy(field);
    setSortDirection(field === "createdAt" ? "desc" : "asc");
  }

  function resetLeadView() {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortBy("createdAt");
    setSortDirection("desc");
    setViewMode("table");
  }

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
            <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={!sortedLeads?.length} title="Export the currently filtered leads">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v3h16v-3" />
              </svg>
              Export CSV
            </button>
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

      <section className="lead-status-overview" aria-label="Lead status overview">
        {[
          { label: "All leads", status: "ALL", count: leads?.length ?? 0 },
          { label: "Needs approval", status: "OUTREACH_PENDING_APPROVAL", count: statusCounts.OUTREACH_PENDING_APPROVAL || 0 },
          { label: "Replied", status: "REPLIED", count: statusCounts.REPLIED || 0 },
          { label: "Qualified", status: "QUALIFIED", count: statusCounts.QUALIFIED || 0 },
        ].map((item) => (
          <button
            key={item.status}
            type="button"
            className={`lead-status-tile ${statusFilter === item.status ? "is-active" : ""}`}
            aria-pressed={statusFilter === item.status}
            onClick={() => {
              setStatusFilter(item.status);
              setSearchQuery("");
            }}
          >
            <span>{item.label}</span>
            <strong>{item.count.toLocaleString()}</strong>
          </button>
        ))}
      </section>

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
      <div className="card lead-list-controls">
        <div className="toolbar lead-list-toolbar">
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
          {hasCustomLeadView && (
            <button type="button" className="btn btn-ghost btn-sm lead-filter-reset" onClick={resetLeadView}>
              Reset view
            </button>
          )}
          <div className="lead-view-toggle" role="group" aria-label="Lead display">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className={viewMode === mode ? "is-active" : ""}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {mode === "table" ? "List" : "Board"}
              </button>
            ))}
          </div>
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
      {viewMode === "table" && sortedLeads && sortedLeads.length > 0 && (
        <div className="table-container table-scroll fade-in">
          <table className="table">
            <thead>
              <tr>
                <th aria-sort={sortBy === "name" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="table-sort-button" onClick={() => toggleSort("name")}>
                    Contact <span aria-hidden="true">{sortBy === "name" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
                <th aria-sort={sortBy === "company" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="table-sort-button" onClick={() => toggleSort("company")}>
                    Company <span aria-hidden="true">{sortBy === "company" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
                <th>Source</th>
                <th aria-sort={sortBy === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="table-sort-button" onClick={() => toggleSort("status")}>
                    Status <span aria-hidden="true">{sortBy === "status" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
                <th aria-sort={sortBy === "createdAt" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" className="table-sort-button" onClick={() => toggleSort("createdAt")}>
                    Added <span aria-hidden="true">{sortBy === "createdAt" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
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

      {viewMode === "board" && sortedLeads && sortedLeads.length > 0 && (
        <div className="lead-board" aria-label="Lead pipeline board">
          {BOARD_STATUSES.map((status) => {
            const columnLeads = sortedLeads.filter((lead) => lead.status === status);
            return (
              <section className="lead-board-column" key={status} aria-labelledby={`board-${status}`}>
                <header className="lead-board-column-header">
                  <h2 id={`board-${status}`}>{formatStatus(status)}</h2>
                  <span>{columnLeads.length}</span>
                </header>
                <div className="lead-board-column-content">
                  {columnLeads.length ? columnLeads.map((lead) => (
                    <Link href={`/leads/${lead.id}`} key={lead.id} className="lead-board-card">
                      <span className="badge">{formatStatus(lead.status)}</span>
                      <strong>{lead.name || lead.email}</strong>
                      <span>{lead.company || lead.email}</span>
                      <time dateTime={lead.createdAt}>{new Date(lead.createdAt).toLocaleDateString()}</time>
                    </Link>
                  )) : <p className="lead-board-empty">No leads in this stage</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {sortedLeads && sortedLeads.length > 0 && (
        <div className="leads-results-count" role="status" aria-live="polite">
          Showing <strong>{sortedLeads.length}</strong> of {leads.length} leads
        </div>
      )}
    </>
  );
}
