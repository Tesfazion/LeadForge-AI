/**
 * Layout component
 *
 * Wraps every page with:
 *   - A collapsible sidebar with grouped navigation links
 *   - A topbar with a global search input, theme toggle, and notification bell
 *   - A scrollable content area
 *
 * Theme (dark / light) is stored in localStorage and applied via the
 * `data-theme` attribute on <html>.  The sidebar opens/closes via the
 * hamburger button in the topbar; on desktop it is always visible.
 */

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
      { name: "Leads",         href: "/",              icon: "users"   },
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
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Layout({ children }) {
  const router = useRouter();
  const [theme, setTheme]           = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch the real pending outreach count for the nav badge
  const { data: pendingOutreach } = useSWR(
    "pending-outreach",
    api.getPendingOutreach,
    { refreshInterval: 30_000 } // re-check every 30 s
  );
  const pendingCount = pendingOutreach?.length ?? 0;

  // Restore theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    applyTheme(saved);
  }, []);

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  function applyTheme(value) {
    setTheme(value);
    document.documentElement.setAttribute("data-theme", value);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  return (
    <div className="app-layout">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <img
              src="/LeadForge AI Agent logo.png"
              alt="LeadForge AI"
              style={{ height: "40px", width: "auto", objectFit: "contain" }}
            />
          </div>
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
                  className={`nav-item ${router.pathname === item.href ? "active" : ""}`}
                  aria-current={router.pathname === item.href ? "page" : undefined}
                >
                  {/* Icon rendered via the shared Icon component */}
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

        {/* User info */}
        <div className="sidebar-footer">
          <div className="user-menu">
            <div className="user-avatar" aria-hidden="true">U</div>
            <div className="user-info">
              <div className="user-name">User</div>
              <div className="user-role">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <input
              type="search"
              placeholder="Search leads, companies, contacts…"
              className="search-input"
              aria-label="Global search"
            />
          </div>

          <div className="topbar-actions">
            {/* Theme toggle */}
            <button
              className="icon-button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
            </button>

            {/* Notifications (placeholder) */}
            <button className="icon-button" aria-label="Notifications">
              <Icon name="bell" size={20} />
            </button>

            {/* Mobile sidebar toggle */}
            <button
              className="icon-button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
