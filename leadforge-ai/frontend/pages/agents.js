import { useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "../lib/api";

export default function AgentsPage() {
  const { data: leads } = useSWR("leads", api.getLeads);
  const { data: pendingOutreach } = useSWR("outreach/pending", api.getPendingOutreach);
  const { data: activities } = useSWR("activities", () => api.getActivities(20), { refreshInterval: 3000 });
  const { data: stats } = useSWR("activities/stats", api.getActivitiesStats, { refreshInterval: 5000 });
  const [agentStatus, setAgentStatus] = useState({
    outreach: { status: "idle", lastActivity: null, processed: 0 },
    chat: { status: "idle", lastActivity: null, processed: 0 },
    requirements: { status: "idle", lastActivity: null, processed: 0 },
    developer: { status: "idle", lastActivity: null, processed: 0 },
  });

  // Update agent status from activities
  useEffect(() => {
    if (!activities) return;
    
    const statusMap = {};
    ["outreach", "chat", "requirements", "developer"].forEach((agent) => {
      const agentActivities = activities.filter(a => a.agent === agent);
      if (agentActivities.length === 0) {
        statusMap[agent] = { status: "idle", lastActivity: null, processed: 0 };
      } else {
        const latest = agentActivities[0];
        const timeSince = Date.now() - new Date(latest.timestamp).getTime();
        const isWorking = latest.status === "started" && timeSince < 60000;
        
        statusMap[agent] = {
          status: isWorking ? "working" : latest.status === "error" ? "error" : latest.status === "completed" ? "success" : "idle",
          lastActivity: latest,
          processed: agentActivities.filter(a => a.status === "completed").length,
        };
      }
    });
    
    setAgentStatus(statusMap);
  }, [activities]);

  // Calculate agent stats
  const agentStats = {
    outreach: {
      pending: stats?.outreach?.pending || 0,
      completed: stats?.outreach?.sent || 0,
    },
    chat: {
      active: stats?.chat?.active || 0,
      total: leads?.filter(l => ["REPLIED", "QUALIFIED"].includes(l.status)).length || 0,
    },
    requirements: {
      extracted: stats?.requirements?.extracted || 0,
      pending: leads?.filter(l => l.status === "QUALIFIED").length || 0,
    },
    developer: {
      built: stats?.developer?.deployed || 0,
      building: stats?.developer?.building || 0,
    },
  };

  const agents = [
    {
      id: "outreach",
      name: "Outreach Agent",
      role: "Email Drafting",
      description: "Drafts personalized cold emails for new leads using AI",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      color: "#0ea5e9",
      workflow: [
        "Analyzes lead profile",
        "Researches company context",
        "Drafts personalized email",
        "Saves for approval",
      ],
      stats: {
        pending: agentStats.outreach.pending,
        completed: agentStats.outreach.completed,
      },
      triggers: ["New lead created", "Manual request"],
    },
    {
      id: "chat",
      name: "Chat Agent",
      role: "Conversation Management",
      description: "Continues conversations with leads who reply, building rapport and gathering information",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      color: "#8b5cf6",
      workflow: [
        "Reads full conversation history",
        "Understands context",
        "Generates natural response",
        "Persists to database",
      ],
      stats: {
        active: agentStats.chat.active,
        total: agentStats.chat.total,
      },
      triggers: ["Lead replies", "Follow-up needed"],
    },
    {
      id: "requirements",
      name: "Requirements Agent",
      role: "Needs Analysis",
      description: "Extracts structured requirements from conversations into actionable JSON specs",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      color: "#10b981",
      workflow: [
        "Analyzes conversation",
        "Identifies requirements",
        "Validates with Zod",
        "Saves structured JSON",
      ],
      stats: {
        extracted: agentStats.requirements.extracted,
        pending: agentStats.requirements.pending,
      },
      triggers: ["Enough conversation data", "Manual extraction"],
    },
    {
      id: "developer",
      name: "Developer Agent",
      role: "Code Generation",
      description: "Generates and deploys Next.js websites from requirements specifications",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      ),
      color: "#f59e0b",
      workflow: [
        "Reads requirements JSON",
        "Generates Next.js code",
        "Creates components",
        "Deploys to Vercel",
      ],
      stats: {
        built: agentStats.developer.built,
        building: agentStats.developer.building,
      },
      triggers: ["Requirements approved", "Manual build"],
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      idle: "var(--gray-500)",
      working: "var(--warning)",
      success: "var(--success)",
      error: "var(--error)",
    };
    return colors[status] || colors.idle;
  };

  const getStatusText = (status) => {
    const texts = {
      idle: "Idle",
      working: "Working...",
      success: "Success",
      error: "Error",
    };
    return texts[status] || "Unknown";
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">AI Agents</h1>
            <p className="page-description">
              Monitor and manage all four AI agents powering your lead automation pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Flow Visualization */}
      <div className="card" style={{ marginBottom: "32px", background: "linear-gradient(135deg, var(--primary-50), var(--bg-primary))" }}>
        <div style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
            Automation Pipeline
          </h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px", overflowX: "auto" }}>
            {agents.map((agent, index) => (
              <div key={agent.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  padding: "16px",
                  background: "white",
                  border: `2px solid ${agent.color}`,
                  borderRadius: "var(--radius-lg)",
                  minWidth: "160px",
                  textAlign: "center",
                }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    margin: "0 auto 8px",
                    color: agent.color,
                  }}>
                    {agent.icon}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                    {agent.name}
                  </div>
                  <div style={{ 
                    fontSize: "11px", 
                    color: getStatusColor(agentStatus[agent.id].status),
                    fontWeight: 500,
                  }}>
                    {getStatusText(agentStatus[agent.id].status)}
                  </div>
                </div>
                
                {index < agents.length - 1 && (
                  <svg 
                    width="32" 
                    height="24" 
                    fill="none" 
                    viewBox="0 0 32 24" 
                    style={{ flexShrink: 0, color: "var(--border)" }}
                  >
                    <path 
                      d="M0 12h28m0 0l-6-6m6 6l-6 6" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "24px" }}>
        {agents.map((agent) => (
          <div key={agent.id} className="card">
            {/* Agent Header */}
            <div style={{ 
              display: "flex", 
              gap: "16px", 
              marginBottom: "20px",
              paddingBottom: "20px",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ 
                width: "56px", 
                height: "56px",
                borderRadius: "var(--radius-lg)",
                background: `${agent.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: agent.color,
                flexShrink: 0,
              }}>
                {agent.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  {agent.role}
                </div>
                <div style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: `${getStatusColor(agentStatus[agent.id].status)}20`,
                  color: getStatusColor(agentStatus[agent.id].status),
                }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: getStatusColor(agentStatus[agent.id].status),
                  }} />
                  {getStatusText(agentStatus[agent.id].status)}
                </div>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.6" }}>
              {agent.description}
            </p>

            {/* Workflow */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "var(--text-secondary)" }}>
                Workflow:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {agent.workflow.map((step, index) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    fontSize: "13px",
                  }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: `${agent.color}20`,
                      color: agent.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "12px",
              padding: "16px",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius)",
            }}>
              {Object.entries(agent.stats).map(([key, value]) => (
                <div key={key}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: agent.color }}>
                    {value}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", textTransform: "capitalize" }}>
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>

            {/* Triggers */}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px" }}>
                Triggered by:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {agent.triggers.map((trigger) => (
                  <span
                    key={trigger}
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="card" style={{ marginTop: "32px" }}>
        <div className="card-header">
          <div className="card-title">Recent Activity</div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            Updates every 3 seconds
          </div>
        </div>
        
        {!activities || activities.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px" }}>
            <div className="empty-state-icon" style={{ margin: "0 auto 16px", width: "48px", height: "48px" }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
              No recent activity
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Agent activities will appear here when they start working
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {activities.map((activity) => {
              const agent = agents.find(a => a.id === activity.agent);
              const statusColor = activity.status === "completed" ? "var(--success)" : 
                                 activity.status === "error" ? "var(--error)" : 
                                 "var(--warning)";
              const actionLabel = activity.action.replace(/_/g, " ");
              
              return (
                <div 
                  key={activity.id}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `${agent?.color}20`,
                    color: agent?.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {agent?.icon}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>
                        {agent?.name}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: `${statusColor}20`,
                        color: statusColor,
                        fontWeight: 500,
                      }}>
                        {activity.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      {actionLabel}
                      {activity.metadata?.leadName && ` for ${activity.metadata.leadName}`}
                      {activity.metadata?.projectName && ` - ${activity.metadata.projectName}`}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
