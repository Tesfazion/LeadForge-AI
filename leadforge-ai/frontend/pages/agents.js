import Link from "next/link";
import useSWR from "swr";
import Icon from "../components/Icon";
import { api } from "../lib/api";

const WORKFLOW = [
  {
    name: "Outreach",
    description: "Drafts personalized email for a lead you select. Every message requires your review before sending.",
    href: "/outreach",
    metric: (stats) => `${stats?.outreach?.pending ?? 0} pending review`,
  },
  {
    name: "Conversation",
    description: "Creates an AI response when a reply is submitted. The current reply entry is a testing simulation, not inbox sync.",
    href: "/conversations",
    metric: (stats) => `${stats?.chat?.active ?? 0} conversations with replies`,
  },
  {
    name: "Requirements",
    description: "Extracts a structured website brief from a lead conversation and creates a project.",
    href: "/projects",
    metric: (stats) => `${stats?.requirements?.extracted ?? 0} projects with requirements`,
  },
  {
    name: "Website delivery",
    description: "Generates a reviewable site preview, then deploys it to Vercel after you approve.",
    href: "/projects",
    metric: (stats) => `${stats?.developer?.deployed ?? 0} websites deployed`,
  },
];

function activityHref(activity) {
  if (activity.leadId) return `/leads/${activity.leadId}`;
  if (activity.projectId) return "/projects";
  return "/projects";
}

export default function AgentsPage() {
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR("activities/stats", api.getActivitiesStats);
  const { data: activities, error: activityError } = useSWR("activities", () => api.getActivities(30), {
    refreshInterval: 15000,
  });

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <span className="dashboard-kicker">LEADFORGE WORKFLOW</span>
            <h1 className="page-title">Automation activity</h1>
            <p className="page-description">
              AI actions run when you start a workflow step. LeadForge does not run background campaigns or monitor an inbox.
            </p>
          </div>
        </div>
      </div>

      <div className="banner banner-info" role="note" style={{ marginBottom: "24px" }}>
        The activity timeline is held in API process memory and clears when the backend restarts. Counts below are derived from workspace records.
      </div>

      {statsError && <div className="banner banner-error" role="alert">Could not load workflow counts. Check the API connection and retry.</div>}

      <section className="grid-auto" aria-label="Automation workflow stages">
        {WORKFLOW.map((step, index) => (
          <article className="card" key={step.name}>
            <span className="dashboard-section-eyebrow">STEP {String(index + 1).padStart(2, "0")}</span>
            <h2 className="card-title" style={{ marginTop: "8px" }}>{step.name}</h2>
            <p className="card-subtitle">{step.description}</p>
            <div className="settings-note" style={{ margin: "16px 0" }}>
              {statsLoading ? "Loading workspace counts…" : step.metric(stats)}
            </div>
            <Link href={step.href} className="dashboard-text-link">Open workflow <span aria-hidden="true">→</span></Link>
          </article>
        ))}
      </section>

      <section className="card" style={{ marginTop: "24px" }} aria-labelledby="activity-feed-title">
        <div className="card-header">
          <div>
            <h2 id="activity-feed-title" className="card-title">Recent actions</h2>
            <p className="card-subtitle">Workflow events from this running API process</p>
          </div>
          <span className="badge badge-gray">Refreshes every 15 seconds</span>
        </div>

        {activityError ? (
          <div className="banner banner-error" role="alert">The recent activity feed is temporarily unavailable.</div>
        ) : !activities ? (
          <div className="empty-state" role="status"><div className="spinner" /></div>
        ) : activities.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px" }}>
            <div className="empty-state-icon"><Icon name="robot" size={22} /></div>
            <h3 className="empty-state-title">No workflow actions yet</h3>
            <p className="empty-state-description">Start by discovering prospects, reviewing an outreach draft, or opening a website project.</p>
            <Link className="btn btn-primary" href="/discover">Find prospects</Link>
          </div>
        ) : (
          <div className="grid-stack" style={{ gap: "0" }}>
            {activities.map((activity) => (
              <Link className="activity-feed-item" href={activityHref(activity)} key={activity.id}>
                <span className={`activity-feed-dot status-${activity.status || "idle"}`} aria-hidden="true" />
                <span className="activity-feed-copy">
                  <span className="activity-feed-title">{(activity.action || "updated pipeline").replace(/_/g, " ")}</span>
                  <span className="activity-feed-meta">
                    {(activity.agent || "LeadForge").replace(/_/g, " ")}
                    {activity.metadata?.leadName ? ` · ${activity.metadata.leadName}` : ""}
                    {activity.metadata?.projectName ? ` · ${activity.metadata.projectName}` : ""}
                    {activity.status === "error" ? " · Needs attention" : ""}
                  </span>
                </span>
                <time className="activity-feed-time" dateTime={activity.timestamp}>
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.timestamp))}
                </time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
