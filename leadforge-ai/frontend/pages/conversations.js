/**
 * Conversations page
 *
 * Lists leads that have an active conversation (status: OUTREACH_SENT,
 * REPLIED, or QUALIFIED) and lets the user filter by activity level.
 */

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { getStatusBadgeClass, formatStatus, formatDate, formatDateTime, getInitial } from "../lib/utils";

// Statuses that indicate a conversation has started
const ACTIVE_STATUSES = ["REPLIED", "QUALIFIED", "OUTREACH_SENT"];

export default function ConversationsPage() {
  const { data: leads } = useSWR("leads", api.getLeads);
  const [filter, setFilter] = useState("all");

  // First: only show leads that have a conversation
  const conversationLeads = leads?.filter(
    (lead) => ACTIVE_STATUSES.includes(lead.status)
  ) ?? [];

  // Then apply the active filter tab
  const filteredLeads = conversationLeads.filter((lead) => {
    if (filter === "active")    return lead.status === "OUTREACH_SENT";
    if (filter === "qualified") return lead.status === "QUALIFIED";
    return true; // "all"
  });

  const filters = [
    { key: "all",       label: "All",       count: conversationLeads.length },
    { key: "active",    label: "Active",    count: conversationLeads.filter((l) => l.status === "OUTREACH_SENT").length },
    { key: "qualified", label: "Qualified", count: conversationLeads.filter((l) => l.status === "QUALIFIED").length },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Conversations</h1>
            <p className="page-description">
              Track and manage all active conversations with leads
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="card">
        <div className="segmented" role="tablist" aria-label="Filter conversations">
          {filters.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`segmented-item ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
              {count > 0 && <span className="segmented-count">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredLeads.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="empty-state-title">
            {filter === "all" ? "No active conversations" : `No ${filter} conversations`}
          </h3>
          <p className="empty-state-description">
            {filter === "all"
              ? "Start outreach to begin conversations with your leads"
              : "Try switching to the 'All' tab to see all conversations"}
          </p>
          {filter === "all" && (
            <div style={{ marginTop: "24px" }}>
              <Link href="/leads" className="btn btn-primary">View Leads</Link>
            </div>
          )}
        </div>
      )}

      {/* Conversation cards */}
      {filteredLeads.length > 0 && (
        <div className="grid-stack">
          {filteredLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="card is-interactive"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                {/* Avatar + name */}
                <div style={{ display: "flex", gap: "16px", alignItems: "start", flex: 1 }}>
                  <div className="avatar avatar-lg" aria-hidden="true">
                    {getInitial(lead.name || lead.email)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                      {lead.name || lead.email}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {lead.company || "—"} · {lead.email}
                    </div>
                    {lead.notes && (
                      <div style={{
                        fontSize: "13px",
                        color: "var(--text-tertiary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "600px",
                      }}>
                        {lead.notes.split("\n")[0]}
                      </div>
                    )}
                  </div>
                </div>

                <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                  {formatStatus(lead.status)}
                </span>
              </div>

              {/* Meta row */}
              <div className="meta-row">
                <span>Last updated: {formatDateTime(lead.updatedAt)}</span>
                <span>Added: {formatDate(lead.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
