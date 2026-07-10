import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";

export default function ProjectsPage() {
  // Mock projects data - in production, fetch from API
  const projects = [];

  const getStatusBadge = (status) => {
    const map = {
      GATHERING_REQUIREMENTS: "badge-gray",
      READY_TO_BUILD: "badge-warning",
      BUILDING: "badge-primary",
      BUILD_FAILED: "badge-error",
      DEPLOYED: "badge-success",
    };
    return map[status] || "badge-gray";
  };

  const getStatusIcon = (status) => {
    if (status === "BUILDING") {
      return (
        <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
      );
    }
    if (status === "DEPLOYED") {
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status === "BUILD_FAILED") {
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
    }
    return null;
  };

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

      {/* How It Works */}
      <div className="card" style={{ marginBottom: "32px", background: "linear-gradient(135deg, var(--primary-50), var(--bg-primary))" }}>
        <div className="card-header">
          <div className="card-title">How the Developer Agent Works</div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          {[
            {
              step: "1",
              title: "Extract Requirements",
              description: "Requirements Agent analyzes conversation and creates structured JSON",
            },
            {
              step: "2",
              title: "Generate Code",
              description: "Developer Agent creates Next.js components and pages",
            },
            {
              step: "3",
              title: "Add Integrations",
              description: "Automatically includes Supabase, Stripe, or other requested services",
            },
            {
              step: "4",
              title: "Deploy to Vercel",
              description: "Site goes live instantly with production URL",
            },
          ].map((item) => (
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
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h3 className="empty-state-title">No projects yet</h3>
          <p className="empty-state-description">
            Projects are created automatically when leads reach the qualified stage and requirements are extracted
          </p>
          <div style={{ marginTop: "24px" }}>
            <div style={{ 
              padding: "20px",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "500px",
              margin: "0 auto",
              textAlign: "left",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
                To create your first project:
              </div>
              <ol style={{ paddingLeft: "20px", margin: 0, fontSize: "14px", lineHeight: "2", color: "var(--text-secondary)" }}>
                <li>Add a lead or discover leads</li>
                <li>Send outreach and get a reply</li>
                <li>Have a conversation about their needs</li>
                <li>Click "Extract Requirements" on the lead page</li>
                <li>Click "Build & Deploy" to generate the site</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {projects.map((project) => (
            <div key={project.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                    {project.name}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                    For: {project.lead.name || project.lead.email}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getStatusIcon(project.status)}
                  <span className={`badge ${getStatusBadge(project.status)}`}>
                    {project.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {project.requirements && (
                <div style={{ 
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}>
                  <strong>Type:</strong> {project.requirements.siteType} • 
                  <strong> Pages:</strong> {project.requirements.pages?.length || 0} • 
                  <strong> Features:</strong> {project.requirements.features?.length || 0}
                </div>
              )}

              {project.deployUrl && (
                <div style={{ display: "flex", gap: "12px" }}>
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
