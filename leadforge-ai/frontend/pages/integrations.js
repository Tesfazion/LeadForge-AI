/**
 * Integrations page
 *
 * Manages OAuth platform connections (Gmail, LinkedIn, Instagram, GitHub)
 * and shows the status of API-key-based lead source integrations
 * (Apollo, Hunter, Clearbit).
 *
 * Theme is handled by Layout — no local theme toggle needed here.
 * All HTTP calls go through the shared api lib.
 */

import { useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

// Default provider list used as fallback while providers load from the API
const DEFAULT_PROVIDERS = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    description: "Access your email inbox, send emails, and manage conversations",
    features: ["Read emails", "Send emails", "Email analysis", "Auto lead creation"],
    hasSharedApp: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Connect your professional network and access profile data",
    features: ["Profile data", "Connections", "Posts", "Company info"],
    hasSharedApp: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    description: "Access your Instagram profile, posts, and insights",
    features: ["Profile data", "Posts", "Insights", "Media"],
    hasSharedApp: false,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "💻",
    description: "Access your repositories, activity, and developer profile",
    features: ["Repositories", "Activity", "Profile", "Organizations"],
    hasSharedApp: false,
  },
];

// Static API-key integrations (no OAuth flow)
const API_INTEGRATIONS = [
  {
    name: "Apollo.io",
    icon: "🎯",
    description: "B2B database with 265M+ contacts and 60M+ companies",
    features: ["Contact search", "Company data", "Email verification"],
    envKey: "APOLLO_API_KEY",
  },
  {
    name: "Hunter.io",
    icon: "🔍",
    description: "Find and verify professional email addresses",
    features: ["Email finder", "Domain search", "Bulk tasks"],
    envKey: "HUNTER_API_KEY",
  },
  {
    name: "Clearbit",
    icon: "💎",
    description: "Real-time business intelligence and lead enrichment",
    features: ["Enrichment", "Prospector", "Lead scoring"],
    envKey: "CLEARBIT_API_KEY",
  },
];

