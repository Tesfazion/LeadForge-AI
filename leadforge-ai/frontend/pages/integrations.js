import { useState, useEffect } from "react";
import { showToast } from "../components/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1100";

export default function IntegrationsPage() {
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [platformData, setPlatformData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [providers, setProviders] = useState([]);
  const [setupInstructions, setSetupInstructions] = useState({});
  const [theme, setTheme] = useState("dark");
  
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    loadConnections();
    loadProviders();
    
    // Check for OAuth callback success/error in URL
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    
    if (connected) {
      showToast(`Successfully connected ${connected}!`, "success");
      window.history.replaceState({}, '', '/integrations');
      // Reload connections after OAuth callback
      setTimeout(() => loadConnections(), 500);
    }
    
    if (error) {
      showToast(`OAuth error: ${error}`, "error");
      window.history.replaceState({}, '', '/integrations');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    showToast(`Switched to ${newTheme} mode`, "info");
  };

  const loadProviders = async () => {
    try {
      const res = await fetch(`${API_URL}/oauth/providers`);
      const data = await res.json();
      setProviders(data);
    } catch (error) {
      console.error("Failed to load providers:", error);
    }
  };

  const loadConnections = async () => {
    try {
      setLoading(true);
      const [statusRes, accountsRes] = await Promise.all([
        fetch(`${API_URL}/oauth/status?userId=default-user`),
        fetch(`${API_URL}/oauth/accounts?userId=default-user`),
      ]);
      const status = await statusRes.json();
      const accounts = await accountsRes.json();
      setConnectionStatus(status);
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error("Failed to load connections:", error);
      showToast("Failed to load connections", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSetupInstructions = async (provider) => {
    try {
      const res = await fetch(`${API_URL}/oauth/setup/${provider}`);
      const instructions = await res.json();
      setSetupInstructions(prev => ({ ...prev, [provider]: instructions }));
    } catch (error) {
      console.error("Failed to load setup instructions:", error);
    }
  };

  const handleConnect = async (platform) => {
    try {
      showToast(`Redirecting to ${platform} authorization...`, "info");
      window.location.href = `${API_URL}/oauth/connect/${platform}?userId=default-user`;
    } catch (error) {
      showToast(`Failed to initiate ${platform} connection`, "error");
    }
  };

  const handleDisconnect = async (platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      setSaving(true);
      await fetch(`${API_URL}/oauth/disconnect/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "default-user" }),
      });
      showToast(`Disconnected ${platform}`, "success");
      await loadConnections();
    } catch (error) {
      showToast(`Failed to disconnect ${platform}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadData = async (platform) => {
    try {
      setSaving(true);
      showToast(`Fetching ${platform} data...`, "info");
      const res = await fetch(`${API_URL}/oauth/data/${platform}?userId=default-user`);
      const data = await res.json();
      setPlatformData(prev => ({ ...prev, [platform]: data }));
      setExpandedAccount(platform);
      showToast(`Loaded ${platform} data`, "success");
    } catch (error) {
      showToast(`Failed to load ${platform} data`, "error");
    } finally {
      setSaving(false);
    }
  };

  const getConnectedAccountInfo = (platform) => {
    return connectedAccounts.find(acc => acc.platform === platform);
  };

  const getConnectionBadge = (platform) => {
    if (loading) {
      return <span className="badge badge-gray">Loading...</span>;
    }
    if (connectionStatus[platform]) {
      return <span className="badge badge-success">✓ Connected</span>;
    }
    return <span className="badge badge-warning">Not Connected</span>;
  };

  const formatDataPreview = (data) => {
    if (!data) return null;
    
    return (
      <div style={{
        marginTop: "16px",
        padding: "16px",
        background: "rgba(15, 20, 25, 0.6)",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        borderRadius: "8px",
        fontSize: "12px",
        maxHeight: "300px",
        overflowY: "auto",
      }}>
        <pre style={{ 
          margin: 0, 
          whiteSpace: "pre-wrap", 
          wordBreak: "break-word",
          color: "#d1d5db",
          fontFamily: "'Fira Code', 'Monaco', monospace",
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  const oauthIntegrations = providers.length > 0 ? providers : [
    {
      id: "gmail",
      name: "Gmail",
      icon: "📧",
      description: "Access your email inbox, send emails, and manage conversations",
      features: ["Read emails", "Send emails", "Email analysis", "Auto lead creation"],
      hasSharedApp: false,
      requiresManualSetup: true,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "💼",
      description: "Connect your professional network and access profile data",
      features: ["Profile data", "Connections", "Posts", "Company info"],
      hasSharedApp: false,
      requiresManualSetup: true,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📸",
      description: "Access your Instagram profile, posts, and insights",
      features: ["Profile data", "Posts", "Insights", "Media"],
      hasSharedApp: false,
      requiresManualSetup: true,
    },
    {
      id: "github",
      name: "GitHub",
      icon: "💻",
      description: "Access your repositories, activity, and developer profile",
      features: ["Repositories", "Activity", "Profile", "Organizations"],
      hasSharedApp: false,
      requiresManualSetup: true,
    },
  ];

  const apiIntegrations = [
    {
      name: "Apollo.io",
      description: "B2B database with 265M+ contacts and 60M+ companies",
      icon: "🎯",
      features: ["Contact search", "Company data", "Email verification"],
      status: "configured",
    },
    {
      name: "Hunter.io",
      description: "Find and verify professional email addresses",
      icon: "🔍",
      features: ["Email finder", "Domain search", "Bulk tasks"],
      status: "not_configured",
    },
    {
      name: "Clearbit",
      description: "Real-time business intelligence",
      icon: "💎",
      features: ["Enrichment", "Prospector", "Lead scoring"],
      status: "not_configured",
    },
  ];

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme === "dark" 
        ? "linear-gradient(135deg, #0c1220 0%, #1a1f35 100%)" 
        : "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)"
    }}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: theme === "dark" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(99, 102, 241, 0.2)",
          background: theme === "dark" 
            ? "linear-gradient(135deg, rgba(26, 31, 53, 0.9) 0%, rgba(42, 48, 66, 0.9) 100%)" 
            : "white",
          color: theme === "dark" ? "#f9fafb" : "#1a1f35",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: theme === "dark" 
            ? "0 4px 14px 0 rgba(99, 102, 241, 0.3)" 
            : "0 4px 14px 0 rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) rotate(20deg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Hero Section */}
      <div style={{
        background: theme === "dark"
          ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
          : "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
        borderBottom: theme === "dark" 
          ? "1px solid rgba(99, 102, 241, 0.2)" 
          : "1px solid rgba(99, 102, 241, 0.1)",
        padding: "48px 32px",
        marginBottom: "32px",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "36px",
            fontWeight: 800,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}>
            ⚡ Integrations
          </h1>
          <p style={{
            fontSize: "16px",
            color: theme === "dark" ? "#d1d5db" : "#6b7280",
            maxWidth: "600px",
          }}>
            Connect your accounts with one click. No manual setup, no developer portals, no configuration files.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px 64px" }}>
        {/* OAuth Platform Connections */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <h2 style={{
              fontSize: "20px",
              fontWeight: 700,
              color: theme === "dark" ? "#f9fafb" : "#111827",
            }}>
              🔗 Connected Accounts
            </h2>
            <span style={{
              padding: "4px 12px",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              color: theme === "dark" ? "#a5b4fc" : "#6366f1",
            }}>
              One-Click Connect
            </span>
          </div>
          <p style={{
            fontSize: "14px",
            color: theme === "dark" ? "#9ca3af" : "#6b7280",
            marginBottom: "24px",
          }}>
            Authenticate once and let AI access your data securely
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "20px" }}>
            {oauthIntegrations.map((integration) => {
              const isConnected = connectionStatus[integration.id];
              const accountInfo = getConnectedAccountInfo(integration.id);
              const dataPreview = platformData[integration.id];
              const isExpanded = expandedAccount === integration.id;

              return (
                <div
                  key={integration.id}
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(135deg, rgba(26, 31, 53, 0.9) 0%, rgba(42, 48, 66, 0.9) 100%)"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
                    border: `1px solid ${isConnected 
                      ? (theme === "dark" ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.5)') 
                      : (theme === "dark" ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)')}`,
                    borderRadius: "16px",
                    padding: "24px",
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(10px)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: theme === "dark" 
                      ? "0 4px 6px rgba(0, 0, 0, 0.1)"
                      : "0 4px 6px rgba(0, 0, 0, 0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = theme === "dark"
                      ? "0 12px 40px 0 rgba(99, 102, 241, 0.3)"
                      : "0 12px 40px 0 rgba(99, 102, 241, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = theme === "dark"
                      ? "0 4px 6px rgba(0, 0, 0, 0.1)"
                      : "0 4px 6px rgba(0, 0, 0, 0.05)";
                  }}
                >
                  {/* Glow effect */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: isConnected 
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
                    opacity: 0.8,
                  }} />

                  <div style={{ display: "flex", alignItems: "start", gap: "16px" }}>
                    {/* Icon */}
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: isConnected
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.2))"
                        : "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                      border: isConnected
                        ? "1px solid rgba(16, 185, 129, 0.3)"
                        : "1px solid rgba(99, 102, 241, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      flexShrink: 0,
                    }}>
                      {integration.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <h3 style={{ 
                              fontSize: "18px", 
                              fontWeight: 700, 
                              color: theme === "dark" ? "#f9fafb" : "#111827", 
                              margin: 0 
                            }}>
                              {integration.name}
                            </h3>
                            {integration.hasSharedApp && (
                              <span style={{
                                fontSize: "10px",
                                padding: "3px 8px",
                                background: "linear-gradient(135deg, #10b981, #34d399)",
                                color: "white",
                                borderRadius: "4px",
                                fontWeight: 600,
                              }}>
                                ⚡ INSTANT
                              </span>
                            )}
                          </div>
                          <p style={{ 
                            fontSize: "13px", 
                            color: theme === "dark" ? "#9ca3af" : "#6b7280", 
                            margin: 0 
                          }}>
                            {integration.description}
                          </p>
                        </div>
                        {getConnectionBadge(integration.id)}
                      </div>

                      {/* One-Click Notice */}
                      {integration.hasSharedApp && !isConnected && (
                        <div style={{
                          padding: "10px 14px",
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#6ee7b7",
                          marginTop: "12px",
                          marginBottom: "12px",
                        }}>
                          ⚡ <strong>No setup required!</strong> Just click "Connect Now" below.
                        </div>
                      )}

                      {/* Features */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px", marginBottom: "16px" }}>
                        {integration.features.map((feature) => (
                          <span
                            key={feature}
                            style={{
                              fontSize: "11px",
                              padding: "4px 10px",
                              background: theme === "dark" 
                                ? "rgba(99, 102, 241, 0.15)" 
                                : "rgba(99, 102, 241, 0.1)",
                              border: `1px solid ${theme === "dark" ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                              borderRadius: "6px",
                              color: theme === "dark" ? "#c7d2fe" : "#6366f1",
                            }}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Connected Account Info */}
                      {isConnected && accountInfo && (
                        <div style={{
                          padding: "12px",
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "8px",
                          marginBottom: "16px",
                          fontSize: "12px",
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: "4px", color: "#6ee7b7" }}>✓ Connected Account:</div>
                          <div style={{ color: "#d1d5db" }}>
                            {accountInfo.profile?.email || accountInfo.profile?.username || accountInfo.profile?.name || "Unknown"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                            Since: {new Date(accountInfo.connectedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {!isConnected ? (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConnect(integration.id)}
                            disabled={saving}
                            style={{
                              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                              border: "none",
                              boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.4)",
                            }}
                          >
                            {integration.hasSharedApp ? "🚀 Connect Now" : "🔗 Connect"}
                          </button>
                        ) : (
                          <>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleLoadData(integration.id)}
                              disabled={saving}
                            >
                              📥 Load Data
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={saving}
                              style={{
                                color: "#fca5a5",
                                borderColor: "rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              🔌 Disconnect
                            </button>
                          </>
                        )}
                      </div>

                      {/* Data Preview */}
                      {isExpanded && dataPreview && formatDataPreview(dataPreview)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Integrations */}
        <div>
          <h2 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: theme === "dark" ? "#f9fafb" : "#111827",
            marginBottom: "16px",
          }}>
            🎯 Lead Source APIs
          </h2>
          <p style={{
            fontSize: "14px",
            color: theme === "dark" ? "#9ca3af" : "#6b7280",
            marginBottom: "24px",
          }}>
            Third-party services for lead discovery and enrichment
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {apiIntegrations.map((integration) => (
              <div
                key={integration.name}
                style={{
                  background: theme === "dark"
                    ? "linear-gradient(135deg, rgba(26, 31, 53, 0.6) 0%, rgba(42, 48, 66, 0.6) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(249, 250, 251, 0.8) 100%)",
                  border: theme === "dark" 
                    ? "1px solid rgba(99, 102, 241, 0.2)" 
                    : "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: "16px",
                  padding: "20px",
                  transition: "all 0.3s ease",
                  boxShadow: theme === "dark"
                    ? "0 2px 4px rgba(0, 0, 0, 0.1)"
                    : "0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme === "dark" 
                    ? "rgba(99, 102, 241, 0.5)" 
                    : "rgba(99, 102, 241, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{integration.icon}</div>
                <h3 style={{ 
                  fontSize: "16px", 
                  fontWeight: 700, 
                  color: theme === "dark" ? "#f9fafb" : "#111827", 
                  marginBottom: "6px" 
                }}>
                  {integration.name}
                </h3>
                <p style={{ 
                  fontSize: "13px", 
                  color: theme === "dark" ? "#9ca3af" : "#6b7280", 
                  marginBottom: "12px" 
                }}>
                  {integration.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {integration.features.map((feature) => (
                    <span
                      key={feature}
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        background: theme === "dark" 
                          ? "rgba(99, 102, 241, 0.15)" 
                          : "rgba(99, 102, 241, 0.1)",
                        borderRadius: "4px",
                        color: theme === "dark" ? "#c7d2fe" : "#6366f1",
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <span className={`badge badge-${integration.status === 'configured' ? 'success' : 'gray'}`}>
                  {integration.status === 'configured' ? '✓ Configured' : 'Not Configured'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
