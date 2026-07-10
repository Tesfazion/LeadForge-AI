/**
 * Platform Data Fetchers
 * Fetch data from connected platforms for AI to use
 */

import { getConnectedAccount, refreshAccessToken } from "./oauthManager.js";

/**
 * Gmail Data Fetcher
 */
export async function fetchGmailData(userId) {
  const account = getConnectedAccount(userId, "gmail");
  if (!account) throw new Error("Gmail not connected");

  const accessToken = await refreshAccessToken(userId, "gmail") || account.accessToken;

  // Fetch recent emails
  const threadsResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=50",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const threads = await threadsResponse.json();

  // Fetch labels
  const labelsResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const labels = await labelsResponse.json();

  // Fetch profile
  const profileResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const profile = await profileResponse.json();

  return {
    platform: "gmail",
    profile: {
      email: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
    },
    threads: threads.threads || [],
    labels: labels.labels || [],
    fetchedAt: new Date(),
  };
}

/**
 * LinkedIn Data Fetcher
 */
export async function fetchLinkedInData(userId) {
  const account = getConnectedAccount(userId, "linkedin");
  if (!account) throw new Error("LinkedIn not connected");

  const accessToken = await refreshAccessToken(userId, "linkedin") || account.accessToken;

  // Fetch profile
  const profileResponse = await fetch(
    "https://api.linkedin.com/v2/me",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const profile = await profileResponse.json();

  // Fetch email
  const emailResponse = await fetch(
    "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const emailData = await emailResponse.json();

  // Fetch connections (if available)
  const connectionsResponse = await fetch(
    "https://api.linkedin.com/v2/connections?q=viewer&start=0&count=100",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  ).catch(() => ({ json: async () => ({ elements: [] }) }));

  const connections = await connectionsResponse.json();

  return {
    platform: "linkedin",
    profile: {
      id: profile.id,
      firstName: profile.localizedFirstName,
      lastName: profile.localizedLastName,
      headline: profile.headline,
      email: emailData.elements?.[0]?.["handle~"]?.emailAddress,
    },
    connections: connections.elements || [],
    stats: {
      connectionsCount: connections.paging?.total || 0,
    },
    fetchedAt: new Date(),
  };
}

/**
 * Instagram Data Fetcher
 */
export async function fetchInstagramData(userId) {
  const account = getConnectedAccount(userId, "instagram");
  if (!account) throw new Error("Instagram not connected");

  const accessToken = await refreshAccessToken(userId, "instagram") || account.accessToken;

  // Fetch user profile
  const profileResponse = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  );

  const profile = await profileResponse.json();

  // Fetch recent media
  const mediaResponse = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=25&access_token=${accessToken}`
  );

  const media = await mediaResponse.json();

  // Fetch insights (if business account)
  let insights = null;
  if (profile.account_type === "BUSINESS") {
    const insightsResponse = await fetch(
      `https://graph.instagram.com/${profile.id}/insights?metric=impressions,reach,follower_count&period=day&access_token=${accessToken}`
    ).catch(() => ({ json: async () => ({ data: [] }) }));

    insights = await insightsResponse.json();
  }

  return {
    platform: "instagram",
    profile: {
      id: profile.id,
      username: profile.username,
      accountType: profile.account_type,
      mediaCount: profile.media_count,
    },
    media: media.data || [],
    insights: insights?.data || [],
    fetchedAt: new Date(),
  };
}

/**
 * GitHub Data Fetcher
 */
