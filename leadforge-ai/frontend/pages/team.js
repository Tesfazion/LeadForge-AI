import Link from "next/link";

export default function TeamPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <span className="dashboard-kicker">WORKSPACE ACCESS</span>
            <h1 className="page-title">Team management is not available yet</h1>
            <p className="page-description">
              LeadForge currently provisions one private workspace per account. Team invitations, roles, and shared access are not implemented.
            </p>
          </div>
        </div>
      </div>

      <section className="card" aria-labelledby="team-access-title">
        <h2 id="team-access-title" className="card-title">Your workspace is private</h2>
        <p className="card-subtitle">
          No teammates, member counts, roles, or invitations are being shown as live data. Workspace data remains scoped to the signed-in account.
        </p>
        <div className="action-row" style={{ marginTop: "20px" }}>
          <Link className="btn btn-primary" href="/settings">Manage your account</Link>
          <Link className="btn btn-secondary" href="/dashboard">Return to your pipeline</Link>
        </div>
      </section>
    </>
  );
}
