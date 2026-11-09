import Link from "next/link";

export default function InboxPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <span className="dashboard-kicker">CUSTOMER ENGAGEMENT</span>
            <h1 className="page-title">Connected inbox is not available yet</h1>
            <p className="page-description">
              LeadForge does not currently sync workspace-specific mailboxes or receive real customer replies.
            </p>
          </div>
        </div>
      </div>

      <section className="card" aria-labelledby="inbox-status-title">
        <h2 id="inbox-status-title" className="card-title">Use the supported engagement workflow</h2>
        <p className="card-subtitle">
          Review and send approved drafts from Outreach. Conversation replies on a lead are currently a development/testing simulation—not email.
        </p>
        <div className="action-row" style={{ marginTop: "20px" }}>
          <Link className="btn btn-primary" href="/outreach">Review outreach drafts</Link>
          <Link className="btn btn-secondary" href="/conversations">View conversations</Link>
        </div>
      </section>
    </>
  );
}