export async function fetchGitHubData(userId) {
  const account = getConnectedAccount(userId, "github");
  if (!account) throw new Error("GitHub not connected");

  const accessToken = await refreshAccessToken(userId, "github") || account.accessToken;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  // Fetch user profile
  const profileResponse = await fetch("https://api.github.com/user", { headers });
  const profile = await profileResponse.json();

  // Fetch repositories
  const reposResponse = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=50",
    { headers }
  );
  const repos = await reposResponse.json();

  // Fetch organizations
  const orgsResponse = await fetch("https://api.github.com/user/orgs", { headers });
  const orgs = await orgsResponse.json();

  // Fetch recent activity
  const eventsResponse = await fetch(
    `https://api.github.com/users/${profile.login}/events/public?per_page=30`,
    { headers }
  );
  const events = await eventsResponse.json();

  // Fetch notifications
  const notificationsResponse = await fetch(
    "https://api.github.com/notifications?per_page=50",
    { headers }
  );
  const notifications = await notificationsResponse.json();

  return {
    platform: "github",
    profile: {
      id: profile.id,
      login: profile.login,
      name: profile.name,
      email: profile.email,
      bio: profile.bio,
      company: profile.company,
      location: profile.location,
      blog: profile.blog,
      publicRepos: profile.public_repos,
      publicGists: profile.public_gists,
      followers: profile.followers,
      following: profile.following,
    },
    repos: repos.map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updatedAt: r.updated_at,
    })),
    organizations: orgs.map(o => ({
      id: o.id,
      login: o.login,
      description: o.description,
    })),
    recentActivity: events.slice(0, 20).map(e => ({
      type: e.type,
      repo: e.repo?.name,
      createdAt: e.created_at,
    })),
    notifications: notifications.length,
    fetchedAt: new Date(),
  };
}

/**
 * Fetch all connected platform data
 */
export async function fetchAllPlatformData(userId) {
  const data = {};

  // Try to fetch from each platform
  try {
    data.gmail = await fetchGmailData(userId);
  } catch (error) {
    data.gmail = { error: error.message };
  }

  try {
    data.linkedin = await fetchLinkedInData(userId);
  } catch (error) {
    data.linkedin = { error: error.message };
  }

  try {
    data.instagram = await fetchInstagramData(userId);
  } catch (error) {
    data.instagram = { error: error.message };
  }

  try {
    data.github = await fetchGitHubData(userId);
  } catch (error) {
    data.github = { error: error.message };
  }

  return data;
}

/**
 * Get AI-friendly summary of all platform data
 */
export async function getAISummary(userId) {
  const data = await fetchAllPlatformData(userId);

  const summary = {
    user: {
      email: data.gmail?.profile?.email || data.github?.profile?.email,
      name: data.linkedin?.profile ? 
        `${data.linkedin.profile.firstName} ${data.linkedin.profile.lastName}` :
        data.github?.profile?.name,
      location: data.github?.profile?.location,
      company: data.github?.profile?.company,
    },
    platforms: {
      gmail: data.gmail?.error ? "Not connected" : {
        totalEmails: data.gmail?.profile?.messagesTotal,
        totalThreads: data.gmail?.profile?.threadsTotal,
        recentThreads: data.gmail?.threads?.length,
      },
      linkedin: data.linkedin?.error ? "Not connected" : {
        headline: data.linkedin?.profile?.headline,
        connections: data.linkedin?.stats?.connectionsCount,
      },
      instagram: data.instagram?.error ? "Not connected" : {
        username: data.instagram?.profile?.username,
        mediaCount: data.instagram?.profile?.mediaCount,
        recentPosts: data.instagram?.media?.length,
      },
      github: data.github?.error ? "Not connected" : {
        username: data.github?.profile?.login,
        repos: data.github?.profile?.publicRepos,
        followers: data.github?.profile?.followers,
        organizations: data.github?.organizations?.length,
      },
    },
    summary: generateTextSummary(data),
  };

  return summary;
}

/**
 * Generate human-readable summary for AI
 */
function generateTextSummary(data) {
  const parts = [];

  if (data.gmail && !data.gmail.error) {
    parts.push(`Gmail: ${data.gmail.profile.messagesTotal} total emails, ${data.gmail.profile.threadsTotal} conversations`);
  }

  if (data.linkedin && !data.linkedin.error) {
    const profile = data.linkedin.profile;
    parts.push(`LinkedIn: ${profile.firstName} ${profile.lastName}, ${profile.headline}, ${data.linkedin.stats.connectionsCount} connections`);
  }

  if (data.instagram && !data.instagram.error) {
    parts.push(`Instagram: @${data.instagram.profile.username}, ${data.instagram.profile.mediaCount} posts`);
  }

  if (data.github && !data.github.error) {
    const profile = data.github.profile;
    parts.push(`GitHub: @${profile.login}, ${profile.publicRepos} repos, ${profile.followers} followers`);
  }

  return parts.join(". ");
}
