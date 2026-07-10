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
};
