/**
 * Lead detail page  (/leads/[id])
 *
 * Three-tab layout:
 *   • Conversation — full message thread + reply input (test harness)
 *   • Requirements — extracted JSON requirements per project
 *   • Projects     — build / deploy controls and status
 *
 * `pendingAction` tracks which conversation or project ID currently has an
 * in-flight API call, so only the relevant button shows a loading state.
 */

import { useRouter } from "next/router";
import Link from "next/link";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../../components/Toast";
import { getStatusBadgeClass, getProjectStatusBadgeClass, formatStatus, getInitial } from "../../lib/utils";

// Pipeline steps shown above the tabs
const PIPELINE = [
  { id: "new",          label: "New Lead",      check: ()          => true },
  { id: "outreach",     label: "Outreach Sent", check: (lead)      => lead.conversations.length > 0 },
  { id: "conversation", label: "Conversation",  check: (lead)      => ["REPLIED", "QUALIFIED"].includes(lead.status) },
  { id: "requirements", label: "Requirements",  check: (lead)      => lead.projects.length > 0 },
  { id: "deployed",     label: "Site Deployed", check: (lead)      => lead.projects.some((p) => p.status === "DEPLOYED") },
];

export default function LeadDetailPage() {
  const router  = useRouter();
  const { id }  = router.query;

  const { data: lead, error, isLoading, mutate } = useSWR(
    id ? `lead-${id}` : null,
    () => api.getLead(id)
  );

  const [replyText,     setReplyText]     = useState("");
  const [pendingAction, setPendingAction] = useState(null); // ID of the conv/project being acted on
  const [activeTab,     setActiveTab]     = useState("conversation");

  // Auto-refresh while an active build/requirements extraction is running
  useEffect(() => {
    if (!lead) return;
    const isActive = lead.projects?.some((p) =>
      ["BUILDING", "GATHERING_REQUIREMENTS", "DEPLOYING"].includes(p.status)
    );
    if (!isActive) return;
    const interval = setInterval(() => mutate(), 3000);
    return () => clearInterval(interval);
  }, [lead, mutate]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  async function handleDraftOutreach() {
    setPendingAction("draft");
    try {
      await api.draftOutreach(id);
      mutate();
      showToast("Outreach email drafted — check the Outreach queue", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReply(conversationId) {
    if (!replyText.trim()) return;
    setPendingAction(conversationId);
    try {
      await api.replyToConversation(conversationId, replyText);
      setReplyText("");
      mutate();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleExtractRequirements(conversationId) {
    setPendingAction(conversationId);
    try {
      await api.extractRequirements(conversationId);
      mutate();
      showToast("Requirements extracted successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleBuild(projectId) {
    setPendingAction(projectId);
    try {
      await api.triggerBuild(projectId);
      mutate();
      showToast("Build started — check back in a moment", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPendingAction(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  // Header shown in the loading / error / not-found states, so the page never
  // renders as an unlabelled blank while the API is unreachable.
  const fallbackHeader = (
    <div className="page-header">
      <div className="page-header-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <button onClick={() => router.back()} className="btn-icon" aria-label="Go back">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Lead</h1>
          </div>
          <p className="page-description">Conversation, requirements and website projects</p>
        </div>
      </div>
    </div>
  );

  // router.query is empty on the first client render for dynamic routes, so
  // treat a missing id as "still resolving" rather than "not found".
  if (!id || isLoading) {
    return (
      <>
        {fallbackHeader}
        <div className="empty-state"><div className="spinner" /></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {fallbackHeader}
        <div className="banner banner-error">
          Failed to load this lead. Check that the API is reachable, then reload.
        </div>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        {fallbackHeader}
        <div className="empty-state">
          <h3 className="empty-state-title">Lead not found</h3>
          <p className="empty-state-description">
            It may have been deleted, or the link is incorrect.
          </p>
          <Link href="/leads" className="btn btn-primary">Back to leads</Link>
        </div>
      </>
    );
  }

  const pipelineSteps = PIPELINE.map((step) => ({
    ...step,
    active: step.check(lead),
  }));
  const completedCount = pipelineSteps.filter((s) => s.active).length - 1;

  const totalMessages = lead.conversations.reduce(
    (acc, c) => acc + c.messages.length,
    0
  );

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <button
                onClick={() => router.back()}
                className="btn-icon"
                aria-label="Go back"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="page-title" style={{ marginBottom: 0 }}>
                {lead.name || lead.email}
              </h1>
              <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                {formatStatus(lead.status)}
              </span>
            </div>
            <p className="page-description">
              {lead.company && <><strong>{lead.company}</strong> · </>}
              {lead.email}
            </p>
          </div>

          {lead.conversations.length === 0 && (
            <button
              className="btn btn-primary"
              onClick={handleDraftOutreach}
              disabled={pendingAction === "draft"}
            >
              {pendingAction === "draft" ? "Drafting…" : "Draft Outreach Email"}
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Pipeline stepper                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "20px", color: "var(--text-secondary)" }}>
          Pipeline progress
        </h3>

        <div style={{ display: "flex", alignItems: "center" }}>
          {pipelineSteps.map((step, index) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                {/* Step circle */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: step.active ? "var(--primary-700)" : "var(--bg-tertiary)",
                  color: step.active ? "white" : "var(--text-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  marginBottom: "8px",
                  transition: "background 0.3s ease",
                }}>
                  {index < completedCount ? "✓" : index + 1}
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

              {/* Connector line */}
              {index < pipelineSteps.length - 1 && (
                <div style={{
                  height: "2px",
                  flex: 1,
                  background: step.active && pipelineSteps[index + 1].active
                    ? "var(--primary-600)"
                    : "var(--border)",
                  marginBottom: "28px",
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tabs                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: "2px solid var(--border)" }}>
        {["conversation", "requirements", "projects"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 24px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "var(--brand-primary)" : "transparent"}`,
              color: activeTab === tab ? "var(--primary-700)" : "var(--text-secondary)",
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "-2px",
              transition: "color 0.2s ease",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "conversation" && totalMessages > 0 && (
              <span style={{
                marginLeft: "8px",
                padding: "2px 8px",
                background: "var(--primary-50)",
                color: "var(--primary-700)",
                border: "1px solid var(--primary-100)",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 700,
              }}>
                {totalMessages}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ================================================================== */}
      {/* Tab: Conversation                                                    */}
      {/* ================================================================== */}
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
                <button
                  className="btn btn-primary"
                  onClick={handleDraftOutreach}
                  disabled={pendingAction === "draft"}
                >
                  {pendingAction === "draft" ? (
                    <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Drafting with AI…</>
                  ) : (
                    "Draft Outreach Email"
                  )}
                </button>
              </div>
            </div>
          ) : (
            lead.conversations.map((conv) => (
              <div key={conv.id} className="card" style={{ marginBottom: "24px" }}>
                {/* Conversation header */}
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
                      {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Extract requirements button — shown once the lead has replied */}
                  {conv.messages.some((m) => m.role === "LEAD") && lead.projects.length === 0 && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleExtractRequirements(conv.id)}
                      disabled={!!pendingAction}
                    >
                      {pendingAction === conv.id ? (
                        <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Extracting…</>
                      ) : (
                        "Extract Requirements"
                      )}
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
                  {conv.messages.map((m) => {
                    const isLead = m.role === "LEAD";
                    return (
                      <div
                        key={m.id}
                        style={{ display: "flex", flexDirection: isLead ? "row" : "row-reverse", gap: "12px" }}
                      >
                        {/* Avatar */}
                        <div className={`avatar avatar-sm ${isLead ? "" : "is-agent"}`} aria-hidden="true">
                          {isLead ? getInitial(lead.name) : "AI"}
                        </div>

                        {/* Bubble */}
                        <div style={{
                          flex: 1,
                          maxWidth: "70%",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-lg)",
                          background: isLead ? "var(--bg-secondary)" : "var(--primary-700)",
                          color: isLead ? "var(--text-primary)" : "white",
                        }}>
                          <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "6px", opacity: 0.85 }}>
                            {isLead ? (lead.name || "Lead") : "AI Agent"}
                            {!m.approved && !isLead && (
                              <span style={{ marginLeft: "8px", padding: "2px 6px", background: "rgba(255,255,255,0.25)", color: "inherit", fontWeight: 600, borderRadius: "var(--radius-sm)" }}>
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: "11px", marginTop: "8px", opacity: 0.6 }}>
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply input (test harness) */}
                <div style={{ padding: "16px", background: "var(--bg-secondary)", borderRadius: "var(--radius)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "var(--text-tertiary)" }}>
                    {/* Note: this simulates an inbound lead reply for testing purposes */}
                    Simulate Lead Reply (for testing)
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      className="form-input"
                      placeholder="Type a reply as the lead…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(conv.id);
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReply(conv.id)}
                      disabled={pendingAction === conv.id || !replyText.trim()}
                    >
                      {pendingAction === conv.id ? "Sending…" : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ================================================================== */}
      {/* Tab: Requirements                                                    */}
      {/* ================================================================== */}
      {activeTab === "requirements" && (
        <>
          {lead.projects.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "48px" }}>
                <h3 className="empty-state-title">No requirements extracted yet</h3>
                <p className="empty-state-description">
                  Have a conversation with the lead first, then extract requirements
                </p>
              </div>
            </div>
          ) : (
            lead.projects.map((project) => (
              <div key={project.id} className="card" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>{project.name}</h3>
                    <span className={`badge ${getProjectStatusBadgeClass(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                  </div>
                </div>

                {project.requirements ? (
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
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    Requirements not yet extracted for this project.
                  </p>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ================================================================== */}
      {/* Tab: Projects                                                        */}
      {/* ================================================================== */}
      {activeTab === "projects" && (
        <>
          {lead.projects.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "48px" }}>
                <h3 className="empty-state-title">No projects yet</h3>
                <p className="empty-state-description">
                  Extract requirements first, then build and deploy a site
                </p>
              </div>
            </div>
          ) : (
            lead.projects.map((project) => (
              <div key={project.id} className="card" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>{project.name}</h3>
                    <span className={`badge ${getProjectStatusBadgeClass(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  {project.status === "READY_TO_BUILD" && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleBuild(project.id)}
                      disabled={pendingAction === project.id}
                    >
                      {pendingAction === project.id ? (
                        <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Building…</>
                      ) : (
                        "Build & Deploy"
                      )}
                    </button>
                  )}
                </div>

                {/* Building banner */}
                {(project.status === "BUILDING" || project.status === "DEPLOYING") && (
                  <div style={{
                    padding: "16px",
                    background: "var(--warning-50)",
                    border: "1px solid var(--warning-200)",
                    borderRadius: "var(--radius)",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px", color: "var(--warning-700)" }}>
                        {project.status === "BUILDING" ? "Building…" : "Deploying to Vercel…"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--warning-700)", opacity: 0.8 }}>
                        The Developer Agent is generating your site
                      </div>
                    </div>
                  </div>
                )}

                {/* Success banner */}
                {project.deployUrl && (
                  <div style={{
                    padding: "16px",
                    background: "var(--success-50)",
                    border: "1px solid var(--success-200)",
                    borderRadius: "var(--radius)",
                    marginBottom: "16px",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--success-700)" }}>
                      🎉 Site deployed successfully!
                    </div>
                    <a
                      href={project.deployUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--blue-700)", fontSize: "14px", fontWeight: 500 }}
                    >
                      {project.deployUrl} ↗
                    </a>
                  </div>
                )}

                {/* Build log */}
                {project.buildLog && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--text-secondary)" }}>
                      Build Log
                    </div>
                    <pre style={{
                      padding: "12px",
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      color: "var(--text-secondary)",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}>
                      {project.buildLog}
                    </pre>
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
