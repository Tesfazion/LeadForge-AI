/**
 * Website preview page  (/preview/[projectId])
 *
 * Review the files the Developer Agent generated for a project, then deploy
 * the site to Vercel.
 *
 * Three view modes:
 *   • files  — file tree + source of the selected file
 *   • code   — source only, full width
 *   • visual — live deployed site in an iframe (once a deploy URL exists)
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { api } from "../../lib/api";
import { showToast } from "../../components/Toast";
import Icon from "../../components/Icon";
import { getProjectStatusBadgeClass, formatStatus } from "../../lib/utils";

/** Picks a sensible file to open first: package.json, then index.html, then any file. */
function defaultFile(files) {
  const names = Object.keys(files);
  return names.find((f) => f === "package.json") ?? names.find((f) => f === "index.html") ?? names[0] ?? null;
}

export default function PreviewPage() {
  const router = useRouter();
  const { projectId } = router.query;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [installedApps, setInstalledApps] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [previewMode, setPreviewMode] = useState("files"); // files | code | visual

  useEffect(() => {
    if (!projectId) return;
    loadPreview();
    loadInstalledApps();
  }, [projectId]);

  async function loadPreview() {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.getPreview(projectId);
      const nextFiles = data.files ?? {};

      setProject(data.project);
      setFiles(nextFiles);

      const first = defaultFile(nextFiles);
      setSelectedFile(first);
      setFileContentFor(first, nextFiles);
    } catch (error) {
      // "Failed to fetch" is what the browser reports for a network/CORS
      // failure — surface something actionable instead of the raw message.
      setLoadError(
        error.message === "Failed to fetch"
          ? "Couldn't reach the API to load this preview."
          : error.message || "Failed to load preview."
      );
      showToast("Failed to load preview", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadInstalledApps() {
    try {
      const apps = await api.getInstalledApps();
      setInstalledApps(apps.filter((app) => app.installed));
    } catch (error) {
      // Local desktop integration is optional — the page works without it.
      console.error("Failed to load apps:", error);
    }
  }

  // Content lives next to the selected file name so the pane never reads stale state.
  function setFileContentFor(fileName, source = files) {
    setFileContent(fileName ? source[fileName] ?? "" : "");
  }

  function selectFile(fileName) {
    setSelectedFile(fileName);
    setFileContentFor(fileName);
  }

  async function handleDeploy() {
    if (!window.confirm("Deploy this website to Vercel? This will make it publicly accessible.")) {
      return;
    }

    try {
      setDeploying(true);
      showToast("Deploying website...", "info");
      const result = await api.deployProject(projectId);
      setProject(result.project);
      showToast("Deployed successfully!", "success");

      if (result.deployUrl) {
        window.open(result.deployUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      showToast(error.message || "Deployment failed", "error");
    } finally {
      setDeploying(false);
    }
  }

  async function handleOpenInApp(appId) {
    try {
      await api.openInApp(projectId, appId);
      showToast(`Opened in ${appId}!`, "success");
    } catch (error) {
      showToast(`Failed to open in ${appId}`, "error");
    }
  }

  async function handleOpenFolder() {
    try {
      await api.openFolder(projectId);
      showToast("Opened folder!", "success");
    } catch (error) {
      showToast("Failed to open folder", "error");
    }
  }

  const header = (
    <div className="page-header">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">
            {project ? `Preview: ${project.name}` : "Website Preview"}
          </h1>
          <p className="page-description">
            Review the generated website before deploying
          </p>
        </div>
        {project && (
          <div className="page-actions">
            <button className="btn btn-secondary" onClick={handleOpenFolder}>
              <Icon name="folder" size={16} />
              Open Folder
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDeploy}
              disabled={deploying || project.status !== "PREVIEW_READY"}
            >
              <Icon name="rocket" size={16} />
              {deploying ? "Deploying…" : "Deploy to Vercel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        {header}
        <div className="empty-state">
          <div className="spinner" />
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {header}
        <div className="banner banner-error">
          {loadError} Check that the backend is running, then reload.
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        {header}
        <div className="empty-state">
          <h3 className="empty-state-title">No preview yet</h3>
          <p className="empty-state-description">
            Build the project first — the generated files appear here once the
            Developer Agent has run.
          </p>
          <Link href="/projects" className="btn btn-primary">
            Go to projects
          </Link>
        </div>
      </>
    );
  }

  const fileNames = Object.keys(files);

  return (
    <>
      {header}

      {/* Project status */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span className={`badge ${getProjectStatusBadgeClass(project.status)}`}>
            {formatStatus(project.status)}
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {fileNames.length} generated {fileNames.length === 1 ? "file" : "files"}
          </span>
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
            >
              {project.deployUrl}
              <Icon name="external-link" size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Open in IDE — only when the desktop integration reports installed apps */}
      {installedApps.length > 0 && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-header">
            <div className="card-title">Open in IDE</div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {installedApps.map((app) => (
              <button
                key={app.id}
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenInApp(app.id)}
                title={app.description}
              >
                {app.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View mode */}
      <div className="card" style={{ marginBottom: "16px", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${previewMode === "files" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPreviewMode("files")}
          >
            <Icon name="folder" size={16} />
            Files
          </button>
          <button
            className={`btn btn-sm ${previewMode === "code" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPreviewMode("code")}
          >
            <Icon name="code" size={16} />
            Code View
          </button>
          <button
            className={`btn btn-sm ${previewMode === "visual" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPreviewMode("visual")}
          >
            <Icon name="external-link" size={16} />
            Visual Preview
          </button>
        </div>
      </div>

      {/* Visual preview — requires a deployed URL */}
      {previewMode === "visual" &&
        (project.deployUrl ? (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <iframe
              src={project.deployUrl}
              title={`${project.name} live preview`}
              style={{ width: "100%", height: "70vh", border: "none", display: "block" }}
            />
          </div>
        ) : (
          <div className="empty-state">
            <h3 className="empty-state-title">Not deployed yet</h3>
            <p className="empty-state-description">
              Deploy the project to render the live site here, or use the Files and
              Code tabs to review the generated source.
            </p>
          </div>
        ))}

      {/* Files / code */}
      {previewMode !== "visual" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: previewMode === "files" ? "280px 1fr" : "1fr",
            gap: "16px",
            minHeight: "480px",
          }}
        >
          {previewMode === "files" && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Project Files ({fileNames.length})</div>
              </div>
              <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
                {fileNames.map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => selectFile(fileName)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      cursor: "pointer",
                      border: "none",
                      background: selectedFile === fileName ? "var(--primary-50)" : "transparent",
                      borderLeft:
                        selectedFile === fileName
                          ? "3px solid var(--brand-primary)"
                          : "3px solid transparent",
                      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                      fontSize: "13px",
                      wordBreak: "break-all",
                      color:
                        selectedFile === fileName ? "var(--primary-700)" : "var(--text-primary)",
                    }}
                  >
                    {fileName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {selectedFile && selectedFile in files ? (
              <>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600 }}>
                    {selectedFile}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {fileContent.split("\n").length} lines
                  </div>
                </div>
                <div style={{ padding: "16px", background: "var(--bg-secondary)", maxHeight: "65vh", overflow: "auto" }}>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                      fontSize: "13px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {fileContent}
                  </pre>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3 className="empty-state-title">Select a file</h3>
                <p className="empty-state-description">
                  Choose a file from the tree to review its generated source.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build log */}
      {project.buildLog && (
        <div className="card" style={{ marginTop: "16px" }}>
          <div className="card-header">
            <div className="card-title">Build Log</div>
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: "var(--text-secondary)",
            }}
          >
            {project.buildLog}
          </pre>
        </div>
      )}
    </>
  );
}
