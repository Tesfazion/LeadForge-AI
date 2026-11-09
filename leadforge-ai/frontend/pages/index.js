/**
 * LeadForge AI — Public marketing landing page
 *
 * An official Sunshine Tech Solution product page (same family as
 * sunshinetechsolution.vercel.app and ideaforge-ai-omega.vercel.app):
 *   - Bright corporate hero with orange CTA pair
 *   - Product guardrails
 *   - Feature grid (what the platform does)
 *   - How it works (numbered steps)
 *   - Final CTA + professional dark footer
 *
 * The logged-in product (dashboard shell) starts at /dashboard.
 */

import Link from "next/link";

const FEATURES = [
  {
    tag: "DISCOVERY",
    title: "AI Lead Discovery",
    text: "Search provider-sourced prospect records with Apollo, or add contacts you already know. Fictional AI samples are clearly separated from real contacts.",
  },
  {
    tag: "OUTREACH",
    title: "Human-reviewed Outreach",
    text: "Generate a personalized email draft for a lead, review it, and approve before the configured mail provider sends it.",
  },
  {
    tag: "AGENTS",
    title: "On-demand AI assistance",
    text: "Run drafting, conversation analysis, requirements extraction, and website generation when you choose each workflow action.",
  },
  {
    tag: "CONVERSATIONS",
    title: "Conversation workspace",
    text: "Keep conversation records with each lead. Real inbox synchronization is not yet available; test replies are labeled as simulations.",
  },
  {
    tag: "ANALYTICS",
    title: "Pipeline analytics",
    text: "Review lead stages, response activity, and acquisition sources using the records in your workspace.",
  },
  {
    tag: "DEPLOYMENT",
    title: "Website delivery",
    text: "Extract a structured brief, generate the project files, review the source, then deploy to Vercel when ready.",
  },
];

const STEPS = [
  {
    step: "STEP 01",
    label: "Manual or provider sourced",
    title: "Bring prospects into your pipeline",
    text: "Add contacts yourself or search real prospect records through a configured Apollo account.",
  },
  {
    step: "STEP 02",
    label: "Human reviewed",
    title: "Prepare outreach",
    text: "Ask AI to draft an individual message, then review and explicitly approve it before sending.",
  },
  {
    step: "STEP 03",
    label: "Inbox sync not available",
    title: "Manage the conversation",
    text: "Keep messages on the lead record. Entered test replies are simulations, not messages received from a real mailbox.",
  },
  {
    step: "STEP 04",
    label: "Review files before deploy",
    title: "Turn requirements into a website",
    text: "Extract requirements, generate project files, review the source, and deploy to Vercel when configured.",
  },
];

