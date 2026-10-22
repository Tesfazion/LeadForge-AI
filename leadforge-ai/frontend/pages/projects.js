/**
 * Projects page
 *
 * Shows all AI-generated website projects across every lead.
 * Projects are created automatically when requirements are extracted from
 * a conversation and the Developer Agent runs a build.
 */

import useSWR from "swr";
import Link from "next/link";
import { api } from "../lib/api";
import { getProjectStatusBadgeClass, formatStatus } from "../lib/utils";

// Pipeline steps shown in the "How It Works" explainer card
const HOW_IT_WORKS = [
  { step: "1", title: "Extract Requirements", description: "Requirements Agent analyses the conversation and creates a structured JSON spec." },
  { step: "2", title: "Generate Code",        description: "Developer Agent creates Next.js components and pages from the spec." },
  { step: "3", title: "Add Integrations",     description: "Automatically includes Supabase, Stripe, or other requested services." },
  { step: "4", title: "Deploy to Vercel",     description: "Site goes live instantly with a production URL." },
];

export default function ProjectsPage() {
  // Projects live on the lead objects — fetch all leads and collect their projects
  const { data: leads, isLoading, error } = useSWR("leads", api.getLeads);

  // Flatten all projects from all leads, attaching the lead reference for display
  const projects = (leads ?? []).flatMap((lead) =>
    (lead.projects ?? []).map((project) => ({ ...project, lead }))
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-description">
              View and manage AI-generated websites for qualified leads
            </p>
          </div>
        </div>
      </div>

      {/* How it works explainer */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <div className="card-header">
          <div className="card-title">How the Developer Agent Works</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} style={{ textAlign: "center" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--primary-600)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 700,
                margin: "0 auto 12px",
              }}>
                {item.step}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
          <div className="spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ background: "var(--error-50)", color: "var(--error)", textAlign: "center" }}>
          Failed to load projects. Check your connection.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h3 className="empty-state-title">No projects yet</h3>
          <p className="empty-state-description">
            Projects are created when a lead is qualified and requirements are extracted
          </p>

          {/* Step-by-step guide */}
          <div style={{
            padding: "20px",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg)",
            maxWidth: "500px",
            margin: "24px auto 0",
            textAlign: "left",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
              To create your first project:
            </div>
            <ol style={{ paddingLeft: "20px", margin: 0, fontSize: "14px", lineHeight: "2", color: "var(--text-secondary)" }}>
              <li>Add a lead or <Link href="/discover" style={{ color: "var(--primary-400)" }}>discover leads</Link></li>
              <li>Send outreach and get a reply</li>
              <li>Have a conversation about their needs</li>
              <li>Click "Extract Requirements" on the lead page</li>
              <li>Click "Build &amp; Deploy" to generate the site</li>
            </ol>
          </div>
        </div>
      )}

      {/* Project cards */}
      {projects.length > 0 && (
        <div style={{ display: "grid", gap: "16px" }}>
          {projects.map((project) => (
            <div key={project.id} className="card">
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                    {project.name}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    For:{" "}
                    <Link
                      href={`/leads/${project.lead.id}`}
                      style={{ color: "var(--primary-400)", fontWeight: 500 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.lead.name || project.lead.email}
                    </Link>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Spinner for in-progress statuses */}
                  {project.status === "BUILDING" || project.status === "DEPLOYING" ? (
                    <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                  ) : null}
                  <span className={`badge ${getProjectStatusBadgeClass(project.status)}`}>
                    {formatStatus(project.status)}
                  </span>
                </div>
              </div>

              {/* Requirements summary */}
              {project.requirements && (
                <div style={{
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}>
                  <strong>Type:</strong> {project.requirements.siteType}{" · "}
                  <strong>Pages:</strong> {project.requirements.pages?.length ?? 0}{" · "}
                  <strong>Features:</strong> {project.requirements.features?.length ?? 0}
                </div>
              )}

              {/* Live URL + repo links */}
              {(project.deployUrl || project.repoUrl) && (
                <div style={{ display: "flex", gap: "12px", marginBottom: project.buildLog ? "16px" : 0 }}>
                  {project.deployUrl && (
                    <a
                      href={project.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      View Site
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                      View Code
                    </a>
                  )}
                </div>
              )}

              {/* Collapsible build log (only shown when build failed) */}
              {project.buildLog && project.status === "BUILD_FAILED" && (
                <details style={{ marginTop: "16px" }}>
                  <summary style={{ cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                    View Build Log
                  </summary>
                  <pre style={{
                    marginTop: "8px",
                    padding: "12px",
                    background: "var(--bg-tertiary)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}>
                    {project.buildLog}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
