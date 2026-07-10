/**
 * OAuth Integration Manager
 * Handles authentication and data access for:
 * - Email (Gmail)
 * - LinkedIn
 * - Instagram (Meta/Facebook)
 * - GitHub
 */

import { prisma } from "./prisma.js";

// Store connected accounts in memory (use database in production)
const connectedAccounts = new Map();

/**
 * OAuth Configuration for each platform
 */
export const oauthConfig = {
  gmail: {
    name: "Gmail",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ],
    icon: "mail",
    description: "Read emails, send emails, manage contacts",
  },
  
  linkedin: {
    name: "LinkedIn",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: [
      "r_liteprofile",
      "r_emailaddress",
      "w_member_social",
      "r_organization_social",
      "rw_organization_admin"
    ],
    icon: "linkedin",
    description: "Access profile, post updates, read messages, find connections",
  },
  
  instagram: {
    name: "Instagram",
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scopes: [
      "user_profile",
      "user_media",
      "instagram_basic",
      "instagram_content_publish",
      "pages_read_engagement",
      "pages_manage_posts"
    ],
    icon: "instagram",
    description: "Access posts, followers, insights, publish content",
  },
  
  github: {
    name: "GitHub",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: [
      "user",
      "repo",
      "read:org",
      "read:user",
      "user:email",
      "notifications"
    ],
    icon: "github",
    description: "Access repos, issues, pull requests, profile, organizations",
  },
};

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(platform, userId) {
  const config = oauthConfig[platform];
  if (!config) throw new Error(`Unknown platform: ${platform}`);

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const redirectUri = `${process.env.BACKEND_URL || "http://localhost:1100"}/oauth/callback/${platform}`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state: Buffer.from(JSON.stringify({ userId, platform })).toString("base64"),
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(platform, code) {
  const config = oauthConfig[platform];
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];
  const redirectUri = `${process.env.BACKEND_URL || "http://localhost:1100"}/oauth/callback/${platform}`;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Save connected account
 */
export async function saveConnectedAccount(userId, platform, tokenData, profileData) {
  const account = {
    userId,
    platform,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
    profile: profileData,
    connectedAt: new Date(),
    lastSyncedAt: new Date(),
  };

  connectedAccounts.set(`${userId}-${platform}`, account);
  
  // Also save to database for persistence
  // In production, implement proper database storage
  
  return account;
}

/**
 * Get connected account
 */
export function getConnectedAccount(userId, platform) {
  return connectedAccounts.get(`${userId}-${platform}`);
}

/**
 * Get all connected accounts for user
 */
export function getAllConnectedAccounts(userId) {
  const accounts = [];
  for (const [key, account] of connectedAccounts.entries()) {
    if (key.startsWith(`${userId}-`)) {
      accounts.push(account);
    }
  }
  return accounts;
}

/**
 * Disconnect account
 */
export function disconnectAccount(userId, platform) {
  return connectedAccounts.delete(`${userId}-${platform}`);
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(userId, platform) {
  const account = getConnectedAccount(userId, platform);
  if (!account || !account.refreshToken) return null;

  // Check if token is expired
  if (account.expiresAt && Date.now() < account.expiresAt) {
    return account.accessToken; // Still valid
  }

  const config = oauthConfig[platform];
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: account.refreshToken,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: params.toString(),
    });

    if (!response.ok) throw new Error("Refresh failed");

    const tokenData = await response.json();
    
    // Update stored token
    account.accessToken = tokenData.access_token;
    account.expiresAt = tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null;
    if (tokenData.refresh_token) {
      account.refreshToken = tokenData.refresh_token;
    }

    connectedAccounts.set(`${userId}-${platform}`, account);
    
    return tokenData.access_token;
  } catch (error) {
    console.error(`Failed to refresh token for ${platform}:`, error);
    return null;
  }
}

/**
 * Check if account is connected
 */
export function isConnected(userId, platform) {
  return connectedAccounts.has(`${userId}-${platform}`);
}

/**
 * Get connection status for all platforms
 */
export function getConnectionStatus(userId) {
  return Object.keys(oauthConfig).reduce((status, platform) => {
    const account = getConnectedAccount(userId, platform);
    status[platform] = {
      connected: !!account,
      profile: account?.profile,
      lastSynced: account?.lastSyncedAt,
    };
    return status;
  }, {});
}
