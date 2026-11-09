/**
 * Projects page
 *
 * Shows website projects created from extracted requirements. Preview builds
 * and deployments are separate, explicit workflow actions.
 */

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";
import { getProjectStatusBadgeClass, formatStatus } from "../lib/utils";

// Pipeline steps shown in the "How It Works" explainer card
const HOW_IT_WORKS = [
  { step: "1", title: "Capture requirements", description: "Extract a structured website brief from a prospect conversation." },
  { step: "2", title: "Generate site files", description: "Create a starter website project from the captured requirements." },
  { step: "3", title: "Review the files", description: "Inspect the generated source before publishing it." },
  { step: "4", title: "Deploy to Vercel", description: "Publish the reviewed site when deployment is configured." },
];

export default function ProjectsPage() {
  // Projects live on the lead objects — fetch all leads and collect their projects
  const { data: leads, isLoading, error, mutate } = useSWR("leads", api.getLeads, {
    refreshInterval: (currentLeads) =>
      currentLeads?.some((lead) =>
        lead.projects?.some((project) => ["BUILDING", "DEPLOYING"].includes(project.status))
      ) ? 5000 : 0,
  });
  const [buildingProject, setBuildingProject] = useState(null);

  // Flatten all projects from all leads, attaching the lead reference for display
  const projects = (leads ?? []).flatMap((lead) =>
    (lead.projects ?? []).map((project) => ({ ...project, lead }))
  );

  async function handleBuild(projectId) {
    setBuildingProject(projectId);
    try {
      await api.triggerBuild(projectId);
      await mutate();
      showToast("Website files generated. Review them before deployment.", "success");
    } catch (err) {
      showToast(`Website build failed: ${err.message}`, "error");
      await mutate();
    } finally {
      setBuildingProject(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Website delivery</h1>
            <p className="page-description">
              Move qualified leads from captured requirements to reviewed project files and deployment.
            </p>
          </div>
        </div>
      </div>

      {/* How it works explainer */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <div className="card-header">
          <div className="card-title">Requirements → project files → deployment</div>
        </div>

        <div className="banner banner-warning" role="note" style={{ marginBottom: "24px" }}>
          Generated files are stored on the backend filesystem. In serverless deployments or after backend cleanup/restarts, they may need to be rebuilt; durable object storage is not configured yet.
        </div>

        <div className="grid-auto" style={{ gap: "24px" }}>
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} style={{ textAlign: "center" }}>
              <div className="step-badge" style={{ margin: "0 auto 12px" }}>
                {item.step}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.description}</div>
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
        <div className="banner banner-error">
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
            Projects are created when requirements are extracted from a real conversation.
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
              <li>Add a lead or <Link href="/discover" className="text-link">discover leads</Link></li>
              <li>Send outreach and get a reply</li>
              <li>Have a conversation about their needs</li>
              <li>Click "Extract Requirements" on the lead page</li>
              <li>Generate the website files and review the source</li>
              <li>Deploy the reviewed site to Vercel</li>
            </ol>
          </div>
        </div>
      )}

      {/* Project cards */}
      {projects.length > 0 && (
        <div className="grid-stack">
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
                      className="text-link"
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
                <div className="info-strip" style={{ marginBottom: "16px" }}>
                  <span><strong>Type:</strong> {project.requirements.siteType}</span>
                  <span><strong>Pages:</strong> {project.requirements.pages?.length ?? 0}</span>
                  <span><strong>Features:</strong> {project.requirements.features?.length ?? 0}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {["READY_TO_BUILD", "BUILD_FAILED", "PREVIEW_READY"].includes(project.status) && (
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => handleBuild(project.id)}
                    disabled={buildingProject === project.id}
                  >
                    {buildingProject === project.id
                      ? "Generating preview…"
                      : project.status === "BUILD_FAILED"
                        ? "Retry website build"
                        : project.status === "PREVIEW_READY"
                          ? "Regenerate website files"
                          : "Generate website files"}
                  </button>
                )}
                {["PREVIEW_READY", "DEPLOY_FAILED"].includes(project.status) && (
                  <Link href={`/preview/${project.id}`} className="btn btn-primary btn-sm">
                    {project.status === "DEPLOY_FAILED" ? "Review files & retry deployment" : "Review files & deploy"}
                  </Link>
                )}
              </div>

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
