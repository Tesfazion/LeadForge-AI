import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "../../lib/api";
import { showToast } from "../../components/Toast";

export default function PreviewPage() {
  const router = useRouter();
  const { projectId } = router.query;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [installedApps, setInstalledApps] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [previewMode, setPreviewMode] = useState("files"); // files, visual, code

  useEffect(() => {
    if (projectId) {
      loadPreview();
      loadInstalledApps();
    }
  }, [projectId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const data = await api.getPreview(projectId);
      setProject(data.project);
      setFiles(data.files);
      
      // Auto-select package.json or first file
      const fileNames = Object.keys(data.files);
      if (fileNames.length > 0) {
        const defaultFile = fileNames.find(f => f === "package.json") || fileNames[0];
        selectFile(defaultFile, data.files[defaultFile]);
      }
    } catch (error) {
      showToast("Failed to load preview", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledApps = async () => {
    try {
      const apps = await api.getInstalledApps();
      setInstalledApps(apps.filter(app => app.installed));
    } catch (error) {
      console.error("Failed to load apps:", error);
    }
  };

  const selectFile = (fileName, content) => {
    setSelectedFile(fileName);
    setFileContent(content || files[fileName]);
  };

  const handleDeploy = async () => {
    if (!confirm("Deploy this website to Vercel? This will make it publicly accessible.")) {
      return;
    }

    try {
      setDeploying(true);
      showToast("Deploying website...", "info");
      const result = await api.deployProject(projectId);
      showToast(`Deployed successfully! 🎉`, "success");
      setProject(result.project);
      
      // Open deployed URL
      if (result.deployUrl) {
        window.open(result.deployUrl, "_blank");
      }
    } catch (error) {
      showToast("Deployment failed", "error");
      console.error(error);
    } finally {
      setDeploying(false);
    }
  };

  const handleOpenInApp = async (appId) => {
    try {
      showToast(`Opening in ${appId}...`, "info");
      await api.openInApp(projectId, appId);
      showToast(`Opened in ${appId}!`, "success");
    } catch (error) {
      showToast(`Failed to open in ${appId}`, "error");
      console.error(error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await api.openFolder(projectId);
      showToast("Opened folder!", "success");
    } catch (error) {
      showToast("Failed to open folder", "error");
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "📜";
    if (fileName.endsWith(".css")) return "🎨";
    if (fileName.endsWith(".json")) return "⚙️";
    if (fileName.endsWith(".md")) return "📝";
    if (fileName.endsWith(".html")) return "🌐";
    return "📄";
  };

  const getLanguage = (fileName) => {
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "javascript";
    if (fileName.endsWith(".css")) return "css";
    if (fileName.endsWith(".json")) return "json";
    if (fileName.endsWith(".md")) return "markdown";
    if (fileName.endsWith(".html")) return "html";
    return "text";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="loading">Loading preview...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-header">
        <h1 className="page-title">Preview Not Found</h1>
        <p>Build the project first to create a preview.</p>
      </div>
    );
  }

  const fileTree = Object.keys(files).reduce((tree, filePath) => {
    const parts = filePath.split("/");
    let current = tree;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        if (!current.files) current.files = [];
        current.files.push(filePath);
      } else {
        if (!current.folders) current.folders = {};
        if (!current.folders[part]) current.folders[part] = {};
        current = current.folders[part];
      }
    });
    
    return tree;
  }, {});

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Preview: {project.name}</h1>
            <p className="page-description">
              Review the generated website before deploying
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              className="btn btn-secondary"
              onClick={handleOpenFolder}
            >
              📁 Open Folder
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleDeploy}
              disabled={deploying || project.status !== "PREVIEW_READY"}
            >
              {deploying ? "Deploying..." : "🚀 Deploy to Vercel"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {installedApps.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
            Open in IDE:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {installedApps.map((app) => (
              <button
                key={app.id}
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenInApp(app.id)}
                title={app.description}
              >
                {app.icon} {app.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview Tabs */}
      <div className="card" style={{ marginBottom: "16px", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn btn-sm ${previewMode === "files" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPreviewMode("files")}
          >
            📁 Files
          </button>
          <button
            className={`btn btn-sm ${previewMode === "code" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPreviewMode("code")}
          >
            💻 Code View
          </button>
          <button
            className={`btn btn-sm ${previewMode === "visual" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPreviewMode("visual")}
          >
            👁️ Visual Preview
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", minHeight: "600px" }}>
        {/* File Tree */}
        <div className="card">
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", padding: "0 12px" }}>
            Project Files ({Object.keys(files).length})
          </div>
          <div style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
            {Object.keys(files).map((fileName) => (
              <div
                key={fileName}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: selectedFile === fileName ? "var(--primary-50)" : "transparent",
                  borderLeft: selectedFile === fileName ? "3px solid var(--primary-600)" : "3px solid transparent",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onClick={() => selectFile(fileName, files[fileName])}
              >
                <span>{getFileIcon(fileName)}</span>
                <span style={{ 
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  color: selectedFile === fileName ? "var(--primary-700)" : "var(--text-primary)"
                }}>
                  {fileName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* File Content */}
        <div className="card">
          {selectedFile ? (
            <>
              <div style={{
                padding: "12px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600 }}>
                  {selectedFile}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {fileContent.split("\n").length} lines
                </div>
              </div>
              <div style={{
                padding: "16px",
                background: "var(--bg-secondary)",
                maxHeight: "calc(100vh - 450px)",
                overflowY: "auto",
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {fileContent}
                </pre>
              </div>
            </>
          ) : (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}>
              Select a file to view its content
            </div>
          )}
        </div>
      </div>

      {/* Status Info */}
      {project.status && (
        <div className="card" style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
            Status: {project.status}
          </div>
          {project.deployUrl && (
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Deployed at: <a href={project.deployUrl} target="_blank" rel="noopener noreferrer">{project.deployUrl}</a>
            </div>
          )}
          {project.buildLog && (
            <div style={{
              marginTop: "8px",
              padding: "12px",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius)",
              fontSize: "12px",
              fontFamily: "monospace",
            }}>
              {project.buildLog}
            </div>
          )}
        </div>
      )}
    </>
  );
}
