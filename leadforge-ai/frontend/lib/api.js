/**
 * LeadForge AI — Frontend API client
 *
 * All HTTP calls to the backend go through this module.
 * Pages should never use raw `fetch` directly.
 *
 * Base URL resolution:
 *   • Production (Vercel): NEXT_PUBLIC_API_URL is unset → uses relative "/api"
 *     paths, which Vercel routes to the backend serverless function.
 *   • Local dev: set NEXT_PUBLIC_API_URL=http://localhost:4000 in
 *     frontend/.env.local; Next.js rewrites /api/* to that origin.
 */

// Empty string → relative paths (/api/leads) — correct for Vercel production.
// Full URL      → absolute paths — correct for local dev with a separate server.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

/**
 * Wraps fetch with JSON handling and consistent error throwing.
 * Throws an Error with the server's `error` message on non-2xx responses.
 *
 * Path convention: pass the route segment WITHOUT the /api prefix, e.g.
 *   apiRequest("/leads")  →  fetches  <API_BASE>/api/leads
 *
 * @param {string} route    - Route path starting with "/" (e.g. "/leads")
 * @param {object} [options] - fetch options (method, body, etc.)
 * @returns {Promise<any>}  - Parsed JSON body, or null for 204 No Content
 */
async function request(route, options = {}) {
  const res = await fetch(`${API_BASE}/api${route}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const api = {
  // --- Leads ----------------------------------------------------------------

  /** Get all leads */
  getLeads: () => request("/leads"),

  /** Get a single lead with conversations and projects */
  getLead: (id) => request(`/leads/${id}`),

  /** Create a new lead */
  createLead: (data) =>
    request("/leads", { method: "POST", body: JSON.stringify(data) }),

  // --- Outreach -------------------------------------------------------------

  /** Ask the AI agent to draft an outreach email for a lead */
  draftOutreach: (leadId) =>
    request("/outreach/draft", { method: "POST", body: JSON.stringify({ leadId }) }),

  /** Get all agent-drafted messages awaiting human approval */
  getPendingOutreach: () => request("/outreach/pending"),

  /** Approve a drafted message — sends the email */
  approveOutreach: (messageId) =>
    request(`/outreach/${messageId}/approve`, { method: "POST" }),

  /** Reject / discard a drafted message */
  rejectOutreach: (messageId) =>
    request(`/outreach/${messageId}/reject`, { method: "POST" }),

  /** Edit the content or subject of a drafted message before approval */
  editOutreach: (messageId, { content, subject }) =>
    request(`/outreach/${messageId}/edit`, {
      method: "PUT",
      body: JSON.stringify({ content, subject }),
    }),

  // --- Chat -----------------------------------------------------------------

  /** Get full conversation transcript */
  getConversation: (id) => request(`/chat/${id}`),

  /** Add a lead reply and get the AI agent's response */
  replyToConversation: (id, content) =>
    request(`/chat/${id}/reply`, { method: "POST", body: JSON.stringify({ content }) }),

  // --- Requirements ---------------------------------------------------------

  /** Extract structured requirements from a conversation */
  extractRequirements: (conversationId) =>
    request(`/requirements/${conversationId}/extract`, { method: "POST" }),

  /** Get requirements for a project */
  getProjectRequirements: (projectId) =>
    request(`/requirements/project/${projectId}`),

  // --- Build & deploy -------------------------------------------------------

  /** Trigger site generation and deployment for a project */
  triggerBuild: (projectId) =>
    request(`/build/${projectId}`, { method: "POST" }),

  /** Get current build status */
  getBuildStatus: (projectId) => request(`/build/${projectId}/status`),

  /** Get the generated site preview (file contents) */
  getPreview: (projectId) => request(`/build/${projectId}/preview`),

  /** Deploy an already-built project to Vercel */
  deployProject: (projectId) =>
    request(`/build/${projectId}/deploy`, { method: "POST" }),

  // --- Discovery ------------------------------------------------------------

  /** Run AI / Apollo lead discovery based on criteria */
  discoverLeads: (criteria) =>
    request("/discovery/search", { method: "POST", body: JSON.stringify(criteria) }),

  /** Get discovery source statistics */
  getDiscoveryStats: () => request("/discovery/stats"),

  // --- Activities -----------------------------------------------------------

  /** Get recent agent activity events */
  getActivities: (limit) =>
    request(`/activities${limit ? `?limit=${limit}` : ""}`),

  /** Get aggregate stats for all agents */
  getActivitiesStats: () => request("/activities/stats"),

  /** Get current status of a named agent */
  getAgentStatus: (agentName) =>
    request(`/activities/agent/${agentName}/status`),

  // --- OAuth & integrations -------------------------------------------------

  /** Get OAuth configuration for all platforms */
  getOAuthConfig: () => request("/oauth/config"),

  /** Get all available OAuth providers */
  getOAuthProviders: () => request("/oauth/providers"),

  /** Get connection status for all platforms */
  getConnectionStatus: (userId = "default-user") =>
    request(`/oauth/status?userId=${userId}`),

  /**
   * Redirect the browser to the OAuth authorization page.
   * This is a full-page redirect, not a JSON request.
   */
  connectPlatform: (platform, userId = "default-user") => {
    window.location.href = `${API_BASE}/api/oauth/connect/${platform}?userId=${userId}`;
  },

  /** Remove a platform connection */
  disconnectPlatform: (platform, userId = "default-user") =>
    request(`/oauth/disconnect/${platform}`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  /** Get all connected accounts (safe, no tokens) */
  getConnectedAccounts: (userId = "default-user") =>
    request(`/oauth/accounts?userId=${userId}`),

  /** Fetch data from a specific connected platform */
  getPlatformData: (platform, userId = "default-user") =>
    request(`/oauth/data/${platform}?userId=${userId}`),

  /** Fetch data from all connected platforms */
  getAllPlatformData: (userId = "default-user") =>
    request(`/oauth/data?userId=${userId}`),

  /** Get an AI-generated summary of all platform data */
  getAISummary: (userId = "default-user") =>
    request(`/oauth/ai-summary?userId=${userId}`),

  // --- Inbox ----------------------------------------------------------------

  /** Get emails, optionally filtered by status */
  getEmails: (status, userId = "default-user") => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (userId) params.set("userId", userId);
    return request(`/inbox/emails?${params.toString()}`);
  },

  /** Get AI-generated tasks for a specific email */
  getEmailTasks: (emailId) => request(`/inbox/emails/${emailId}/tasks`),

  /** Mark an email as read */
  markEmailAsRead: (emailId) =>
    request(`/inbox/emails/${emailId}/read`, { method: "POST" }),

  /** Mark a task as completed */
  completeTask: (taskId) =>
    request(`/inbox/tasks/${taskId}/complete`, { method: "POST" }),

  /** Get inbox monitor status */
  getInboxStatus: () => request("/inbox/status"),

  /** Start the IMAP inbox monitor */
  startInboxMonitoring: () => request("/inbox/start", { method: "POST" }),

  // --- Desktop integration --------------------------------------------------

  /** List IDE / browser apps available on the host machine */
  getInstalledApps: () => request("/desktop/apps"),

  /** Open a project in one or more desktop apps */
  openInApp: (projectId, appId) =>
    request("/desktop/open", {
      method: "POST",
      body: JSON.stringify({ projectId, appId }),
    }),

  /** Create a VS Code workspace for a project */
  createWorkspace: (projectId) =>
    request("/desktop/workspace", {
      method: "POST",
      body: JSON.stringify({ projectId }),
    }),

  /** Open a URL in the system's default browser */
  openInBrowser: (url) =>
    request("/desktop/open-url", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  /** Open the project folder in Explorer / Finder */
  openFolder: (projectId) =>
    request("/desktop/open-folder", {
      method: "POST",
      body: JSON.stringify({ projectId }),
    }),
};
