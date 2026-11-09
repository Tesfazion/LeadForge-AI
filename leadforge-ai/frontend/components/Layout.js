/**
 * Layout component — LeadForge AI application shell
 *
 * A distinct LeadForge product shell within the Sunshine Tech Solution family:
 *   - Product-first identity with a quiet parent-company signature
 *   - Grouped navigation with an orange active-state rail
 *   - Topbar with breadcrumb context, global search and account actions
 *   - Consistent content container (max 1400px) + product footer
 *
 * Theme (dark / light) is stored in localStorage and applied via the
 * `data-theme` attribute on <html>. The sidebar collapses to an off-canvas
 * drawer below 1024px and is always visible on desktop.
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import Icon from "./Icon";
import { api } from "../lib/api";

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

const NAV = [
  {
    section: "Main",
    items: [
      { name: "Dashboard",     href: "/dashboard",     icon: "chart"   },
      { name: "Leads",         href: "/leads",         icon: "users"   },
      { name: "Discover",      href: "/discover",      icon: "search"  },
      { name: "Agents",        href: "/agents",        icon: "robot"   },
    ],
  },
  {
    section: "Engagement",
    items: [
      { name: "Inbox",         href: "/inbox",         icon: "inbox"   },
      { name: "Outreach",      href: "/outreach",      icon: "mail",   badge: true },
      { name: "Conversations", href: "/conversations", icon: "message" },
      { name: "Analytics",     href: "/analytics",     icon: "trending"},
    ],
  },
  {
    section: "Automation",
    items: [
      { name: "Projects",      href: "/projects",      icon: "folder"  },
      { name: "Integrations",  href: "/integrations",  icon: "plugin"  },
      { name: "Team",          href: "/team",          icon: "team"    },
      { name: "Settings",      href: "/settings",      icon: "settings" },
    ],
  },
];

const SUNSHINE_URL = "https://sunshinetechsolution.vercel.app/";

// Routes that are not primary navigation entries but still appear in the
// topbar breadcrumb (keyed by first path segment).
const BREADCRUMB_OVERRIDES = {
  "build-live": "Build Live",
  preview: "Projects",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Layout({ children, userEmail, authError, onSignOut }) {
  const router = useRouter();
  const [theme, setTheme]             = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch the real pending outreach count for the nav badge
  const { data: pendingOutreach } = useSWR(
    "pending-outreach",
    api.getPendingOutreach,
    { refreshInterval: 30_000 } // re-check every 30 s
  );
  const pendingCount = pendingOutreach?.length ?? 0;
  const { data: searchLeads, error: searchError } = useSWR(
    searchOpen && debouncedSearch ? ["global-lead-search", debouncedSearch] : null,
    ([, query]) => api.searchLeads(query),
    { keepPreviousData: true }
  );

  // Restore theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    applyTheme(saved);
    document.documentElement.setAttribute(
      "data-density",
      localStorage.getItem("leadforge.density") || "comfortable"
    );
  }, []);

  useEffect(() => {
    function syncTheme(event) {
      const next = event.detail === "dark" ? "dark" : "light";
      localStorage.setItem("theme", next);
      applyTheme(next);
    }

    window.addEventListener("leadforge:theme-change", syncTheme);
    return () => window.removeEventListener("leadforge:theme-change", syncTheme);
  }, []);

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  // Escape closes the mobile drawer
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    }

    function onPointerDown(event) {
      if (!searchWrapperRef.current?.contains(event.target)) setSearchOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [router.asPath]);

  function applyTheme(value) {
    setTheme(value);
    document.documentElement.setAttribute("data-theme", value);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  // Current page label for the topbar breadcrumb. Detail routes such as
  // /leads/123 or /preview/abc are not NAV entries, so match their parent
  // section first and fall back to an override before defaulting.
  const navItems = NAV.flatMap((group) => group.items);
  const currentItem =
    navItems.find((item) => item.href === router.pathname) ??
    navItems.find((item) => router.pathname.startsWith(`${item.href}/`)) ??
    { name: BREADCRUMB_OVERRIDES[router.pathname.split("/")[1]] ?? "Dashboard" };
  const normalizedQuery = searchQuery.trim().toLowerCase();
  useEffect(() => {
    if (!searchOpen || normalizedQuery.length < 2) {
      setDebouncedSearch("");
      return;
    }

    const timeout = window.setTimeout(() => setDebouncedSearch(normalizedQuery), 180);
    return () => window.clearTimeout(timeout);
  }, [normalizedQuery, searchOpen]);

  const searchResults = useMemo(() => {
    const routes = NAV.flatMap((group) => group.items)
      .filter((item) => normalizedQuery && item.name.toLowerCase().includes(normalizedQuery))
      .map((item) => ({ ...item, type: "page" }));
    const leads = (searchLeads ?? [])
      .filter((lead) => {
        const searchable = `${lead.name ?? ""} ${lead.email ?? ""} ${lead.company ?? ""}`.toLowerCase();
        return normalizedQuery && searchable.includes(normalizedQuery);
      })
      .slice(0, 6)
      .map((lead) => ({
        name: lead.name || lead.email,
        detail: [lead.company, lead.email].filter(Boolean).join(" · "),
        href: `/leads/${lead.id}`,
        icon: "users",
        type: "lead",
      }));
    return [...routes, ...leads].slice(0, 8);
  }, [normalizedQuery, searchLeads]);

  return (
    <div className="app-layout">
      {/* Keyboard users land here first */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Mobile drawer backdrop */}
      <div
        className={`sidebar-scrim ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <aside
        id="app-sidebar"
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Workspace navigation"
      >
        {/* Brand lockup */}
        <div className="sidebar-header">
          <Link href="/dashboard" className="brand" aria-label="LeadForge workspace">
            <span className="brand-mark-tile" aria-hidden="true">LF</span>
            <span className="brand-text">
              <span className="brand-name">
                LeadForge <span className="brand-name-accent">AI</span>
              </span>
              <span className="brand-parent">Pipeline workspace</span>
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV.map((group) => (
            <div key={group.section} className="nav-section">
              <div className="nav-section-title">{group.section}</div>

              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${router.pathname === item.href || router.pathname.startsWith(`${item.href}/`) ? "active" : ""}`}
                  aria-current={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                >
                  <Icon name={item.icon} size={20} className="nav-item-icon" />

                  {item.name}

                  {/* Badge — only shows when there are pending items */}
                  {item.badge && pendingCount > 0 && (
                    <span className="nav-badge" aria-label={`${pendingCount} pending`}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Product family link + account */}
        <div className="sidebar-footer">
          <a
            className="sidebar-help"
            href={SUNSHINE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="external-link" size={16} />
            Part of Sunshine Tech Solution
          </a>

          <div className="sidebar-workspace">
            <span className="workspace-avatar" aria-hidden="true">LF</span>
            <span className="workspace-copy">
              <span className="user-name">{userEmail || "LeadForge workspace"}</span>
              <span className="user-role">Workspace owner</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button topbar-menu"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              type="button"
            >
              <Icon name={sidebarOpen ? "close" : "menu"} size={20} />
            </button>

            <nav className="topbar-context" aria-label="Breadcrumb">
              <span className="crumb-parent">LeadForge AI</span>
              <span className="crumb-sep" aria-hidden="true">/</span>
              <span className="crumb-current" aria-current="page">
                {currentItem.name}
              </span>
            </nav>
          </div>

          <div className="topbar-search" ref={searchWrapperRef}>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search anything…"
              className="search-input"
              aria-label="Global search"
              role="combobox"
              aria-expanded={searchOpen}
              aria-controls="global-search-results"
              aria-autocomplete="list"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchIndex(0);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (!searchOpen || !searchResults.length) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSearchIndex((index) => (index + 1) % searchResults.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setSearchIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  router.push(searchResults[searchIndex].href);
                }
              }}
            />
            <span className="search-shortcut" aria-hidden="true">Ctrl K</span>
            {searchOpen && normalizedQuery && (
              <div className="search-popover" id="global-search-results" role="listbox" aria-label="Search results">
                {searchResults.length ? searchResults.map((result, index) => (
                  <Link
                    key={`${result.type}-${result.href}`}
                    href={result.href}
                    className={`search-result ${index === searchIndex ? "selected" : ""}`}
                    role="option"
                    aria-selected={index === searchIndex}
                    onMouseEnter={() => setSearchIndex(index)}
                  >
                    <span className="search-result-icon"><Icon name={result.icon} size={17} /></span>
                    <span className="search-result-copy">
                      <span className="search-result-title">{result.name}</span>
                      <span className="search-result-meta">{result.detail || (result.type === "page" ? "Go to page" : "Lead")}</span>
                    </span>
                    <span className="search-result-type">{result.type === "page" ? "PAGE" : "LEAD"}</span>
                  </Link>
                )) : (
                  <div className="search-empty">
                    {normalizedQuery.length < 2
                      ? "Type at least 2 characters to search prospects."
                      : searchError
                        ? "Lead search is temporarily unavailable."
                        : searchLeads ? "No matching leads or pages." : "Searching your workspace…"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            {/* Theme toggle */}
            <button
              className="icon-button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              type="button"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
            </button>

            {/* Notifications */}
            <Link className="icon-button" href="/inbox" aria-label="Open inbox" title="Open inbox">
              <Icon name="bell" size={20} />
            </Link>
            {authError && <span className="auth-inline-error" role="alert">{authError}</span>}
            <span className="topbar-account-label" title={userEmail}>{userEmail}</span>
            <button className="btn btn-secondary account-signout" onClick={onSignOut} type="button">
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="content-area">
          <div className="content-inner">
            <div id="main-content">{children}</div>

            <footer className="app-footer">
              <span className="product-family">
                <span className="pf-mark" aria-hidden="true" />
                © 2026 LeadForge AI · A Sunshine Tech Solution product
              </span>

              <nav className="app-footer-links" aria-label="Company links">
                <a href={SUNSHINE_URL} target="_blank" rel="noopener noreferrer">
                  Company website
                </a>
                <a href={`${SUNSHINE_URL}#services`} target="_blank" rel="noopener noreferrer">
                  Services
                </a>
                <a href={`${SUNSHINE_URL}#contact`} target="_blank" rel="noopener noreferrer">
                  Contact
                </a>
              </nav>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
