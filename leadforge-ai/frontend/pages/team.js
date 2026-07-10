import { useState } from "react";

export default function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });

  // Mock team data - in production, fetch from API
  const teamMembers = [
    {
      id: "1",
      name: "You",
      email: "you@company.com",
      role: "admin",
      avatar: null,
      status: "active",
      joinedAt: new Date("2024-01-01"),
      lastActive: new Date(),
      leadsManaged: 45,
      conversionsThisMonth: 8,
    },
  ];

  const pendingInvites = [];

  const roles = [
    {
      name: "Admin",
      value: "admin",
      description: "Full access to all features and settings",
      permissions: [
        "Manage team members",
        "Configure integrations",
        "Access all leads",
        "Manage billing",
        "Export data",
      ],
    },
    {
      name: "Manager",
      value: "manager",
      description: "Manage leads and team performance",
      permissions: [
        "View all leads",
        "Assign leads",
        "View analytics",
        "Manage outreach",
        "View team activity",
      ],
    },
    {
      name: "Member",
      value: "member",
      description: "Work with assigned leads",
      permissions: [
        "View assigned leads",
        "Send outreach",
        "Manage conversations",
        "Update lead status",
      ],
    },
    {
      name: "Viewer",
      value: "viewer",
      description: "Read-only access to data",
      permissions: [
        "View leads",
        "View analytics",
        "Export reports",
      ],
    },
  ];

  const getRoleBadge = (role) => {
    const colors = {
      admin: "badge-error",
      manager: "badge-warning",
      member: "badge-primary",
      viewer: "badge-gray",
    };
    return colors[role] || "badge-gray";
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Team</h1>
            <p className="page-description">
              Manage team members, roles, and permissions
            </p>
          </div>
          <div className="page-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowInviteModal(true)}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              Invite Member
            </button>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="stats-grid" style={{ marginBottom: "32px" }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Team Size</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{teamMembers.length}</div>
          <div className="stat-change">Active members</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Leads</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
            </div>
          </div>
          <div className="stat-value">45</div>
          <div className="stat-change">Managed by team</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Conversions</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">8</div>
          <div className="stat-change">This month</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pending Invites</span>
            <div className="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{pendingInvites.length}</div>
          <div className="stat-change">Awaiting acceptance</div>
        </div>
      </div>

      {/* Team Members */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">Team Members</div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Leads</th>
                <th>Conversions</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--primary-500)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                      }}>
                        {member.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{member.name}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>{member.leadsManaged}</td>
                  <td>{member.conversionsThisMonth}</td>
                  <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Just now
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles & Permissions */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Roles & Permissions
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {roles.map((role) => (
            <div key={role.value} className="card">
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                  {role.name}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                  {role.description}
                </div>
              </div>

              <div style={{ fontSize: "13px" }}>
                <div style={{ fontWeight: 500, marginBottom: "8px", color: "var(--text-secondary)" }}>
                  Permissions:
                </div>
                <ul style={{ paddingLeft: "20px", margin: 0, lineHeight: "1.8" }}>
                  {role.permissions.map((permission) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal (Coming Soon) */}
      {showInviteModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: "500px", width: "90%" }}>
            <div className="card-header">
              <div className="card-title">Invite Team Member</div>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowInviteModal(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ padding: "24px 0" }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{
                padding: "12px",
                background: "var(--warning)",
                color: "white",
                borderRadius: "var(--radius)",
                fontSize: "13px",
                marginBottom: "16px",
              }}>
                <strong>Coming Soon:</strong> Team collaboration features are in development.
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled>
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
