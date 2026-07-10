const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  getLeads: () => request("/leads"),
  getLead: (id) => request(`/leads/${id}`),
  createLead: (data) => request("/leads", { method: "POST", body: JSON.stringify(data) }),

  draftOutreach: (leadId) => request("/outreach/draft", { method: "POST", body: JSON.stringify({ leadId }) }),
  getPendingOutreach: () => request("/outreach/pending"),
  approveOutreach: (messageId) => request(`/outreach/${messageId}/approve`, { method: "POST" }),
  rejectOutreach: (messageId) => request(`/outreach/${messageId}/reject`, { method: "POST" }),
  editOutreach: (messageId, { content, subject }) => 
    request(`/outreach/${messageId}/edit`, { method: "PUT", body: JSON.stringify({ content, subject }) }),

  getConversation: (id) => request(`/chat/${id}`),
  replyToConversation: (id, content) =>
    request(`/chat/${id}/reply`, { method: "POST", body: JSON.stringify({ content }) }),

  extractRequirements: (conversationId) =>
    request(`/requirements/${conversationId}/extract`, { method: "POST" }),

  triggerBuild: (projectId) => request(`/build/${projectId}`, { method: "POST" }),
  getBuildStatus: (projectId) => request(`/build/${projectId}/status`),

  discoverLeads: (criteria) => request("/discovery/search", { method: "POST", body: JSON.stringify(criteria) }),
  getDiscoveryStats: () => request("/discovery/stats"),

  getActivities: (limit) => request(`/activities${limit ? `?limit=${limit}` : ""}`),
  getActivitiesStats: () => request("/activities/stats"),
  getAgentStatus: (agentName) => request(`/activities/agent/${agentName}/status`),

  // OAuth & Platform Connections
  getOAuthConfig: () => request("/oauth/config"),
  getConnectionStatus: (userId = "default-user") => request(`/oauth/status?userId=${userId}`),
  connectPlatform: (platform, userId = "default-user") => {
    // This opens a new window for OAuth flow
    window.location.href = `${API_URL}/oauth/connect/${platform}?userId=${userId}`;
  },
  disconnectPlatform: (platform, userId = "default-user") => 
    request(`/oauth/disconnect/${platform}`, { method: "POST", body: JSON.stringify({ userId }) }),
  getConnectedAccounts: (userId = "default-user") => request(`/oauth/accounts?userId=${userId}`),
  getPlatformData: (platform, userId = "default-user") => request(`/oauth/data/${platform}?userId=${userId}`),
  getAllPlatformData: (userId = "default-user") => request(`/oauth/data?userId=${userId}`),
  getAISummary: (userId = "default-user") => request(`/oauth/ai-summary?userId=${userId}`),

  // Email Inbox
  getEmails: (status, userId = "default-user") => 
    request(`/inbox/emails${status ? `?status=${status}` : ""}${userId ? `&userId=${userId}` : ""}`),
  getEmailTasks: (emailId) => request(`/inbox/emails/${emailId}/tasks`),
  markEmailAsRead: (emailId) => request(`/inbox/emails/${emailId}/read`, { method: "POST" }),
  completeTask: (taskId) => request(`/inbox/tasks/${taskId}/complete`, { method: "POST" }),
  startInboxMonitoring: () => request("/inbox/start", { method: "POST" }),
  stopInboxMonitoring: () => request("/inbox/stop", { method: "POST" }),

  // Build & Preview
  buildProject: (projectId) => request(`/build/${projectId}`, { method: "POST" }),
  deployProject: (projectId) => request(`/build/${projectId}/deploy`, { method: "POST" }),
  getPreview: (projectId) => request(`/build/${projectId}/preview`),

  // Desktop Integration
  getInstalledApps: () => request("/desktop/apps"),
  openInApp: (projectId, appId) => request("/desktop/open", { method: "POST", body: JSON.stringify({ projectId, appId }) }),
  openInMultipleApps: (projectId, appIds) => request("/desktop/open", { method: "POST", body: JSON.stringify({ projectId, appIds }) }),
  createWorkspace: (projectId) => request("/desktop/workspace", { method: "POST", body: JSON.stringify({ projectId }) }),
  openInBrowser: (url) => request("/desktop/open-url", { method: "POST", body: JSON.stringify({ url }) }),
  openFolder: (projectId) => request("/desktop/open-folder", { method: "POST", body: JSON.stringify({ projectId }) }),
};
