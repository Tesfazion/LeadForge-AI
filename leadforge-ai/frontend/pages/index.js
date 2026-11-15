/**
 * LeadForge AI — Public marketing landing page
 *
 * An official Sunshine Tech Solution product page (same family as
 * sunshinetechsolution.vercel.app and ideaforge-ai-omega.vercel.app):
 *   - Navy and teal brand palette
 *   - Image-led workflow chapters and product guardrails
 *   - A four-step process timeline
 *   - Final CTA and dark footer
 *
 * The logged-in product (dashboard shell) starts at /dashboard.
 */

import Link from "next/link";

const FEATURES = [
  {
    tag: "01 / DISCOVER",
    title: "Find the right opportunity",
    text: "Search provider-sourced contacts or add your own. Keep real leads organized by workspace, source, and current stage.",
    points: ["Apollo search when configured", "Saved filters and exports", "Pipeline analytics"],
    image: "/images/lead-discovery.jpg",
    imageAlt: "A laptop displaying a business analytics dashboard",
  },
  {
    tag: "02 / CONNECT",
    title: "Make every next step intentional",
    text: "Generate a personalized message, review it, and approve before your configured mail provider sends it. Keep conversation notes with the lead; inbox sync is not available yet.",
    points: ["AI drafts reviewed by you", "Conversation notes stay with each lead", "Test replies are labeled as simulations"],
    image: "/images/human-outreach.jpg",
    imageAlt: "Coworkers talking through a project at a shared table",
  },
  {
    tag: "03 / DELIVER",
    title: "Turn confirmed needs into a website",
    text: "Extract a structured brief, generate project files, inspect the source, and deploy to Vercel when you are ready and it is configured.",
    points: ["Capture requirements before building", "Review generated files first", "Deploy only when you approve"],
    image: "/images/website-delivery.jpg",
    imageAlt: "A desktop workstation displaying web design and code",
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
          <div className="landing-hero-grid">
            <div className="landing-hero-intro">
              <span className="landing-eyebrow">A CLEARER WAY TO GROW</span>
              <h1 className="landing-hero-title">
                From first prospect to <span className="text-gradient-brand">project-ready.</span>
              </h1>
              <p className="landing-hero-text">
                Find prospects, prepare thoughtful outreach, manage the next conversation,
                and turn confirmed needs into a website project — all in one workspace.
              </p>
            </div>

            <figure className="landing-hero-visual">
              <img
                src="/images/team-collaboration.jpg"
                alt="A small team collaborating around a shared project board"
                className="landing-hero-photo"
                fetchPriority="high"
              />
              <div className="landing-photo-workflow" aria-label="LeadForge workflow">
                <div className="landing-photo-workflow-heading">
                  <span className="landing-photo-workflow-dot" />
                  Your workflow, in one place
                </div>
                <div className="landing-photo-workflow-steps">
                  <span><b>01</b> Find the right people</span>
                  <span><b>02</b> Review before you send</span>
                  <span><b>03</b> Deliver after approval</span>
                </div>
              </div>
              <figcaption className="landing-photo-credit">
                Illustrative team photography · <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash License</a>
              </figcaption>
            </figure>

            <div className="landing-hero-followthrough">
              <div className="landing-hero-actions">
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Open your workspace
                </Link>
                <a href="#how-it-works" className="btn btn-secondary btn-lg">
                  Explore the workflow
                </a>
              </div>
              <ul className="landing-hero-proof" aria-label="Product safeguards">
                <li><span aria-hidden="true">✓</span> You approve every outbound email</li>
                <li><span aria-hidden="true">✓</span> Review generated files before deployment</li>
              </ul>
              <p className="landing-hero-note">
                Built by Sunshine Tech Solution.
              </p>
            </div>
          </div>

          {/* Illustrative interface, with no fabricated traction or customer activity. */}
          <div className="landing-preview">
            <div className="landing-preview-bar">
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-dot"></span>
              <span className="landing-preview-title">LeadForge AI — Workflow preview</span>
              <span className="badge badge-warning" style={{ marginLeft: "auto" }}>
                Illustrative interface
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
                    <small>Prospects</small>
                    <strong>Workspace scoped</strong>
                  </div>
                  <div className="landing-preview-stat">
                    <small>Outreach</small>
                    <strong>Human reviewed</strong>
                  </div>
                  <div className="landing-preview-stat">
                    <small>AI examples</small>
                    <strong>Clearly labeled</strong>
                  </div>
                  <div className="landing-preview-stat">
                    <small>Websites</small>
                    <strong>Review before deploy</strong>
                  </div>
                </div>
                <div className="landing-preview-rows">
                  <div className="landing-preview-row">
                    <span className="badge badge-primary">Lead</span>
                    <span>Review a prospect record</span>
                  </div>
                  <div className="landing-preview-row">
                    <span className="badge badge-warning">Outreach</span>
                    <span>Approve a draft before sending</span>
                  </div>
                  <div className="landing-preview-row">
                    <span className="badge badge-success">Delivery</span>
                    <span>Inspect generated files before deploy</span>
                  </div>
                </div>
                <p className="landing-preview-disclaimer">
                  Product illustration only. No live customer records, activity, or performance claims.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-trust-section" aria-labelledby="landing-trust-title">
        <div className="landing-container landing-trust-grid">
          <figure className="landing-trust-visual">
            <img
              src="/images/workspace.jpg"
              alt="A bright, welcoming shared workspace"
              loading="lazy"
            />
            <figcaption>
              Illustrative workspace photography · <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash License</a>
            </figcaption>
          </figure>
          <div className="landing-trust-copy">
            <span className="landing-eyebrow">AUTOMATION WITH YOU IN CONTROL</span>
            <h2 id="landing-trust-title">Useful AI. Honest boundaries.</h2>
            <p>
              LeadForge helps with repetitive work while keeping meaningful decisions visible
              and in your hands.
            </p>
            <ul>
              <li><span aria-hidden="true">✓</span><span><strong>Nothing sends itself.</strong> Review and approve each outreach draft.</span></li>
              <li><span aria-hidden="true">✓</span><span><strong>No pretend inbox.</strong> Replies entered in the current workflow are identified as simulations.</span></li>
              <li><span aria-hidden="true">✓</span><span><strong>No blind deployment.</strong> Inspect generated project files before publishing.</span></li>
            </ul>
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
      <section className="landing-section landing-capabilities" id="features">
        <div className="landing-container">
          <div className="landing-section-heading">
            <div>
              <span className="landing-eyebrow">THE PIPELINE, CONNECTED</span>
              <h2 className="landing-section-title">One clear path from lead to launch.</h2>
            </div>
            <p className="landing-section-text">
              LeadForge brings prospecting, reviewed outreach, and website delivery into one
              workspace — with you in control at each step.
            </p>
          </div>

          <div className="landing-feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="landing-feature">
                <figure className="landing-feature-visual">
                  <img src={f.image} alt={f.imageAlt} loading="lazy" />
                  <figcaption>
                    Illustrative photography · <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash License</a>
                  </figcaption>
                </figure>
                <div className="landing-feature-copy">
                  <span className="landing-feature-tag">{f.tag}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  <ul>
                    {f.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="landing-section landing-process-section" id="how-it-works">
        <div className="landing-container">
          <div className="landing-process-heading">
            <span className="landing-eyebrow">HOW IT WORKS</span>
            <h2 className="landing-section-title">A thoughtful workflow, start to finish.</h2>
            <p className="landing-section-text">
              Four visible steps — and meaningful decisions stay in your hands.
            </p>
          </div>

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
      <section className="landing-section landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta">
            <div>
              <span className="landing-cta-kicker">YOUR NEXT STEP</span>
              <h2>Turn a promising lead into a project.</h2>
              <p>Bring your pipeline and work through the process with clarity and control.</p>
            </div>
            <div className="landing-hero-actions">
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
