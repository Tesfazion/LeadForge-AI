import useSWR from "swr";
import { useState } from "react";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

export default function OutreachQueuePage() {
  const { data: pending, error, isLoading, mutate } = useSWR(
    "outreach/pending",
    api.getPendingOutreach
  );
  const [approving, setApproving] = useState({});
  const [rejecting, setRejecting] = useState({});
  const [editing, setEditing] = useState({});
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
      id: msg.id,
      subject: msg.conversation.subject,
      content: msg.content,
      lead: msg.conversation.lead,
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
      showToast("Draft updated successfully! ✏️", "success");
    } catch (err) {
      showToast(`Failed to update: ${err.message}`, "error");
    } finally {
      setEditing((prev) => ({ ...prev, [editingMessage.id]: false }));
    }
  }

  return (
    <>
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

      {isLoading && (
        <div className="empty-state" style={{ padding: "64px" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p>Loading pending outreach...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ 
          padding: "24px",
          background: "var(--error-50)", 
          border: "1px solid var(--error-200)",
          textAlign: "center" 
        }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ 
            color: "var(--error)", 
            margin: "0 auto 16px" 
          }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px", color: "var(--error)" }}>
            Failed to load outreach queue
          </div>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Check backend connection and try again
          </p>
        </div>
      )}

      {pending?.length === 0 && (
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

      {pending?.map((msg) => (
        <div key={msg.id} className="card" style={{ marginBottom: "24px" }}>
          {/* Lead Info Header */}
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
                background: "var(--primary-100)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {msg.conversation.lead.name?.[0]?.toUpperCase() || "L"}
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                  {msg.conversation.lead.name || msg.conversation.lead.email}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  {msg.conversation.lead.company && <><strong>{msg.conversation.lead.company}</strong> · </>}
                  {msg.conversation.lead.email}
                </div>
              </div>
            </div>
            <span className="badge status-outreach-pending-approval" style={{
              background: "var(--warning-100)",
              color: "var(--warning)",
              border: "1px solid var(--warning-200)",
            }}>
              Pending Approval
            </span>
          </div>

          {/* Email Preview */}
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
              <div style={{ 
                fontSize: "14px",
                lineHeight: "1.7", 
                whiteSpace: "pre-wrap",
                color: "var(--text-primary)",
              }}>
                {msg.content}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn-secondary"
              onClick={() => openEditModal(msg)}
              disabled={approving[msg.id] || rejecting[msg.id]}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Draft
            </button>
            <button
              className="btn-primary"
              onClick={() => handleApprove(msg.id)}
              disabled={approving[msg.id] || rejecting[msg.id]}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {approving[msg.id] ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px" }} />
                  Sending...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Approve & Send
                </>
              )}
            </button>
            <button
              className="btn-ghost"
              onClick={() => handleReject(msg.id)}
              disabled={approving[msg.id] || rejecting[msg.id]}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "var(--error)",
              }}
            >
              {rejecting[msg.id] ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px" }} />
                  Discarding...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Discard
                </>
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {editingMessage && (
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
        }} onClick={closeEditModal}>
          <div style={{
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-lg)",
            maxWidth: "700px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>
                  Edit Draft Email
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
                  To: {editingMessage.lead.name} ({editingMessage.lead.email})
                </p>
              </div>
              <button className="btn-icon" onClick={closeEditModal}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "14px", 
                  fontWeight: 600, 
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}>
                  Subject Line
                </label>
                <input
                  type="text"
                  value={editingMessage.subject}
                  onChange={(e) => setEditingMessage({ ...editingMessage, subject: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "14px",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: "14px", 
                  fontWeight: 600, 
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}>
                  Email Body
                </label>
                <textarea
                  value={editingMessage.content}
                  onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                  rows={15}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "20px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}>
              <button className="btn-secondary" onClick={closeEditModal}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveEdit}
                disabled={editing[editingMessage.id]}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {editing[editingMessage.id] ? (
                  <>
                    <div className="spinner" style={{ width: "16px", height: "16px" }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