export default function IntegrationsPage() {
  const [busy,           setBusy]           = useState(false);
  const [expandedId,     setExpandedId]     = useState(null);
  const [platformData,   setPlatformData]   = useState({});

  // Fetch providers, connection status, and connected accounts via SWR
  const { data: providers }       = useSWR("oauth-providers",  api.getOAuthProviders);
  const { data: connectionStatus, mutate: mutateStatus }
                                  = useSWR("oauth-status",     api.getConnectionStatus);
  const { data: accounts,         mutate: mutateAccounts }
                                  = useSWR("oauth-accounts",   api.getConnectedAccounts);
  // API integration configured-status comes from the server
  const { data: apiConfig }       = useSWR("oauth-config",     api.getOAuthConfig);

  // Handle OAuth callback result in the URL query string
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error     = params.get("error");

    if (connected) {
      showToast(`Successfully connected ${connected}!`, "success");
      // Clean the URL and refresh connection data
      window.history.replaceState({}, "", "/integrations");
      mutateStatus();
      mutateAccounts();
    }

    if (error) {
      showToast(`OAuth error: ${error}`, "error");
      window.history.replaceState({}, "", "/integrations");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use live providers once loaded, or fall back to the static default list
  const oauthProviders = (providers && providers.length > 0) ? providers : DEFAULT_PROVIDERS;

  function getAccountInfo(platformId) {
    return accounts?.find((a) => a.platform === platformId);
  }

  function isConnected(platformId) {
    return !!connectionStatus?.[platformId]?.connected;
  }

  async function handleConnect(platformId) {
    showToast(`Redirecting to ${platformId} authorization…`, "info");
    api.connectPlatform(platformId); // full-page redirect — intentional
  }

  async function handleDisconnect(platformId) {
    if (!window.confirm(`Disconnect ${platformId}?`)) return;
    setBusy(true);
    try {
      await api.disconnectPlatform(platformId);
      showToast(`Disconnected ${platformId}`, "success");
      mutateStatus();
      mutateAccounts();
    } catch (err) {
      showToast(`Failed to disconnect: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadData(platformId) {
    setBusy(true);
    try {
      showToast(`Fetching ${platformId} data…`, "info");
      const data = await api.getPlatformData(platformId);
      setPlatformData((prev) => ({ ...prev, [platformId]: data }));
      setExpandedId(platformId);
      showToast(`Loaded ${platformId} data`, "success");
    } catch (err) {
      showToast(`Failed to load data: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  // Check whether a given API-key integration has been configured on the server
  function isApiConfigured(integration) {
    return apiConfig?.some(
      (c) => c.platform?.toUpperCase() === integration.envKey.replace("_API_KEY", "") && c.configured
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Integrations</h1>
            <p className="page-description">
              Connect your accounts and configure lead source APIs
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* OAuth platform connections                                           */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Connected Accounts</h2>
          <span className="badge badge-primary">One-Click Connect</span>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
          Authenticate once and let AI access your data securely
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "20px" }}>
          {oauthProviders.map((provider) => {
            const connected   = isConnected(provider.id);
            const accountInfo = getAccountInfo(provider.id);
            const data        = platformData[provider.id];
            const expanded    = expandedId === provider.id;

            return (
              <div
                key={provider.id}
                className="card"
                style={{ borderColor: connected ? "var(--success)" : undefined }}
              >
                {/* Top gradient accent */}
                <div style={{
                  height: "2px",
                  background: connected
                    ? "linear-gradient(90deg, var(--success), #34d399)"
                    : "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary), var(--brand-accent))",
                  margin: "-24px -24px 20px",
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }} />

                <div style={{ display: "flex", alignItems: "start", gap: "16px" }}>
                  {/* Platform icon */}
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "var(--radius-lg)",
                    background: connected
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(99, 102, 241, 0.15)",
                    border: `1px solid ${connected ? "var(--success-200)" : "var(--primary-700)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    flexShrink: 0,
                  }}>
                    {provider.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Name + badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                      <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>{provider.name}</h3>
                        {provider.hasSharedApp && (
                          <span className="badge badge-success" style={{ marginTop: "4px", fontSize: "10px" }}>
                            ⚡ INSTANT
                          </span>
                        )}
                      </div>
                      <span className={`badge ${connected ? "badge-success" : "badge-warning"}`}>
                        {connected ? "✓ Connected" : "Not Connected"}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      {provider.description}
                    </p>

                    {/* Feature tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                      {provider.features?.map((f) => (
                        <span
                          key={f}
                          style={{
                            fontSize: "11px",
                            padding: "3px 10px",
                            background: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid var(--primary-800)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--primary-300)",
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Connected account info */}
                    {connected && accountInfo && (
                      <div style={{
                        padding: "10px 14px",
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid var(--success-200)",
                        borderRadius: "var(--radius)",
                        marginBottom: "16px",
                        fontSize: "12px",
                      }}>
                        <div style={{ fontWeight: 600, color: "var(--success)", marginBottom: "2px" }}>
                          ✓ Connected Account
                        </div>
                        <div style={{ color: "var(--text-secondary)" }}>
                          {accountInfo.profile?.email
                            ?? accountInfo.profile?.username
                            ?? accountInfo.profile?.name
                            ?? "Unknown"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          Since {new Date(accountInfo.connectedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {!connected ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConnect(provider.id)}
                          disabled={busy}
                        >
                          {provider.hasSharedApp ? "🚀 Connect Now" : "🔗 Connect"}
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleLoadData(provider.id)}
                            disabled={busy}
                          >
                            📥 Load Data
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDisconnect(provider.id)}
                            disabled={busy}
                            style={{ color: "var(--error-200)", borderColor: "var(--error-700)" }}
                          >
                            Disconnect
                          </button>
                        </>
                      )}
                    </div>

                    {/* Expanded data preview */}
                    {expanded && data && (
                      <pre style={{
                        marginTop: "16px",
                        padding: "16px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: "300px",
                        overflowY: "auto",
                        color: "var(--text-secondary)",
                      }}>
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* API-key integrations                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          Lead Source APIs
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
          Third-party services for lead discovery and enrichment — configure via .env
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {API_INTEGRATIONS.map((integration) => {
            const configured = isApiConfigured(integration);
            return (
              <div key={integration.name} className="card">
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{integration.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
                  {integration.name}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  {integration.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {integration.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        background: "rgba(99, 102, 241, 0.1)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--primary-300)",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={`badge ${configured ? "badge-success" : "badge-gray"}`}>
                    {configured ? "✓ Configured" : "Not Configured"}
                  </span>
                  {!configured && (
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                      Set {integration.envKey} in .env
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
