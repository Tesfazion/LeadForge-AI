import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import { formatDate, formatStatus, getStatusBadgeClass } from "../lib/utils";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function getInitials(value) {
  return (value || "?")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getActivityLabel(activity) {
  const action = (activity.action || "updated pipeline").replace(/_/g, " ");
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function ActivityItem({ activity }) {
  const href = activity.leadId
    ? `/leads/${activity.leadId}`
    : activity.projectId
      ? "/projects"
      : "/agents";

  return (
    <Link href={href} className="activity-feed-item">
      <span className={`activity-feed-dot status-${activity.status || "idle"}`} aria-hidden="true" />
      <span className="activity-feed-copy">
        <span className="activity-feed-title">{getActivityLabel(activity)}</span>
        <span className="activity-feed-meta">
          {(activity.agent || "LeadForge").replace(/_/g, " ")}
          {activity.status === "error" ? " · Needs attention" : ""}
        </span>
      </span>
      <time className="activity-feed-time" dateTime={activity.timestamp}>
        {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(activity.timestamp))}
      </time>
    </Link>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState(30);
  useEffect(() => {
    const savedRange = Number(localStorage.getItem("leadforge.dashboardRange"));
    if (RANGE_OPTIONS.some((option) => option.value === savedRange)) setRange(savedRange);
  }, []);
  const { data: summary, error, mutate, isValidating } = useSWR(
    ["dashboard-summary", range],
    ([, period]) => api.getDashboardSummary(period)
  );
  const { data: activities, error: activityError } = useSWR("dashboard-activities", () => api.getActivities(8), {
    refreshInterval: 15_000,
  });

  const dashboard = useMemo(() => {
    if (!summary) return null;
    const { statusCounts } = summary;
    const qualified = statusCounts.QUALIFIED || 0;
    const replied = statusCounts.REPLIED || 0;

    const stages = [
      { label: "New", count: statusCounts.NEW || 0, color: "var(--dash-stage-new)" },
      { label: "Drafting", count: (statusCounts.OUTREACH_DRAFTED || 0) + (statusCounts.OUTREACH_PENDING_APPROVAL || 0), color: "var(--dash-stage-draft)" },
      { label: "Contacted", count: statusCounts.OUTREACH_SENT || 0, color: "var(--dash-stage-outreach)" },
      { label: "Replied", count: replied, color: "var(--dash-stage-replied)" },
      { label: "Qualified", count: qualified, color: "var(--dash-stage-qualified)" },
    ];

    return {
      ...summary,
      stages,
    };
  }, [summary]);

  const greeting = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const priorityAction = dashboard?.pendingOutreachCount
    ? {
        eyebrow: "Waiting on you",
        title: `${dashboard.pendingOutreachCount} draft${dashboard.pendingOutreachCount === 1 ? "" : "s"} ready for review`,
        detail: "Your approval is the final step before outreach goes out.",
        href: "/outreach",
        action: "Review drafts",
        icon: "mail",
      }
    : dashboard?.replyReadyLead
      ? {
          eyebrow: "A prospect replied",
          title: dashboard.replyReadyLead.name || dashboard.replyReadyLead.email,
          detail: "Continue the conversation and decide whether their needs are ready to become a project.",
          href: `/leads/${dashboard.replyReadyLead.id}`,
          action: "Open conversation",
          icon: "message",
        }
      : dashboard?.actionableProject
        ? {
            eyebrow: "Website project",
            title: dashboard.actionableProject.name,
            detail: dashboard.actionableProject.status === "PREVIEW_READY" || dashboard.actionableProject.status === "DEPLOY_FAILED"
              ? "Review the generated site and deploy it, or retry the previous deployment."
              : "Generate website project files from the captured requirements.",
            href: dashboard.actionableProject.status === "PREVIEW_READY" || dashboard.actionableProject.status === "DEPLOY_FAILED"
              ? `/preview/${dashboard.actionableProject.id}`
              : "/projects",
            action: dashboard.actionableProject.status === "PREVIEW_READY" || dashboard.actionableProject.status === "DEPLOY_FAILED"
              ? "Review website"
              : "Build website",
            icon: "rocket",
          }
        : dashboard?.statusCounts.NEW
          ? {
              eyebrow: "Next pipeline step",
              title: `${dashboard.statusCounts.NEW} new prospect${dashboard.statusCounts.NEW === 1 ? "" : "s"} to engage`,
              detail: "Review a lead and draft personalized outreach when you are ready.",
              href: "/leads",
              action: "Open pipeline",
              icon: "users",
            }
          : {
        eyebrow: "Keep momentum",
        title: dashboard?.total ? "Find your next great-fit prospects" : "Bring your first prospects into LeadForge",
        detail: "Discover real prospects through a configured provider, or preview the workflow with clearly marked sample data.",
        href: "/discover",
        action: "Discover leads",
        icon: "search",
      };

  if (error) {
    return (
      <>
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <span className="dashboard-kicker">WORKSPACE OVERVIEW</span>
              <h1 className="page-title">Your pipeline, at a glance.</h1>
              <p className="page-description">A clear view of momentum, conversations, and what deserves your attention.</p>
            </div>
          </div>
        </div>
        <div className="dashboard-error" role="alert">
          <div>
            <h2 className="dashboard-error-title">We couldn&apos;t reach your workspace</h2>
            <p className="dashboard-error-description">Check your API connection and retry. Your data hasn&apos;t been changed.</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => mutate()} disabled={isValidating}>
            {isValidating ? "Reconnecting…" : "Try again"}
          </button>
        </div>
      </>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-loading" role="status" aria-busy="true">
        <span className="dashboard-loading-mark"><Icon name="chart" size={22} /></span>
        <span>Preparing your workspace…</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div>
          <span className="dashboard-kicker">WORKSPACE OVERVIEW</span>
          <h1 className="dashboard-title">From first prospect to live website.</h1>
          <p className="dashboard-subtitle">Move through discovery, human-reviewed outreach, real conversations, and customer website delivery.</p>
        </div>
        <div className="dashboard-heading-actions">
          <span className="dashboard-date"><span className="dashboard-live-dot" />{greeting}</span>
          <Link href="/leads" className="btn btn-secondary dashboard-add-button">
            <Icon name="plus" size={17} /> Add a lead
          </Link>
          <Link href="/discover" className="btn btn-primary dashboard-discover-button">
            <Icon name="search" size={17} /> Find prospects
          </Link>
        </div>
      </header>

      <section className="dashboard-hero" aria-label="Pipeline summary">
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-eyebrow"><span className="dashboard-pulse" /> LEADFORGE WORKSPACE</span>
          <h2>Build a stronger <span>pipeline.</span></h2>
          <p>Turn focused discovery and thoughtful follow-up into a reliable path from first contact to opportunity.</p>
          <div className="dashboard-hero-links">
            <Link href="/leads">Explore your pipeline <span aria-hidden="true">→</span></Link>
            <span className="dashboard-hero-divider" aria-hidden="true" />
            <Link href="/projects">See website projects <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="dashboard-hero-aside" aria-label="Pipeline performance">
          <div className="hero-metric">
            <span className="hero-metric-label">Qualified conversion</span>
            <span className="hero-metric-value">{dashboard.conversion.toFixed(1)}<small>%</small></span>
            <span className="hero-metric-note">of all leads are qualified</span>
          </div>
          <div className="hero-metric-rule" />
          <div className="hero-metric">
            <span className="hero-metric-label">Response rate</span>
            <span className="hero-metric-value">{dashboard.responseRate.toFixed(1)}<small>%</small></span>
            <span className="hero-metric-note">of contacted leads replied</span>
          </div>
        </div>
        <span className="dashboard-hero-orbit dashboard-hero-orbit-one" aria-hidden="true" />
        <span className="dashboard-hero-orbit dashboard-hero-orbit-two" aria-hidden="true" />
      </section>

      <section className="dashboard-stat-grid" aria-label="Pipeline key metrics">
        <article className="dashboard-stat-card dashboard-stat-primary">
          <span className="dashboard-stat-icon"><Icon name="users" size={18} /></span>
          <span className="dashboard-stat-label">Total prospects</span>
          <strong className="dashboard-stat-value">{dashboard.total.toLocaleString()}</strong>
          <span className="dashboard-stat-foot">Across every stage</span>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon stat-icon-blue"><Icon name="mail" size={18} /></span>
          <span className="dashboard-stat-label">Reached</span>
          <strong className="dashboard-stat-value">{dashboard.contacted.toLocaleString()}</strong>
          <span className="dashboard-stat-foot">Outreach sent</span>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon stat-icon-green"><Icon name="message" size={18} /></span>
          <span className="dashboard-stat-label">Responded</span>
          <strong className="dashboard-stat-value">{dashboard.responded.toLocaleString()}</strong>
          <span className="dashboard-stat-foot">Replies, including qualified prospects</span>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon stat-icon-purple"><Icon name="check-circle" size={18} /></span>
          <span className="dashboard-stat-label">Qualified</span>
          <strong className="dashboard-stat-value">{dashboard.qualified.toLocaleString()}</strong>
          <span className="dashboard-stat-foot">Ready for the next step</span>
        </article>
      </section>

      {dashboard.total === 0 ? (
        <section className="dashboard-empty-workspace">
          <div className="dashboard-empty-symbol"><Icon name="rocket" size={25} /></div>
          <div className="dashboard-empty-copy">
            <span className="dashboard-section-eyebrow">A better kind of pipeline starts here</span>
            <h2>Your next customer is out there.</h2>
            <p>Discover prospects that fit your business, or add contacts you already know. LeadForge brings every next step into one thoughtful workflow.</p>
            <div className="dashboard-empty-actions">
              <Link href="/discover" className="btn btn-primary"><Icon name="search" size={17} /> Discover prospects</Link>
              <Link href="/leads" className="btn btn-secondary"><Icon name="plus" size={17} /> Add a contact</Link>
            </div>
          </div>
          <div className="dashboard-empty-steps">
            <span><b>01</b> Find the right people</span>
            <span><b>02</b> Review thoughtful outreach</span>
            <span><b>03</b> Turn replies into opportunity</span>
          </div>
        </section>
      ) : (
        <>
          <div className="dashboard-main-grid">
            <section className="dashboard-panel dashboard-trend-panel" aria-labelledby="trend-title">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-eyebrow">PIPELINE MOMENTUM</span>
                  <h2 id="trend-title">New prospects</h2>
                  <p>Prospects added during the selected period</p>
                </div>
                <label className="dashboard-range-label">
                  <span className="sr-only">Chart time period</span>
                  <select
                    value={range}
                    onChange={(event) => {
                      const nextRange = Number(event.target.value);
                      setRange(nextRange);
                      localStorage.setItem("leadforge.dashboardRange", String(nextRange));
                    }}
                    className="dashboard-range"
                  >
                    {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="dashboard-trend-summary">
                <strong>{dashboard.currentCount.toLocaleString()}</strong>
                <span>new in {range} days</span>
                <span className={`dashboard-period-change ${dashboard.change !== null && dashboard.change >= 0 ? "is-positive" : "is-negative"}`}>
                  {dashboard.change === null
                      ? dashboard.currentCount ? "New activity" : "No prior activity"
                    : `${dashboard.change >= 0 ? "+" : ""}${dashboard.change.toFixed(0)}% vs previous`}
                </span>
              </div>
              <div className="dashboard-chart" role="img" aria-label={`New leads over the last ${range} days`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard.trend} margin={{ top: 10, right: 4, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="leadTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4c8874" stopOpacity={0.23} />
                        <stop offset="96%" stopColor="#4c8874" stopOpacity={0.015} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--dash-chart-grid)" strokeDasharray="3 5" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--dash-chart-label)", fontSize: 11 }} interval={range === 30 ? 4 : range === 90 ? 1 : 0} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--dash-chart-label)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-md)" }}
                      labelStyle={{ color: "var(--text-secondary)", fontSize: 12 }}
                      itemStyle={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}
                      formatter={(value) => [value, "New prospects"]}
                    />
                    <Area type="monotone" dataKey="leads" stroke="#397b68" strokeWidth={2.5} fill="url(#leadTrendFill)" activeDot={{ r: 5, fill: "#397b68", stroke: "var(--surface-solid)", strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dashboard-panel dashboard-action-panel" aria-labelledby="action-title">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-eyebrow">YOUR NEXT MOVE</span>
                  <h2 id="action-title">Stay in motion</h2>
                  <p>A little progress goes a long way.</p>
                </div>
                <span className="dashboard-panel-mark"><Icon name="rocket" size={17} /></span>
              </div>
              <Link href={priorityAction.href} className="dashboard-next-action">
                <span className="next-action-icon"><Icon name={priorityAction.icon} size={19} /></span>
                <span className="next-action-content">
                  <span className="next-action-eyebrow">{priorityAction.eyebrow}</span>
                  <strong>{priorityAction.title}</strong>
                  <span>{priorityAction.detail}</span>
                  <span className="next-action-link">{priorityAction.action} <span aria-hidden="true">→</span></span>
                </span>
              </Link>
              <div className="dashboard-shortcut-list">
                <Link href="/conversations">
                  <span className="shortcut-dot shortcut-dot-green" />
                  <span>Continue conversations</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
                <Link href="/projects">
                  <span className="shortcut-dot shortcut-dot-blue" />
                  <span>Move a qualified lead to delivery</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </section>
          </div>

          <div className="dashboard-lower-grid">
            <section className="dashboard-panel dashboard-leads-panel" aria-labelledby="recent-leads-title">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-eyebrow">RECENTLY ADDED</span>
                  <h2 id="recent-leads-title">Your latest prospects</h2>
                </div>
                <Link href="/leads" className="dashboard-text-link">All prospects <span aria-hidden="true">→</span></Link>
              </div>
              <div className="dashboard-lead-list">
                {dashboard.latestLeads.map((lead) => (
                  <Link href={`/leads/${lead.id}`} key={lead.id} className="dashboard-lead-row">
                    <span className="dashboard-lead-avatar">{getInitials(lead.name || lead.email)}</span>
                    <span className="dashboard-lead-main">
                      <strong>{lead.name || lead.email}</strong>
                      <span>{lead.company || lead.email}</span>
                    </span>
                    <span className={`badge ${getStatusBadgeClass(lead.status)}`}>{formatStatus(lead.status)}</span>
                    <time className="dashboard-lead-date" dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
                    <Icon name="arrow-right" size={15} className="dashboard-row-arrow" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="dashboard-panel dashboard-funnel-panel" aria-labelledby="funnel-title">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-section-eyebrow">LEAD HEALTH</span>
                  <h2 id="funnel-title">Pipeline stages</h2>
                </div>
                <Link href="/analytics" className="dashboard-panel-icon-link" aria-label="View analytics"><Icon name="trending" size={17} /></Link>
              </div>
              <div className="dashboard-funnel">
                {dashboard.stages.map((stage, index) => (
                  <div className="dashboard-funnel-stage" key={stage.label}>
                    <div className="funnel-stage-copy">
                      <span className="funnel-stage-name"><i style={{ backgroundColor: stage.color }} />{stage.label}</span>
                      <strong>{stage.count.toLocaleString()}</strong>
                    </div>
                    <div className="funnel-stage-track" role="meter" aria-label={`${stage.label} share of all prospects`} aria-valuenow={dashboard.total ? Math.round((stage.count / dashboard.total) * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${dashboard.total ? Math.max((stage.count / dashboard.total) * 100, stage.count ? 3 : 0) : 0}%`, backgroundColor: stage.color }} />
                    </div>
                    {index < dashboard.stages.length - 1 && <span className="funnel-stage-connector" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <div className="dashboard-bottom-grid">
        <section className="dashboard-panel dashboard-activity-panel" aria-labelledby="activity-title">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-section-eyebrow">WORKFLOW TRACE</span>
              <h2 id="activity-title">Recent automation activity</h2>
            </div>
            <Link href="/agents" className="dashboard-text-link">View activity <span aria-hidden="true">→</span></Link>
          </div>
          {activityError ? (
            <div className="dashboard-activity-empty" role="status">
              <span className="activity-empty-mark"><Icon name="warning" size={18} /></span>
              <span><strong>Activity is temporarily unavailable</strong><small>Your pipeline summary is still up to date.</small></span>
            </div>
          ) : activities?.length ? (
            <div className="activity-feed">{activities.slice(0, 5).map((activity) => <ActivityItem key={activity.id} activity={activity} />)}</div>
          ) : (
            <div className="dashboard-activity-empty">
              <span className="activity-empty-mark"><Icon name="robot" size={18} /></span>
              <span><strong>Automation runs when you take an action</strong><small>Draft outreach, process a reply, extract requirements, or build a site to see its trace here.</small></span>
            </div>
          )}
        </section>
        {!!dashboard.sourceStats && Object.keys(dashboard.sourceStats).length > 0 && (
          <section className="dashboard-panel dashboard-sources-panel" aria-labelledby="sources-title">
            <div className="dashboard-panel-heading">
              <div>
                <span className="dashboard-section-eyebrow">DISCOVERY MIX</span>
                <h2 id="sources-title">Where leads come from</h2>
              </div>
              <span className="dashboard-panel-mark"><Icon name="search" size={16} /></span>
            </div>
            <div className="dashboard-source-list">
              {Object.entries(dashboard.sourceStats).slice(0, 4).map(([source, count]) => (
                <div className="dashboard-source-row" key={source}>
                  <span>{source}</span><strong>{count}</strong>
                </div>
              ))}
            </div>
            <div className="dashboard-workspace-status">
              <span className="dashboard-live-dot" />
              Counts by acquisition source
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
