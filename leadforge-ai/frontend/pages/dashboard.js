import useSWR from "swr";
import Link from "next/link";
import { api } from "../lib/api";
import { useMemo } from "react";

export default function DashboardPage() {
  const { data: leads } = useSWR("leads", api.getLeads);
  const { data: sourceStats } = useSWR("discovery/stats", api.getDiscoveryStats);

  const stats = useMemo(() => {
    if (!leads) return null;
    
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentLeads = leads.filter(l => new Date(l.createdAt) > lastWeek);
    const lastMonthLeads = leads.filter(l => {
      const created = new Date(l.createdAt);
      return created > lastMonth && created <= lastWeek;
    });

    return {
      total: leads.length,
      new: leads.filter(l => l.status === "NEW").length,
      replied: leads.filter(l => l.status === "REPLIED").length,
      qualified: leads.filter(l => l.status === "QUALIFIED").length,
      recentCount: recentLeads.length,
      recentGrowth: lastMonthLeads.length > 0 
        ? ((recentLeads.length - lastMonthLeads.length) / lastMonthLeads.length * 100).toFixed(1)
        : 0,
      conversionRate: leads.length > 0 
        ? (leads.filter(l => l.status === "QUALIFIED").length / leads.length * 100).toFixed(1)
        : 0,
    };
  }, [leads]);

  const recentLeads = useMemo(() => {
    if (!leads) return [];
    return [...leads]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [leads]);

  const statusDistribution = useMemo(() => {
    if (!leads) return [];
    const counts = {};
    leads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / leads.length) * 100).toFixed(1),
    }));
  }, [leads]);

  const getStatusBadgeClass = (status) => {
    const map = {
      NEW: "badge-gray",
      OUTREACH_DRAFTED: "badge-warning",
      OUTREACH_PENDING_APPROVAL: "badge-warning",
      OUTREACH_SENT: "badge-primary",
      REPLIED: "badge-success",
      QUALIFIED: "badge-success",
      DISQUALIFIED: "badge-error",
    };
    return map[status] || "badge-gray";
  };

  if (!stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">
              Overview of your lead generation and outreach performance
            </p>
          </div>
          <div className="page-actions">
            <Link href="/discover" className="btn btn-primary">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Discover Leads
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Leads</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className={`stat-change ${stats.recentGrowth >= 0 ? 'positive' : 'negative'}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={stats.recentGrowth >= 0 ? "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" : "M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898"} />
            </svg>
            {Math.abs(stats.recentGrowth)}% from last week
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Leads</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.replied}</div>
          <div className="stat-change">Currently in conversation</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Qualified</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.qualified}</div>
          <div className="stat-change positive">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
            </svg>
            {stats.conversionRate}% conversion rate
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">New This Week</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.recentCount}</div>
          <div className="stat-change">Last 7 days</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", marginBottom: "24px" }}>
        {/* Recent Leads */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Leads</div>
              <div className="card-subtitle">Your latest prospects</div>
            </div>
            <Link href="/" className="btn btn-sm btn-secondary">View All</Link>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{lead.name || lead.email}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>{lead.email}</div>
                    </td>
                    <td>{lead.company || "—"}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentLeads.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-title">No leads yet</div>
              <div className="empty-state-description">Start by discovering or adding leads</div>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Lead Status</div>
              <div className="card-subtitle">Distribution by stage</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {statusDistribution.map(({ status, count, percentage }) => (
              <div key={status}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{status.replace(/_/g, " ")}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{count}</span>
                </div>
                <div style={{ height: "6px", background: "var(--gray-200)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${percentage}%`,
                    background: "var(--primary-600)",
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      {sourceStats && Object.keys(sourceStats).length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Lead Sources</div>
              <div className="card-subtitle">Where your leads are coming from</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {Object.entries(sourceStats).map(([source, count]) => (
              <div key={source} style={{
                padding: "16px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>{count}</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{source}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
