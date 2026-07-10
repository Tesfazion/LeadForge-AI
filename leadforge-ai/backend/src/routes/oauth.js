import { Router } from "express";
import {
  oauthConfig,
  getAuthUrl,
  exchangeCodeForToken,
  saveConnectedAccount,
  getConnectionStatus,
  disconnectAccount,
  getAllConnectedAccounts,
} from "../lib/oauthManager.js";
import {
  getAllProviders,
  getProviderConfig,
  generateAuthUrl,
  exchangeCode,
  hasSharedApp,
  getSetupInstructions,
} from "../lib/autoOAuthSetup.js";
import { fetchAllPlatformData, getAISummary } from "../lib/platformData.js";
import { recordActivity } from "./activities.js";

export const oauthRouter = Router();

// Default user ID (in production, use authenticated user)
const DEFAULT_USER_ID = "default-user";

/**
 * GET /oauth/providers
 * Get all available OAuth providers with connection options
 */
oauthRouter.get("/providers", (req, res) => {
  const providers = getAllProviders();
  res.json(providers);
});

/**
 * GET /oauth/setup/:provider
 * Get setup instructions for a provider
 */
oauthRouter.get("/setup/:provider", async (req, res, next) => {
  try {
    const { provider } = req.params;
    const instructions = await getSetupInstructions(provider);
    res.json(instructions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /oauth/config
 * Get OAuth configuration for all platforms
 */
oauthRouter.get("/config", (req, res) => {
  const config = Object.entries(oauthConfig).map(([platform, details]) => ({
    platform,
    ...details,
    configured: !!(
      process.env[`${platform.toUpperCase()}_CLIENT_ID`] &&
      process.env[`${platform.toUpperCase()}_CLIENT_SECRET`]
    ),
  }));

  res.json(config);
});

/**
 * GET /oauth/status
 * Get connection status for all platforms
 */
oauthRouter.get("/status", (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const status = getConnectionStatus(userId);
  res.json(status);
});

/**
 * GET /oauth/connect/:platform
 * Initiate OAuth flow for a platform (uses shared app if available)
 */
oauthRouter.get("/connect/:platform", (req, res) => {
  const { platform } = req.params;
  const userId = req.query.userId || DEFAULT_USER_ID;

  try {
    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:1100"}/oauth/callback/${platform}`;
    
    // Check if platform has shared OAuth app configured
    if (hasSharedApp(platform)) {
      // Use LeadForge's shared OAuth app - no manual setup required!
      const authUrl = generateAuthUrl(platform, userId, redirectUri);
      
      recordActivity({
        agent: "oauth",
        action: "connect_initiated",
        status: "started",
        metadata: { platform, userId, method: "shared_app" },
      });
      
      return res.redirect(authUrl);
    }
    
    // Fall back to manual OAuth configuration
    if (!process.env[`${platform.toUpperCase()}_CLIENT_ID`]) {
      return res.status(400).json({
        error: `${platform} OAuth not configured`,
        message: `Please configure ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET in .env`,
        setupUrl: `/oauth/setup/${platform}`,
        needsSetup: true,
      });
    }

    const authUrl = getAuthUrl(platform, userId);
    
    recordActivity({
      agent: "oauth",
      action: "connect_initiated",
      status: "started",
      metadata: { platform, userId, method: "manual_config" },
    });

    res.redirect(authUrl);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /oauth/callback/:platform
 * OAuth callback handler (supports both shared and manual OAuth apps)
 */
oauthRouter.get("/callback/:platform", async (req, res) => {
  const { platform } = req.params;
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:1101"}/integrations?error=${error}`);
  }

  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, "base64").toString());

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:1100"}/oauth/callback/${platform}`;
    
    // Exchange code for token (supports both shared and manual apps)
    let tokenData;
    if (hasSharedApp(platform)) {
      tokenData = await exchangeCode(platform, code, redirectUri);
    } else {
      tokenData = await exchangeCodeForToken(platform, code);
    }

    // Fetch user profile from platform
    const profileData = await fetchUserProfile(platform, tokenData.access_token);

    // Save connected account
    await saveConnectedAccount(userId, platform, tokenData, profileData);

    recordActivity({
      agent: "oauth",
      action: "connect_completed",
      status: "completed",
      metadata: { platform, userId, profile: profileData, method: hasSharedApp(platform) ? "shared_app" : "manual_config" },
    });

    // Redirect to integrations page with success
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:1101"}/integrations?connected=${platform}`);
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:1101"}/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /oauth/disconnect/:platform
 * Disconnect a platform
 */
oauthRouter.post("/disconnect/:platform", (req, res) => {
  const { platform } = req.params;
  const userId = req.body.userId || DEFAULT_USER_ID;

  const success = disconnectAccount(userId, platform);

  recordActivity({
    agent: "oauth",
    action: "disconnect",
    status: "completed",
    metadata: { platform, userId },
  });

  res.json({ success, platform });
});

/**
 * GET /oauth/accounts
 * Get all connected accounts
 */
oauthRouter.get("/accounts", (req, res) => {
  const userId = req.query.userId || DEFAULT_USER_ID;
  const accounts = getAllConnectedAccounts(userId);

  // Remove sensitive data
  const safeAccounts = accounts.map(acc => ({
    platform: acc.platform,
    profile: acc.profile,
    connectedAt: acc.connectedAt,
    lastSyncedAt: acc.lastSyncedAt,
  }));

  res.json(safeAccounts);
});

/**
 * GET /oauth/data/:platform
 * Fetch data from a specific platform
 */
oauthRouter.get("/data/:platform", async (req, res, next) => {
  const { platform } = req.params;
  const userId = req.query.userId || DEFAULT_USER_ID;

  try {
    const fetchData = require("../lib/platformData.js")[`fetch${capitalize(platform)}Data`];
    if (!fetchData) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    const data = await fetchData(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /oauth/data
 * Fetch data from all connected platforms
 */
oauthRouter.get("/data", async (req, res, next) => {
  const userId = req.query.userId || DEFAULT_USER_ID;

  try {
    const data = await fetchAllPlatformData(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /oauth/ai-summary
 * Get AI-friendly summary of all platform data
 */
oauthRouter.get("/ai-summary", async (req, res, next) => {
  const userId = req.query.userId || DEFAULT_USER_ID;

  try {
    const summary = await getAISummary(userId);
    
    recordActivity({
      agent: "oauth",
      action: "data_summary",
      status: "completed",
      metadata: { userId, platformsConnected: Object.keys(summary.platforms).length },
    });

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * Helper: Fetch user profile from platform
 */
async function fetchUserProfile(platform, accessToken) {
  const endpoints = {
    gmail: "https://www.googleapis.com/oauth2/v2/userinfo",
    linkedin: "https://api.linkedin.com/v2/me",
    instagram: "https://graph.instagram.com/me?fields=id,username",
    github: "https://api.github.com/user",
  };

  const endpoint = endpoints[platform];
  if (!endpoint) return {};

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${platform} profile:`, error);
    return {};
  }
}

/**
 * Helper: Capitalize string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
