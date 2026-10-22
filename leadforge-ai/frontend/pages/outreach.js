/**
 * Outreach Approval Queue page
 *
 * Shows all AI-drafted emails awaiting human review.
 * Humans can edit the subject/body, approve (sends the email), or discard.
 */

import useSWR from "swr";
import { useState } from "react";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";
import Modal from "../components/Modal";

export default function OutreachQueuePage() {
  const { data: pending, error, isLoading, mutate } = useSWR(
    "outreach/pending",
    api.getPendingOutreach
  );
  const [approving,      setApproving]      = useState({});
  const [rejecting,      setRejecting]      = useState({});
  const [editing,        setEditing]        = useState({});
  const [editingMessage, setEditingMessage] = useState(null);

  async function handleApprove(messageId) {
    if (!confirm("Send this email to the lead?")) return;
    setApproving((prev) => ({ ...prev, [messageId]: true }));
    try {
      await api.approveOutreach(messageId);
      mutate();
      showToast("Email sent successfully! 📧", "success");
    } catch (err) {
      showToast(`Failed to send: ${err.message}`, "error");
    } finally {
      setApproving((prev) => ({ ...prev, [messageId]: false }));
    }
  }

  async function handleReject(messageId) {
    if (!confirm("Discard this draft? You can create a new one anytime.")) return;
    setRejecting((prev) => ({ ...prev, [messageId]: true }));
    try {
      await api.rejectOutreach(messageId);
      mutate();
      showToast("Draft discarded", "success");
    } catch (err) {
      showToast(`Failed to reject: ${err.message}`, "error");
    } finally {
      setRejecting((prev) => ({ ...prev, [messageId]: false }));
    }
  }

  function openEditModal(msg) {
    setEditingMessage({
      id:      msg.id,
      subject: msg.conversation.subject,
      content: msg.content,
      lead:    msg.conversation.lead,
    });
  }

  function closeEditModal() {
    setEditingMessage(null);
  }

  async function handleSaveEdit() {
    if (!editingMessage) return;
    setEditing((prev) => ({ ...prev, [editingMessage.id]: true }));
    try {
      await api.editOutreach(editingMessage.id, {
        subject: editingMessage.subject,
        content: editingMessage.content,
      });
      mutate();
      closeEditModal();
      showToast("Draft updated ✏️", "success");
    } catch (err) {
      showToast(`Failed to update: ${err.message}`, "error");
    } finally {
      setEditing((prev) => ({ ...prev, [editingMessage.id]: false }));
    }
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Outreach Approval Queue</h1>
            <p className="page-description">
              Review, edit, and approve AI-drafted emails before they're sent
            </p>
          </div>
          {pending && pending.length > 0 && (
            <div style={{
              padding: "8px 16px",
              background: "var(--warning-50)",
              border: "1px solid var(--warning-200)",
              borderRadius: "var(--radius-full)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--warning)",
            }}>
              {pending.length} pending approval{pending.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="empty-state" style={{ padding: "64px" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p>Loading pending outreach…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{
          padding: "24px",
          background: "var(--error-50)",
          border: "1px solid var(--error-200)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px", color: "var(--error)" }}>
            Failed to load outreach queue
          </div>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Check backend connection and try again
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pending?.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: "64px" }}>
            <div className="empty-state-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="empty-state-title">All clear!</h3>
            <p className="empty-state-description">
              No pending outreach emails. All drafted emails have been reviewed.
            </p>
          </div>
        </div>
      )}

      {/* Outreach cards */}
      {pending?.map((msg) => (
        <div key={msg.id} className="card" style={{ marginBottom: "24px" }}>
          {/* Lead header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "start" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--primary-900)",
                color: "var(--primary-300)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {msg.conversation.lead.name?.[0]?.toUpperCase() ?? "L"}
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                  {msg.conversation.lead.name || msg.conversation.lead.email}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  {msg.conversation.lead.company && (
                    <><strong>{msg.conversation.lead.company}</strong> · </>
                  )}
                  {msg.conversation.lead.email}
                </div>
              </div>
            </div>
            <span className="badge badge-warning">Pending Approval</span>
          </div>

          {/* Email preview */}
          <div style={{
            background: "var(--bg-secondary)",
            padding: "20px",
            borderRadius: "var(--radius)",
            marginBottom: "20px",
            border: "1px solid var(--border)",
          }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Subject Line
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>
                {msg.conversation.subject}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Email Body
              </div>
              <div style={{ fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn btn-secondary"
              onClick={() => openEditModal(msg)}
              disabled={approving[msg.id] || rejecting[msg.id]}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Draft
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleApprove(msg.id)}
              disabled={approving[msg.id] || rejecting[msg.id]}
              style={{ flex: 1 }}
            >
              {approving[msg.id] ? (
                <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Sending…</>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Approve &amp; Send
                </>
              )}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => handleReject(msg.id)}
              disabled={approving[msg.id] || rejecting[msg.id]}
              style={{ color: "var(--error)" }}
            >
              {rejecting[msg.id] ? (
                <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Discarding…</>
              ) : (
                "Discard"
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Edit draft modal — uses the shared Modal component */}
      <Modal
        isOpen={!!editingMessage}
        onClose={closeEditModal}
        title={editingMessage
          ? `Edit Draft — To: ${editingMessage.lead.name || editingMessage.lead.email}`
          : ""}
        maxWidth={700}
      >
        {editingMessage && (
          <>
            <div className="form-group">
              <label className="form-label">Subject Line</label>
              <input
                type="text"
                className="form-input"
                value={editingMessage.subject}
                onChange={(e) =>
                  setEditingMessage({ ...editingMessage, subject: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Body</label>
              <textarea
                className="form-textarea"
                rows={15}
                value={editingMessage.content}
                onChange={(e) =>
                  setEditingMessage({ ...editingMessage, content: e.target.value })
                }
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button className="btn btn-secondary" onClick={closeEditModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={editing[editingMessage.id]}
              >
                {editing[editingMessage.id] ? (
                  <><div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} /> Saving…</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
