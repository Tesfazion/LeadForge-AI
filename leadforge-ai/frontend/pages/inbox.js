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
  const { data: tasks,  mutate: mutateTasks  } = useSWR("inbox-tasks",  api.getInboxTasks);
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
      showToast("Task completed", "success");
    } catch (err) {
      showToast("Failed to complete task", "error");
    }
  }

  function handleEmailClick(email) {
    setSelectedEmail(email);
    if (!email.read) handleMarkAsRead(email.id);
  }

  const taskList = tasks ?? [];
  const pendingTaskCount = taskList.filter((t) => !t.completed).length;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Email Inbox &amp; Tasks</h1>
            <p className="page-description">
              Workspace-specific mailbox connections are not available yet.
            </p>
          </div>

          {/* Monitoring status pill */}
          {status && (
            <div className={`status-pill ${status.monitoring ? "is-live" : "is-offline"}`}>
              <span className={`status-dot ${status.monitoring ? "is-live" : "is-offline"}`} aria-hidden="true" />
              {status.monitoring ? "Monitoring active" : "Not monitoring"}
            </div>
          )}
        </div>
      </div>

      <div className="grid-aside">
        {/* ---------------------------------------------------------------- */}
        {/* Emails list                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div>
          {/* Counter bar */}
          <div className="panel-head">
            <h2>Inbox <span className="panel-head-count">{status?.emailCount ?? 0}</span></h2>
            <span className="panel-head-meta">{status?.unreadCount ?? 0} unread</span>
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
                  Email monitoring will be available when workspace-specific mailbox connections are enabled.
                </p>
              </div>
            </div>
          )}

          {/* Email rows */}
          {emails?.map((email) => (
            <div
              key={email.id}
              className={`mail-card ${email.read ? "" : "is-unread"}`}
              onClick={() => handleEmailClick(email)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                <div className="mail-from">{email.from}</div>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", flexShrink: 0 }}>
                  {new Date(email.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="mail-subject">{email.subject}</div>
              <div className="mail-snippet">{email.text?.substring(0, 100)}…</div>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Tasks sidebar                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <div className="panel-head">
            <h2>AI-generated tasks <span className="panel-head-count">{pendingTaskCount}</span></h2>
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
