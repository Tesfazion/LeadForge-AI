/**
 * Integrations page
 *
 * Shows OAuth setup status and the availability of the Apollo discovery source.
 *
 * Theme is handled by Layout — no local theme toggle needed here.
 * All HTTP calls go through the shared api lib.
 */

import { useEffect } from "react";
import useSWR from "swr";
import { api } from "../lib/api";
import { showToast } from "../components/Toast";

// Only Apollo is currently wired into the live prospect-search workflow.
const API_INTEGRATIONS = [
  {
    name: "Apollo.io",
    icon: "🎯",
    description: "Provides real prospect records for the Lead Discovery workflow.",
  },
];

export default function IntegrationsPage() {
  // Fetch configured OAuth providers, connection status, and connected accounts.
  const { data: providers, error: providersError } = useSWR("oauth-providers", api.getOAuthProviders);
  const { data: connectionStatus, mutate: mutateStatus }
                                  = useSWR("oauth-status",     api.getConnectionStatus);
  const { data: accounts,         mutate: mutateAccounts }
                                  = useSWR("oauth-accounts",   api.getConnectedAccounts);
  // API integration configured-status comes from the server
  const { data: apiConfig }       = useSWR("oauth-config",     api.getOAuthConfig);
  const { data: discoverySources } = useSWR("discovery-sources", api.getDiscoverySources);

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

  // No fallback providers: show only what the backend reports as configured.
  const oauthProviders = providers ?? [];

  function getAccountInfo(platformId) {
    return accounts?.find((a) => a.platform === platformId);
  }

  function isConnected(platformId) {
    return !!connectionStatus?.[platformId]?.connected;
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Integrations</h1>
            <p className="page-description">
                See which provider connections are actually ready for the LeadForge workflow.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* OAuth platform connections                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-24">
        <div className="section-heading">
          <h2>Account connections · preview</h2>
          <p>OAuth tokens are currently held in backend process memory, not persisted in the workspace database.</p>
        </div>

        <div className="banner banner-warning" role="note" style={{ marginBottom: "20px" }}>
          Account connections reset when the backend restarts and are not production-ready. Connect and disconnect actions are disabled until encrypted, durable workspace storage is implemented.
        </div>

        {providersError && <div className="banner banner-error" role="alert">Could not load the provider list.</div>}
        {!providers && !providersError && <div className="card" role="status">Loading configured OAuth providers…</div>}
        {providers && providers.length === 0 && <div className="card">No OAuth providers are configured.</div>}
        <div className="grid-2">
          {oauthProviders.map((provider) => {
            const connected   = isConnected(provider.id);
            const accountInfo = getAccountInfo(provider.id);
            const configured = apiConfig?.find((item) => item.platform === provider.id)?.configured;

            return (
              <div
                key={provider.id}
                className="card"
                style={{ borderColor: connected ? "var(--success-200)" : undefined }}
              >
                {/* Top status accent */}
                <div style={{
                  height: "2px",
                  background: connected ? "var(--success)" : "var(--brand-primary)",
                  margin: "-24px -24px 20px",
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }} />

                <div style={{ display: "flex", alignItems: "start", gap: "16px" }}>
                  {/* Platform monogram */}
                  <div className={`logo-tile ${connected ? "is-connected" : ""}`} aria-hidden="true">
                    {provider.name.charAt(0)}
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Name + badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                      <div>
                        <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>{provider.name}</h3>
                        {provider.hasSharedApp && (
                          <span className="badge badge-success" style={{ marginTop: "6px", fontSize: "10px" }}>
                            Instant connect
                          </span>
                        )}
                      </div>
                      <span className={`badge ${connected ? "badge-warning" : "badge-gray"}`}>
                        {connected ? "Temporary connection" : "Setup only"}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      {provider.description}
                    </p>

                    {connected && accountInfo && (
                      <div style={{
                        padding: "10px 14px",
                        background: "var(--success-50)",
                        border: "1px solid var(--success-100)",
                        borderRadius: "var(--radius)",
                        marginBottom: "16px",
                        fontSize: "12px",
                      }}>
                        <div style={{ fontWeight: 600, color: "var(--success-700)", marginBottom: "2px" }}>
                          Connected account
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

                    <p className="settings-muted" style={{ margin: 0 }}>
                      {configured
                        ? "Provider credentials are present, but this account connection is not durably stored."
                        : "Provider credentials are not configured on the backend."}
                    </p>
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
        <div className="section-heading">
          <h2>Lead source APIs</h2>
          <p>Third-party services for discovery and enrichment — configured on the server.</p>
        </div>

        <div className="grid-3">
          {API_INTEGRATIONS.map((integration) => {
            const configured = Boolean(discoverySources?.apollo);
            return (
              <div key={integration.name} className="card">
                <div className="logo-tile logo-tile-sm" style={{ marginBottom: "12px" }} aria-hidden="true">
                  {integration.name.charAt(0)}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
                  {integration.name}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  {integration.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={`badge ${configured ? "badge-success" : "badge-gray"}`}>
                    {discoverySources ? (configured ? "Credentials configured" : "Not configured") : "Checking"}
                  </span>
                  {!configured && (
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                      Configure Apollo credentials on the backend
                    </span>
                  )}
                </div>
                <p className="settings-muted" style={{ marginTop: "12px" }}>
                  {integration.description} {configured ? "New search results can be reviewed and saved to the pipeline." : "Use AI sample mode only to preview the workflow; sample contacts cannot be saved or contacted."}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