const PRINCIPLES = [
  { value: "Human review", label: "before outreach is sent" },
  { value: "Workspace scoped", label: "leads and project data" },
  { value: "Review first", label: "inspect generated files before deployment" },
  { value: "Samples labeled", label: "fictional data stays out of pipeline" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Parent-company ribbon ─────────────────────────────────────── */}
      <div className="landing-ribbon">
        <div className="landing-container landing-ribbon-inner">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span className="ribbon-dot" aria-hidden="true" />
            A <strong>Sunshine Tech Solution</strong> product
          </span>
          <a href="https://sunshinetechsolution.vercel.app/" target="_blank" rel="noopener noreferrer">
            sunshinetechsolution.vercel.app
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      {/* ── Navigation bar ─────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link href="/" className="landing-logo" aria-label="LeadForge AI home">
            <img
              src="/LeadForge AI Agent logo.png"
              alt="LeadForge AI logo"
              className="landing-logo-img"
            />
            <span>
              LeadForge <span className="landing-logo-sub">AI</span>
            </span>
          </Link>

          <nav className="landing-links" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#workflow-principles">Why LeadForge</a>
          </nav>

          <div className="landing-nav-actions">
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Open dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-container">
          <span className="landing-eyebrow">SUNSHINE TECH SOLUTION</span>
          <h1 className="landing-hero-title">
            From prospect to <span className="text-gradient-brand">customer-ready</span> website.
          </h1>
          <p className="landing-hero-text">
            LeadForge brings prospect records, human-reviewed outreach, conversation workflows,
            and website delivery into one workspace.
          </p>
          <div className="landing-hero-actions">
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Open dashboard
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              See how it works
            </a>
          </div>
          <p className="landing-hero-note">
            Built for teams that sell.
          </p>

          {/* Product preview card */}
          <div className="landing-preview">
            <div className="landing-preview-bar">
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-title">LeadForge AI — Dashboard</span>
              <span className="badge badge-warning" style={{ marginLeft: "auto" }}>
                Illustrative sample data
              </span>
            </div>
            <div className="landing-preview-body">
              <div className="landing-preview-side">
                <span className="active">Dashboard</span>
                <span>Leads</span>
                <span>Discover</span>
                <span>Outreach</span>
                <span>Projects</span>
                <span>Analytics</span>
              </div>
              <div className="landing-preview-main">
                <div className="landing-preview-stats">
                  <div className="landing-preview-stat">
                    <small>Total leads</small>
                    <strong>1,248</strong>
                  </div>
                  <div className="landing-preview-stat">
                    <small>Qualified</small>
                    <strong>312</strong>
                  </div>
                  <div className="landing-preview-stat">
                    <small>Replied</small>
                    <strong>97</strong>
                  </div>
                  <div className="landing-preview-stat">
                    <small>Sites built</small>
                    <strong>28</strong>
                  </div>
                </div>
                <div className="landing-preview-rows">
                  <div className="landing-preview-row">
                    <span className="badge badge-primary">Qualified</span>
                    <span>Addis Fashion House — draft awaiting review</span>
                  </div>
                  <div className="landing-preview-row">
                    <span className="badge badge-success">Replied</span>
                    <span>Haile Health Center — conversation recorded</span>
                  </div>
                  <div className="landing-preview-row">
                    <span className="badge badge-gray">New</span>
                    <span>Ethiopian Diaspora Group — awaiting review</span>
                  </div>
                </div>
                <p style={{ margin: "10px 0 0", color: "var(--text-tertiary)", fontSize: "12px", textAlign: "center" }}>
                  Fictional examples only — not live customer activity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product principles ─────────────────────────────────────────── */}
      <section className="landing-stats" id="workflow-principles">
        <div className="landing-container landing-stats-grid">
          {PRINCIPLES.map((s) => (
            <div key={s.label} className="landing-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <span className="landing-eyebrow">WHAT WE DO</span>
          <h2 className="landing-section-title">Everything your pipeline needs</h2>
          <p className="landing-section-text">
            A connected product workflow with clear human review at consequential steps.
          </p>

          <div className="landing-feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="landing-feature card">
                <span className="landing-feature-tag">{f.tag}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="landing-section landing-section-alt" id="how-it-works">
        <div className="landing-container">
          <span className="landing-eyebrow">HOW IT WORKS</span>
          <h2 className="landing-section-title">From prospect to live website</h2>
          <p className="landing-section-text">
            Four explicit steps — with provider requirements and current product limits shown clearly.
          </p>

          <div className="landing-steps-grid">
            {STEPS.map((s, i) => (
              <article key={s.title} className="landing-step">
                <div className="landing-step-num">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div className="landing-step-meta">
                    {s.step} · {s.label}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-cta">
            <h2>Ready to build something great?</h2>
            <p>
              Open your dashboard and put LeadForge AI to work on your pipeline today.
            </p>
            <div className="landing-hero-actions" style={{ justifyContent: "center" }}>
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Open dashboard
              </Link>
              <Link href="https://sunshinetechsolution.vercel.app/" className="btn btn-secondary btn-lg">
                Visit Sunshine Tech Solution
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-top">
            <div>
              <div className="landing-logo landing-footer-logo">
                <img
                  src="/LeadForge AI Agent logo.png"
                  alt=""
                  className="landing-logo-img"
                />
                <span>LeadForge AI</span>
              </div>
              <p className="landing-footer-tagline">
                Lead-to-website workflow workspace — an official product of
                Sunshine Tech Solution.
              </p>
            </div>
            <div className="landing-footer-cols">
              <div>
                <h4>PRODUCT</h4>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/leads">Leads</Link>
                <Link href="/agents">Automation activity</Link>
                <Link href="/analytics">Analytics</Link>
              </div>
              <div>
                <h4>SUNSHINE TECH</h4>
                <a href="https://sunshinetechsolution.vercel.app/">Website</a>
                <a href="https://sunshinetechsolution.vercel.app/#services">Services</a>
                <a href="https://sunshinetechsolution.vercel.app/#contact">Contact</a>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            © 2026 Sunshine Tech Solution. LeadForge is a Sunshine Tech Solution product.
          </div>
        </div>
      </footer>
    </div>
  );
}
