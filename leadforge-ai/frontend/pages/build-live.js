import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { showToast } from "../components/Toast";

export default function LiveBuildPage() {
  const router = useRouter();
  const { projectId } = router.query;
  
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStatus, setBuildStatus] = useState("idle");
  const [currentStep, setCurrentStep] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [livePreview, setLivePreview] = useState("");
  const [cssCode, setCssCode] = useState("");
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    // Connect to SSE stream for real-time updates
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100";
    const eventSource = new EventSource(`${apiUrl}/build/${projectId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "connected") {
        console.log("Connected to build stream");
      } else if (data.type === "progress") {
        setBuildProgress(data.progress);
        setCurrentStep(data.message);
        setBuildStatus(data.status);
        setGeneratedFiles(data.files || []);

        // Show toast for milestones
        if (data.progress === 100) {
          showToast("Website build complete! 🎉", "success");
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [projectId]);

  // Simulate live CSS preview
  useEffect(() => {
    if (buildProgress >= 20 && buildProgress < 35) {
      // Show CSS being generated
      setCssCode(`:root {
  --primary: #2563eb;
  --secondary: #8b5cf6;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}`);
    } else if (buildProgress >= 50) {
      // Show HTML being generated
      setLivePreview(`<div style="padding: 40px; text-align: center;">
  <h1 style="font-size: 3rem; margin-bottom: 20px;">Your Website</h1>
  <p style="font-size: 1.2rem; color: #666;">Being generated in real-time...</p>
</div>`);
    }
  }, [buildProgress]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Live Website Builder</h1>
            <p className="page-description">
              Watch AI build your website in real-time with CSS and components
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => router.push(`/projects`)}
          >
            ← Back to Projects
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
              {buildStatus === "building" ? "Building..." : buildStatus === "completed" ? "Complete!" : "Ready"}
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              {currentStep || "Waiting to start..."}
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)" }}>
            {buildProgress}%
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div style={{
          width: "100%",
          height: "12px",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${buildProgress}%`,
            height: "100%",
            background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
            transition: "width 0.5s ease-out",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              animation: "shimmer 2s infinite",
            }} />
          </div>
        </div>

        {/* Build Steps */}
        <div style={{
          marginTop: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "8px",
        }}>
          {[
            { step: 1, label: "Init", progress: 10 },
            { step: 2, label: "CSS", progress: 20 },
            { step: 3, label: "Layout", progress: 35 },
            { step: 4, label: "Home", progress: 50 },
            { step: 5, label: "Components", progress: 70 },
            { step: 6, label: "Config", progress: 85 },
            { step: 7, label: "Done", progress: 100 },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                textAlign: "center",
                padding: "12px 8px",
                borderRadius: "var(--radius)",
                background: buildProgress >= item.progress ? "var(--primary-100)" : "var(--bg-secondary)",
                border: buildProgress >= item.progress ? "2px solid var(--primary)" : "2px solid var(--border)",
                transition: "all 0.3s",
              }}
            >
              <div style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "4px",
                color: buildProgress >= item.progress ? "var(--primary)" : "var(--text-tertiary)",
              }}>
                {buildProgress >= item.progress ? "✓" : item.step}
              </div>
              <div style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: buildProgress >= item.progress ? "var(--primary)" : "var(--text-tertiary)",
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview Split View */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* CSS Preview */}
        <div className="card">
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--primary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              CSS Design System
            </h3>
            {buildProgress >= 20 && (
              <div style={{
                marginLeft: "auto",
                padding: "4px 8px",
                background: "var(--success-100)",
                color: "var(--success)",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                fontWeight: 600,
              }}>
                LIVE
              </div>
            )}
          </div>
          <div style={{ padding: "20px" }}>
            {cssCode ? (
              <pre style={{
                background: "#1e293b",
                color: "#e2e8f0",
                padding: "16px",
                borderRadius: "var(--radius)",
                fontSize: "13px",
                lineHeight: "1.6",
                overflow: "auto",
                maxHeight: "400px",
              }}>
                <code>{cssCode}</code>
              </pre>
            ) : (
              <div style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--text-tertiary)",
              }}>
                <div className="spinner" style={{ margin: "0 auto 16px" }} />
                <p>Waiting for CSS generation...</p>
              </div>
            )}
          </div>
        </div>

        {/* HTML Preview */}
        <div className="card">
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--secondary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              Live Preview
            </h3>
            {buildProgress >= 50 && (
              <div style={{
                marginLeft: "auto",
                padding: "4px 8px",
                background: "var(--success-100)",
                color: "var(--success)",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                fontWeight: 600,
              }}>
                RENDERING
              </div>
            )}
          </div>
          <div style={{ padding: "20px" }}>
            {livePreview ? (
              <div style={{
                border: "2px solid var(--border)",
                borderRadius: "var(--radius)",
                minHeight: "400px",
                background: "white",
              }}>
                <div dangerouslySetInnerHTML={{ __html: livePreview }} />
              </div>
            ) : (
              <div style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--text-tertiary)",
                minHeight: "400px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div className="spinner" style={{ margin: "0 auto 16px" }} />
                <p>Waiting for HTML generation...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Files List */}
      {generatedFiles.length > 0 && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              Generated Files ({generatedFiles.length})
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {generatedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius)",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    animation: "fadeIn 0.3s ease-out",
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "both",
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--primary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {file}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
