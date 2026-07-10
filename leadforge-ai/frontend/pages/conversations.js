import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";

export default function ConversationsPage() {
  const { data: leads } = useSWR("leads", api.getLeads);
  const [filter, setFilter] = useState("all");

  // Filter leads with conversations
  const conversationLeads = leads?.filter(lead => 
    ["REPLIED", "QUALIFIED", "OUTREACH_SENT"].includes(lead.status)
  ) || [];

  const getStatusBadge = (status) => {
    const map = {
      OUTREACH_SENT: "badge-primary",
      REPLIED: "badge-success",
      QUALIFIED: "badge-success",
    };
    return map[status] || "badge-gray";
  };

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

      {/* Filters */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            className={filter === "all" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button 
            className={filter === "active" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button 
            className={filter === "qualified" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
            onClick={() => setFilter("qualified")}
          >
            Qualified
          </button>
        </div>
      </div>

      {/* Conversations List */}
      {conversationLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="empty-state-title">No active conversations</h3>
          <p className="empty-state-description">
            Start outreach to begin conversations with your leads
          </p>
          <div style={{ marginTop: "24px" }}>
            <Link href="/" className="btn btn-primary">View Leads</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {conversationLeads.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`} className="card" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "start", flex: 1 }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--primary-500)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {(lead.name || lead.email)[0].toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                      {lead.name || lead.email}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {lead.company || "—"} • {lead.email}
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

                <span className={`badge ${getStatusBadge(lead.status)}`}>
                  {lead.status.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{
                display: "flex",
                gap: "24px",
                fontSize: "13px",
                color: "var(--text-tertiary)",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
              }}>
                <span>Last updated: {new Date(lead.updatedAt).toLocaleString()}</span>
                <span>Added: {new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
