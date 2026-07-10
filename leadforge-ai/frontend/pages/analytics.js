import useSWR from "swr";
import { api } from "../lib/api";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const { data: leads } = useSWR("leads", api.getLeads);

  const analytics = useMemo(() => {
    if (!leads) return null;

    // Growth over time (last 30 days)
    const now = new Date();
    const growthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const count = leads.filter(l => new Date(l.createdAt) <= date).length;
      growthData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        leads: count,
      });
    }

    // Status distribution
    const statusCounts = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
    }));

    // Source distribution
    const sourceCounts = {};
    leads.forEach(lead => {
      const source = lead.source || "Unknown";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const sourceData = Object.entries(sourceCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // Conversion funnel
    const funnelData = [
      { stage: "Total Leads", count: leads.length },
      { stage: "Outreach Sent", count: leads.filter(l => ["OUTREACH_SENT", "REPLIED", "QUALIFIED"].includes(l.status)).length },
      { stage: "Replied", count: leads.filter(l => ["REPLIED", "QUALIFIED"].includes(l.status)).length },
      { stage: "Qualified", count: leads.filter(l => l.status === "QUALIFIED").length },
    ];

    // Key metrics
    const conversionRate = leads.length > 0 
      ? (leads.filter(l => l.status === "QUALIFIED").length / leads.length * 100).toFixed(1)
      : 0;

    const responseRate = leads.filter(l => ["OUTREACH_SENT", "REPLIED", "QUALIFIED"].includes(l.status)).length > 0
      ? (leads.filter(l => ["REPLIED", "QUALIFIED"].includes(l.status)).length / 
         leads.filter(l => ["OUTREACH_SENT", "REPLIED", "QUALIFIED"].includes(l.status)).length * 100).toFixed(1)
      : 0;

    return {
      growthData,
      statusData,
      sourceData,
      funnelData,
      conversionRate,
      responseRate,
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(l => l.status === "QUALIFIED").length,
    };
  }, [leads]);

  const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

  if (!analytics) {
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
            <h1 className="page-title">Analytics</h1>
            <p className="page-description">
              Track performance and gain insights from your lead generation efforts
            </p>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ marginBottom: "32px" }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Conversion Rate</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{analytics.conversionRate}%</div>
          <div className="stat-change">Leads to qualified</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Response Rate</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{analytics.responseRate}%</div>
          <div className="stat-change">Outreach to reply</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Leads</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{analytics.totalLeads}</div>
          <div className="stat-change">All time</div>
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
          <div className="stat-value">{analytics.qualifiedLeads}</div>
          <div className="stat-change">Ready to convert</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Lead Growth */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Lead Growth</div>
              <div className="card-subtitle">Last 30 days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--text-tertiary)" style={{ fontSize: "12px" }} />
              <Tooltip 
                contentStyle={{ 
                  background: "var(--bg-primary)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  fontSize: "13px"
                }} 
              />
              <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Status Distribution</div>
              <div className="card-subtitle">Current breakdown</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: "var(--bg-primary)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  fontSize: "13px"
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Conversion Funnel */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Conversion Funnel</div>
              <div className="card-subtitle">Lead journey stages</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-tertiary)" style={{ fontSize: "12px" }} />
              <YAxis dataKey="stage" type="category" stroke="var(--text-tertiary)" style={{ fontSize: "12px" }} width={120} />
              <Tooltip 
                contentStyle={{ 
                  background: "var(--bg-primary)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  fontSize: "13px"
                }} 
              />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Lead Sources</div>
              <div className="card-subtitle">Where leads come from</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-tertiary)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--text-tertiary)" style={{ fontSize: "12px" }} />
              <Tooltip 
                contentStyle={{ 
                  background: "var(--bg-primary)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  fontSize: "13px"
                }} 
              />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
