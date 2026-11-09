/**
 * LeadForge AI — Public marketing landing page
 *
 * An official Sunshine Tech Solution product page (same family as
 * sunshinetechsolution.vercel.app and ideaforge-ai-omega.vercel.app):
 *   - Bright corporate hero with orange CTA pair
 *   - Trust stats row
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
    text: "Find high-intent prospects automatically — Apollo, Hunter and web signals combined into one qualified pipeline.",
  },
  {
    tag: "OUTREACH",
    title: "Automated Outreach",
    text: "Personalized email sequences written by AI, sent on schedule, with replies routed straight to your inbox.",
  },
  {
    tag: "AGENTS",
    title: "Autonomous Agents",
    text: "Research, engage, qualify and hand over — agents work your pipeline around the clock so you don't have to.",
  },
  {
    tag: "CONVERSATIONS",
    title: "Unified Conversations",
    text: "Every reply, thread and touchpoint in one professional inbox built for fast, organized follow-up.",
  },
  {
    tag: "ANALYTICS",
    title: "Pipeline Analytics",
    text: "Conversion rates, reply rates and source performance — clear reporting your team can act on.",
  },
  {
    tag: "DEPLOYMENT",
    title: "Lead-to-Website Builds",
    text: "Turn a signed lead into a live, branded website automatically — the final step of the funnel, automated.",
  },
];

const STEPS = [
  {
    step: "STEP 01",
    label: "~2 minutes",
    title: "Connect your sources",
    text: "Link your lead sources and tools. LeadForge starts discovering and organizing prospects immediately.",
  },
  {
    step: "STEP 02",
    label: "~30 seconds per lead",
    title: "AI qualifies every lead",
    text: "Each prospect is scored and enriched so your team focuses only on leads worth pursuing.",
  },
  {
    step: "STEP 03",
    label: "On your schedule",
    title: "Outreach goes out",
    text: "Personalized sequences are drafted and sent automatically, with every reply routed to your inbox.",
  },
  {
    step: "STEP 04",
    label: "Continuous",
    title: "Close and deliver",
    text: "Track deals to the finish line — then let the platform deploy the client's website automatically.",
  },
];

const STATS = [
  { value: "10k+", label: "Leads processed" },
  { value: "94%", label: "Outreach deliverability" },
  { value: "24/7", label: "Agent coverage" },
  { value: "4 min", label: "Avg. lead-to-site build" },
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
            <a href="#stats">Why LeadForge</a>
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
            Turn leads into <span className="text-gradient-brand">revenue</span> —
            automatically.
          </h1>
          <p className="landing-hero-text">
            LeadForge AI discovers, qualifies and engages your prospects end-to-end —
            from first touch to a live website — while your team focuses on closing.
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
            Built for teams that sell. No credit card required.
          </p>

          {/* Product preview card */}
          <div className="landing-preview">
            <div className="landing-preview-bar">
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-title">LeadForge AI — Dashboard</span>
            </div>
            <div className="landing-preview-body">
              <div className="landing-preview-side">
                <span className="active">Dashboard</span>
                <span>Leads</span>
                <span>Discover</span>
                <span>Agents</span>
                <span>Inbox</span>
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
                    <span>Addis Fashion House — outreach sent</span>
                  </div>
                  <div className="landing-preview-row">
                    <span className="badge badge-success">Replied</span>
                    <span>Haile Health Center — meeting booked</span>
                  </div>
                  <div className="landing-preview-row">
                    <span className="badge badge-gray">New</span>
                    <span>Ethiopian Diaspora Group — enriching</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="landing-stats" id="stats">
        <div className="landing-container landing-stats-grid">
          {STATS.map((s) => (
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
            One platform for discovery, engagement and delivery — designed, built and
            secured by Sunshine Tech Solution.
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
            Four clear steps — the same workflow your team sees inside the dashboard.
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
                Automated lead-to-deployment platform — an official product of
                Sunshine Tech Solution.
              </p>
            </div>
            <div className="landing-footer-cols">
              <div>
                <h4>PRODUCT</h4>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/leads">Leads</Link>
                <Link href="/agents">Agents</Link>
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
