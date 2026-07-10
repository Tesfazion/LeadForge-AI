import { useRouter } from "next/router";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: lead, error, isLoading, mutate } = useSWR(id ? `lead-${id}` : null, () => api.getLead(id));
  const [drafting, setDrafting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busyConvo, setBusyConvo] = useState(null);
  const [activeTab, setActiveTab] = useState("conversation");

  // Auto-refresh for real-time updates during agent work
  useEffect(() => {
    if (!lead) return;
    const hasActiveWork = lead.projects?.some(p => ["BUILDING", "GATHERING_REQUIREMENTS"].includes(p.status));
    if (!hasActiveWork) return;

    const interval = setInterval(() => mutate(), 3000);
    return () => clearInterval(interval);
  }, [lead, mutate]);

  async function handleDraftOutreach() {
    setDrafting(true);
    try {
      await api.draftOutreach(id);
      mutate();
    } catch (err) {
      alert(err.message);
    } finally {
      setDrafting(false);
    }
  }

  async function handleReply(conversationId) {
    if (!replyText.trim()) return;
    setBusyConvo(conversationId);
    try {
      await api.replyToConversation(conversationId, replyText);
      setReplyText("");
      mutate();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyConvo(null);
    }
  }

  async function handleExtractRequirements(conversationId) {
    setBusyConvo(conversationId);
    try {
      await api.extractRequirements(conversationId);
      mutate();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyConvo(null);
    }
  }

  async function handleBuild(projectId) {
    setBusyConvo(projectId);
    try {
      await api.triggerBuild(projectId);
      mutate();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyConvo(null);
    }
  }

  if (isLoading) return <div className="empty-state"><div className="spinner" /></div>;
  if (error) return <div className="empty-state">Failed to load lead.</div>;
  if (!lead) return null;

  // Calculate pipeline progress
  const pipelineSteps = [
    { id: "new", label: "New Lead", icon: "user", active: true },
    { id: "outreach", label: "Outreach Sent", icon: "mail", active: lead.conversations.length > 0 },
    { id: "replied", label: "Conversation", icon: "chat", active: lead.status === "REPLIED" || lead.status === "QUALIFIED" },
    { id: "requirements", label: "Requirements", icon: "clipboard", active: lead.projects.length > 0 },
    { id: "deployed", label: "Site Deployed", icon: "rocket", active: lead.projects.some(p => p.status === "DEPLOYED") },
  ];

  const currentStepIndex = pipelineSteps.filter(s => s.active).length - 1;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <button 
                onClick={() => router.back()} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  padding: "4px", 
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="page-title">{lead.name || lead.email}</h1>
              <span className={`badge status-${lead.status.toLowerCase().replace(/_/g, '-')}`}>
                {lead.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="page-description">
              {lead.company && <><strong>{lead.company}</strong> · </>}
              {lead.email}
              {lead.phone && <> · {lead.phone}</>}
            </p>
          </div>
          {lead.conversations.length === 0 && (
            <button className="btn-primary" onClick={handleDraftOutreach} disabled={drafting}>
              {drafting ? "Drafting..." : "Draft Outreach Email"}
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "20px", color: "var(--text-secondary)" }}>
            Pipeline Progress
          </h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {pipelineSteps.map((step, index) => (
              <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: step.active ? "var(--primary)" : "var(--bg-tertiary)",
                    color: step.active ? "white" : "var(--text-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "18px",
                    marginBottom: "8px",
                    transition: "all 0.3s ease",
                  }}>
                    {index < currentStepIndex ? "✓" : index + 1}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: step.active ? "var(--text-primary)" : "var(--text-tertiary)",
                    textAlign: "center",
                  }}>
                    {step.label}
                  </div>
                </div>
                
                {index < pipelineSteps.length - 1 && (
                  <div style={{
                    height: "2px",
                    flex: 1,
                    background: step.active && pipelineSteps[index + 1].active 
                      ? "var(--primary)" 
                      : "var(--border)",
                    marginBottom: "32px",
                    transition: "all 0.3s ease",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "2px", 
        marginBottom: "24px",
        borderBottom: "2px solid var(--border)",
      }}>
        {["conversation", "requirements", "projects"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "var(--primary)" : "transparent"}`,
              color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "conversation" && lead.conversations.length > 0 && (
              <span style={{
                marginLeft: "8px",
                padding: "2px 6px",
                background: "var(--primary-100)",
                color: "var(--primary)",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 600,
              }}>
                {lead.conversations.reduce((acc, c) => acc + c.messages.length, 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation Tab */}
      {activeTab === "conversation" && (
        <>
          {lead.conversations.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "48px" }}>
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                  No conversation yet
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Start the outreach process by drafting an initial email
                </div>
                <button className="btn-primary" onClick={handleDraftOutreach} disabled={drafting}>
                  {drafting ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                      Drafting with AI...
                    </>
                  ) : (
                    "Draft Outreach Email"
                  )}
                </button>
              </div>
            </div>
          ) : (
            lead.conversations.map((conv) => (
              <div key={conv.id} className="card" style={{ marginBottom: "24px" }}>
                {/* Conversation Header */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "20px",
                }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                      {conv.subject || "Conversation"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      {conv.messages.length} messages
                    </div>
                  </div>
                  
                  {conv.messages.some((m) => m.role === "LEAD") && !lead.projects.length && (
                    <button 
                      className="btn-primary"
                      onClick={() => handleExtractRequirements(conv.id)} 
                      disabled={busyConvo === conv.id}
                    >
                      {busyConvo === conv.id ? (
                        <>
                          <div className="spinner" style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: "8px" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                          Extract Requirements
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
                  {conv.messages.map((m) => (
                    <div key={m.id} style={{
                      display: "flex",
                      flexDirection: m.role === "LEAD" ? "row" : "row-reverse",
                      gap: "12px",
                    }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: m.role === "LEAD" ? "var(--primary-100)" : "var(--bg-tertiary)",
                        color: m.role === "LEAD" ? "var(--primary)" : "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "14px",
                        flexShrink: 0,
                      }}>
                        {m.role === "LEAD" ? lead.name?.[0]?.toUpperCase() || "L" : "AI"}
                      </div>
                      
                      <div style={{
                        flex: 1,
                        maxWidth: "70%",
                        padding: "12px 16px",
                        borderRadius: "var(--radius-lg)",
                        background: m.role === "LEAD" ? "var(--bg-secondary)" : "var(--primary)",
                        color: m.role === "LEAD" ? "var(--text-primary)" : "white",
                      }}>
                        <div style={{ 
                          fontSize: "11px", 
                          fontWeight: 600, 
                          marginBottom: "6px",
                          opacity: 0.7,
                        }}>
                          {m.role === "LEAD" ? lead.name : "AI Agent"}
                          {!m.approved && m.role !== "LEAD" && (
                            <span style={{
                              marginLeft: "8px",
                              padding: "2px 6px",
                              background: "rgba(255,255,255,0.2)",
                              borderRadius: "var(--radius-sm)",
                            }}>
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                          {m.content}
                        </div>
                        <div style={{ 
                          fontSize: "11px", 
                          marginTop: "8px",
                          opacity: 0.6,
                        }}>
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div style={{ 
                  padding: "16px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius)",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "var(--text-secondary)" }}>
                    Simulate Lead Reply (for testing)
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      placeholder="Type a reply as the lead..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(conv.id);
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="btn-primary"
                      onClick={() => handleReply(conv.id)} 
                      disabled={busyConvo === conv.id || !replyText.trim()}
                    >
                      {busyConvo === conv.id ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Requirements Tab */}
      {activeTab === "requirements" && (
        <>
          {lead.projects.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "48px" }}>
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                  No requirements extracted yet
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Have a conversation with the lead first, then extract requirements
                </div>
              </div>
            </div>
          ) : (
            lead.projects.map((project) => (
              <div key={project.id} className="card" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                      {project.name}
                    </h3>
                    <span className={`badge status-${project.status.toLowerCase().replace(/_/g, '-')}`}>
                      {project.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {project.requirements && (
                  <div style={{ 
                    padding: "16px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    fontSize: "13px",
                    fontFamily: "monospace",
                  }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {JSON.stringify(project.requirements, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <>
          {lead.projects.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "48px" }}>
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                  </svg>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                  No projects yet
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Extract requirements first, then build and deploy a site
                </div>
              </div>
            </div>
          ) : (
            lead.projects.map((project) => (
              <div key={project.id} className="card" style={{ marginBottom: "24px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                      {project.name}
                    </h3>
                    <span className={`badge status-${project.status.toLowerCase().replace(/_/g, '-')}`}>
                      {project.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  
                  {project.status === "READY_TO_BUILD" && (
                    <button 
                      className="btn-primary"
                      onClick={() => handleBuild(project.id)} 
                      disabled={busyConvo === project.id}
                    >
                      {busyConvo === project.id ? (
                        <>
                          <div className="spinner" style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                          Building...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: "8px" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          </svg>
                          Build & Deploy
                        </>
                      )}
                    </button>
                  )}
                </div>

                {project.status === "BUILDING" && (
                  <div style={{
                    padding: "16px",
                    background: "var(--warning-50)",
                    border: "1px solid var(--warning-200)",
                    borderRadius: "var(--radius)",
                    marginBottom: "16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="spinner" />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                          Building and deploying...
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          The Developer Agent is generating your site and deploying to Vercel
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {project.deployUrl && (
                  <div style={{
                    padding: "16px",
                    background: "var(--success-50)",
                    border: "1px solid var(--success-200)",
                    borderRadius: "var(--radius)",
                    marginBottom: "16px",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--success)" }}>
                      🎉 Site deployed successfully!
                    </div>
                    <a 
                      href={project.deployUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--primary)",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {project.deployUrl}
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                )}

                {project.buildLog && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--text-secondary)" }}>
                      Build Log:
                    </div>
                    <div style={{
                      padding: "12px",
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      color: "var(--text-secondary)",
                    }}>
                      {project.buildLog}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
