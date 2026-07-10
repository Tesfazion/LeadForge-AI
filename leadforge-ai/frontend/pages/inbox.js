import { useState } from "react";
import useSWR from "swr";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

export default function InboxPage() {
  const { data: emails, mutate: mutateEmails } = useSWR("/inbox/emails", () => 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100"}/inbox/emails`).then(r => r.json())
  );
  
  const { data: tasks, mutate: mutateTasks } = useSWR("/inbox/tasks", () =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100"}/inbox/tasks`).then(r => r.json())
  );

  const { data: status } = useSWR("/inbox/status", () =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100"}/inbox/status`).then(r => r.json()),
    { refreshInterval: 5000 }
  );

  const [selectedEmail, setSelectedEmail] = useState(null);

  async function markAsRead(emailId) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100"}/inbox/emails/${emailId}/mark-read`, {
        method: "POST",
      });
      mutateEmails();
    } catch (err) {
      showToast("Failed to mark as read", "error");
    }
  }

  async function completeTask(taskId) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100"}/inbox/tasks/${taskId}/complete`, {
        method: "POST",
      });
      mutateTasks();
      showToast("Task completed! ✅", "success");
    } catch (err) {
      showToast("Failed to complete task", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Email Inbox & Tasks</h1>
            <p className="page-description">
              AI monitors your inbox and automatically creates leads and tasks
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {status && (
              <div style={{
                padding: "8px 16px",
                background: status.monitoring ? "var(--success-50)" : "var(--error-50)",
                border: `1px solid ${status.monitoring ? "var(--success-200)" : "var(--error-200)"}`,
                borderRadius: "var(--radius-full)",
                fontSize: "14px",
                fontWeight: 600,
                color: status.monitoring ? "var(--success)" : "var(--error)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: status.monitoring ? "var(--success)" : "var(--error)",
                }}></div>
                {status.monitoring ? "Monitoring Active" : "Not Monitoring"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Emails List */}
        <div>
          <div className="card" style={{ marginBottom: "20px", padding: "16px 20px", background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                Inbox ({status?.emailCount || 0})
              </h3>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {status?.unreadCount || 0} unread
              </span>
            </div>
          </div>

          {!emails || emails.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "48px" }}>
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="empty-state-title">No emails yet</h3>
                <p className="empty-state-description">
                  Configure email monitoring in .env to see incoming emails
                </p>
              </div>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="card"
                style={{
                  marginBottom: "12px",
                  cursor: "pointer",
                  background: email.read ? "var(--bg-primary)" : "var(--bg-secondary)",
                  borderLeft: email.read ? "none" : "4px solid var(--primary)",
                }}
                onClick={() => {
                  setSelectedEmail(email);
                  if (!email.read) markAsRead(email.id);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <div style={{ fontWeight: email.read ? 400 : 600, fontSize: "14px" }}>
                    {email.from}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    {new Date(email.date).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{
                  fontSize: "15px",
                  fontWeight: email.read ? 400 : 600,
                  marginBottom: "6px",
                  color: "var(--text-primary)",
                }}>
                  {email.subject}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {email.text?.substring(0, 100)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tasks Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: "20px", padding: "16px 20px", background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              AI-Generated Tasks ({tasks?.filter(t => !t.completed).length || 0})
            </h3>
          </div>

          {!tasks || tasks.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: "center", padding: "32px" }}>
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{
                  margin: "0 auto 12px",
                  color: "var(--text-tertiary)",
                }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                  No tasks yet
                </p>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="card"
                style={{
                  marginBottom: "12px",
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => !task.completed && completeTask(task.id)}
                    style={{ marginTop: "4px", cursor: "pointer", width: "18px", height: "18px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "4px",
                      textDecoration: task.completed ? "line-through" : "none",
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {task.description}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{
                        padding: "2px 8px",
                        background: task.priority === "high" ? "var(--error-100)" : task.priority === "medium" ? "var(--warning-100)" : "var(--success-100)",
                        color: task.priority === "high" ? "var(--error)" : task.priority === "medium" ? "var(--warning)" : "var(--success)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}>
                        {task.priority}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                        {task.action}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 1000,
        }} onClick={() => setSelectedEmail(null)}>
          <div style={{
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-lg)",
            maxWidth: "700px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: "24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
                  {selectedEmail.subject}
                </h2>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  From: {selectedEmail.from}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                  {new Date(selectedEmail.date).toLocaleString()}
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedEmail(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{
                fontSize: "14px",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                color: "var(--text-primary)",
              }}>
                {selectedEmail.text}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
