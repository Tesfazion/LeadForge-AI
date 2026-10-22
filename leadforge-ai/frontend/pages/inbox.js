/**
 * Inbox page
 *
 * Displays incoming emails monitored via IMAP and the AI-generated tasks
 * extracted from each email. All HTTP calls go through the shared api lib.
 */

import { useState } from "react";
import useSWR from "swr";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";
import Modal from "../components/Modal";

export default function InboxPage() {
  const { data: emails, mutate: mutateEmails } = useSWR("inbox-emails", api.getEmails);
  const { data: tasks,  mutate: mutateTasks  } = useSWR("inbox-tasks",  () => api.getEmails());
  const { data: status } = useSWR("inbox-status", api.getInboxStatus, { refreshInterval: 5000 });

  const [selectedEmail, setSelectedEmail] = useState(null);

  async function handleMarkAsRead(emailId) {
    try {
      await api.markEmailAsRead(emailId);
      mutateEmails();
    } catch (err) {
      showToast("Failed to mark as read", "error");
    }
  }

  async function handleCompleteTask(taskId) {
    try {
      await api.completeTask(taskId);
      mutateTasks();
      showToast("Task completed ✅", "success");
    } catch (err) {
      showToast("Failed to complete task", "error");
    }
  }

  function handleEmailClick(email) {
    setSelectedEmail(email);
    if (!email.read) handleMarkAsRead(email.id);
  }

  // Derive task list from a separate endpoint; for now we piggyback the same
  // SWR key since the backend returns tasks alongside inbox status.
  const taskList = status?.tasks ?? [];
  const pendingTaskCount = taskList.filter((t) => !t.completed).length;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Email Inbox &amp; Tasks</h1>
            <p className="page-description">
              AI monitors your inbox and automatically creates leads and tasks
            </p>
          </div>

          {/* Monitoring status pill */}
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
              }} />
              {status.monitoring ? "Monitoring Active" : "Not Monitoring"}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* ---------------------------------------------------------------- */}
        {/* Emails list                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div>
          {/* Counter bar */}
          <div className="card" style={{ marginBottom: "20px", padding: "16px 20px", background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                Inbox ({status?.emailCount ?? 0})
              </h3>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {status?.unreadCount ?? 0} unread
              </span>
            </div>
          </div>

          {/* Empty state */}
          {(!emails || emails.length === 0) && (
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
          )}

          {/* Email rows */}
          {emails?.map((email) => (
            <div
              key={email.id}
              className="card"
              style={{
                marginBottom: "12px",
                cursor: "pointer",
                background: email.read ? "var(--bg-primary)" : "var(--bg-secondary)",
                borderLeft: email.read ? "none" : "4px solid var(--primary-500)",
              }}
              onClick={() => handleEmailClick(email)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <div style={{ fontWeight: email.read ? 400 : 600, fontSize: "14px" }}>
                  {email.from}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", flexShrink: 0, marginLeft: "12px" }}>
                  {new Date(email.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ fontSize: "15px", fontWeight: email.read ? 400 : 600, marginBottom: "6px" }}>
                {email.subject}
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {email.text?.substring(0, 100)}…
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tasks sidebar                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <div className="card" style={{ marginBottom: "20px", padding: "16px 20px", background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              AI-Generated Tasks ({pendingTaskCount})
            </h3>
          </div>

          {taskList.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary)" }}>
                No tasks yet
              </div>
            </div>
          ) : (
            taskList.map((task) => (
              <div
                key={task.id}
                className="card"
                style={{ marginBottom: "12px", opacity: task.completed ? 0.6 : 1 }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => !task.completed && handleCompleteTask(task.id)}
                    style={{ marginTop: "4px", cursor: "pointer", width: "18px", height: "18px", flexShrink: 0 }}
                    aria-label={`Mark "${task.title}" as complete`}
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

                    {/* Priority badge */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span className={`badge badge-${
                        task.priority === "high"   ? "error"   :
                        task.priority === "medium" ? "warning" : "success"
                      }`} style={{ textTransform: "uppercase", fontSize: "10px" }}>
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

      {/* ------------------------------------------------------------------ */}
      {/* Email detail modal                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title={selectedEmail?.subject}
        maxWidth={700}
      >
        {selectedEmail && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                From: <strong>{selectedEmail.from}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                {new Date(selectedEmail.date).toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>
              {selectedEmail.text}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
