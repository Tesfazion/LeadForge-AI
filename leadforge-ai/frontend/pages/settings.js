import { useEffect, useState } from "react";
import useSWR from "swr";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { showToast } from "../components/Toast";

const KEY_SOURCES = {
  workspace: "Your workspace key",
  server: "Server-managed key",
  missing: "No AI key configured",
};

const DASHBOARD_RANGES = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [appearance, setAppearance] = useState("light");
  const [density, setDensity] = useState("comfortable");
  const [dashboardRange, setDashboardRange] = useState("30");
  const { data, error, mutate } = useSWR("workspace-settings", api.getWorkspaceSettings);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: result, error: accountError }) => {
      if (!active) return;
      if (accountError) {
        showToast(`Could not load account information: ${accountError.message}`, "error");
        return;
      }
      setAccount(result.user);
      setEmail(result.user?.email || "");
    }).catch((accountError) => {
      if (active) showToast(`Could not load account information: ${accountError.message}`, "error");
    });

    const savedAppearance = localStorage.getItem("theme");
    const savedDensity = localStorage.getItem("leadforge.density");
    const savedRange = localStorage.getItem("leadforge.dashboardRange");
    if (savedAppearance === "dark" || savedAppearance === "light") setAppearance(savedAppearance);
    if (savedDensity === "compact" || savedDensity === "comfortable") setDensity(savedDensity);
    if (DASHBOARD_RANGES.some((option) => option.value === savedRange)) setDashboardRange(savedRange);

    return () => {
      active = false;
    };
  }, []);

  function updateAppearance(value) {
    setAppearance(value);
    localStorage.setItem("theme", value);
    document.documentElement.setAttribute("data-theme", value);
    window.dispatchEvent(new CustomEvent("leadforge:theme-change", { detail: value }));
  }

  function updateDensity(value) {
    setDensity(value);
    localStorage.setItem("leadforge.density", value);
    document.documentElement.setAttribute("data-density", value);
  }

  function updateDashboardRange(value) {
    setDashboardRange(value);
    localStorage.setItem("leadforge.dashboardRange", value);
  }

  async function saveEmail(event) {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail || nextEmail.toLowerCase() === account?.email?.toLowerCase()) return;

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email: nextEmail });
      if (updateError) throw updateError;
      showToast("Check your inbox to confirm the email address change.", "success");
    } catch (updateError) {
      showToast(`Could not update email: ${updateError.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (password.length < 8) {
      showToast("Use a password with at least 8 characters.", "error");
      return;
    }
    if (password !== passwordConfirmation) {
      showToast("The passwords do not match.", "error");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setPasswordConfirmation("");
      showToast("Password updated successfully.", "success");
    } catch (updateError) {
      showToast(`Could not update password: ${updateError.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveKey(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.saveWorkspaceAIKey(apiKey);
      setApiKey("");
      await mutate();
      showToast("Workspace AI key saved securely.", "success");
    } catch (saveError) {
      showToast(`Could not save AI key: ${saveError.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeKey() {
    setBusy(true);
    try {
      await api.removeWorkspaceAIKey();
      await mutate();
      showToast("Workspace AI key removed.", "success");
    } catch (removeError) {
      showToast(`Could not remove AI key: ${removeError.message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  const ai = data?.ai;
  const billing = data?.billing;

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <div>
          <span className="settings-page-kicker">WORKSPACE CONTROL</span>
          <h1 className="settings-page-title">Settings</h1>
          <p>Manage your account, workspace preferences, and AI configuration.</p>
        </div>
        <span className="settings-save-state"><span /> Changes to preferences save automatically</span>
      </header>

      {error && (
        <div className="card settings-load-error" role="alert">
          <h2>Workspace settings could not be loaded</h2>
          <p>{error.message}</p>
        </div>
      )}

      <section className="card settings-card settings-account-card" aria-labelledby="account-title">
        <div className="settings-card-heading">
          <span className="settings-icon account-icon" aria-hidden="true">LF</span>
          <div>
            <span className="settings-eyebrow">ACCOUNT & SECURITY</span>
            <h2 id="account-title">Your account</h2>
          </div>
          <span className={`settings-account-status ${account?.email_confirmed_at ? "is-verified" : ""}`}>
            <span />{account?.email_confirmed_at ? "Email verified" : "Account active"}
          </span>
        </div>
        <div className="settings-account-grid">
          <form onSubmit={saveEmail} className="settings-form settings-profile-form">
            <h3>Sign-in email</h3>
            <p className="settings-copy">Changing your email requires confirmation from your inbox.</p>
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <button className="btn btn-secondary" type="submit" disabled={busy || email.trim().toLowerCase() === account?.email?.toLowerCase()}>
              Update email
            </button>
          </form>

          <form onSubmit={savePassword} className="settings-form settings-password-form">
            <h3>Password</h3>
            <p className="settings-copy">Choose a unique password with at least 8 characters.</p>
            <label htmlFor="account-password">New password</label>
            <input id="account-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <label htmlFor="account-password-confirm">Confirm new password</label>
            <input id="account-password-confirm" type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required />
            <button className="btn btn-secondary" type="submit" disabled={busy || !password || !passwordConfirmation}>
              Update password
            </button>
          </form>
        </div>
      </section>

      <section className="settings-grid" aria-label="Workspace configuration">
        <article className="card settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon preferences-icon" aria-hidden="true">Aa</span>
            <div>
              <span className="settings-eyebrow">YOUR EXPERIENCE</span>
              <h2>Workspace preferences</h2>
            </div>
          </div>
          <p className="settings-copy">Personalize how LeadForge looks and how your dashboard opens. Preferences are saved on this device.</p>

          <div className="settings-preference-list">
            <div className="settings-preference">
              <div><label htmlFor="appearance-setting">Appearance</label><p>Choose the workspace color theme.</p></div>
              <select id="appearance-setting" value={appearance} onChange={(event) => updateAppearance(event.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="settings-preference">
              <div><label htmlFor="density-setting">Data density</label><p>Choose spacing for dense lists and tables.</p></div>
              <select id="density-setting" value={density} onChange={(event) => updateDensity(event.target.value)}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div className="settings-preference">
              <div><label htmlFor="dashboard-range-setting">Dashboard time range</label><p>Default period for pipeline activity.</p></div>
              <select id="dashboard-range-setting" value={dashboardRange} onChange={(event) => updateDashboardRange(event.target.value)}>
                {DASHBOARD_RANGES.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
              </select>
            </div>
          </div>
        </article>

        <article className="card settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon ai-icon" aria-hidden="true">AI</span>
            <div>
              <span className="settings-eyebrow">MODEL PROVIDER</span>
              <h2>Bring your own OpenRouter key</h2>
            </div>
          </div>
          <p className="settings-copy">
            Use your own provider account for workspace AI features. The key is encrypted before it is stored and is never returned by the API.
          </p>

          <div className="settings-status">
            <span className={`badge ${ai?.activeKeySource === "missing" ? "badge-gray" : "badge-success"}`}>
              {ai ? KEY_SOURCES[ai.activeKeySource] : "Checking configuration"}
            </span>
            {ai?.workspaceKeyConfigured && <span className="settings-muted">A workspace key is saved.</span>}
          </div>

          <form onSubmit={saveKey} className="settings-form">
            <label htmlFor="openrouter-key">OpenRouter API key</label>
            <input
              id="openrouter-key"
              type="password"
              autoComplete="new-password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Paste a key to add or replace it"
              maxLength={2048}
            />
            <p className="settings-muted">
              Keys are encrypted with AES-256-GCM. Configure the server’s AI_KEY_ENCRYPTION_KEY before saving.
            </p>
            <div className="settings-actions">
              <button className="btn btn-primary" type="submit" disabled={busy || apiKey.trim().length < 20}>
                {busy ? "Saving…" : ai?.workspaceKeyConfigured ? "Replace key" : "Save key"}
              </button>
              {ai?.workspaceKeyConfigured && (
                <button className="btn btn-secondary" type="button" onClick={removeKey} disabled={busy}>
                  Remove key
                </button>
              )}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                Manage OpenRouter keys
              </a>
            </div>
          </form>
        </article>

        <article className="card settings-card settings-billing-card">
          <div className="settings-card-heading">
            <span className="settings-icon billing-icon" aria-hidden="true">$</span>
            <div>
              <span className="settings-eyebrow">BILLING</span>
              <h2>Payments are not active</h2>
            </div>
            <span className="settings-account-status"><span />Inactive</span>
          </div>
          <p className="settings-copy">
            Stripe billing is scaffolded, but checkout, subscriptions, and payment-method management are intentionally disabled.
          </p>
          <div className="settings-note">
            No customer will be charged. Billing can be enabled after pricing, checkout, and webhook handling are implemented.
          </div>
          <p className="settings-muted">{billing?.configured ? "Stripe configuration detected; checkout remains disabled." : "No billing setup is required to use LeadForge."}</p>
        </article>
      </section>
    </div>
  );
}
