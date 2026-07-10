/**
 * Automatic OAuth Setup
 * Handles OAuth app creation and configuration automatically
 * Users just need to authenticate - no manual app creation needed!
 */

import { openai } from "./openai.js";

/**
 * OAuth Provider Configurations
 * These are pre-configured apps that users can connect to with one click
 */
export const oauthProviders = {
  github: {
    name: "GitHub",
    icon: "💻",
    description: "Access your repositories and developer profile",
    features: ["Read repos", "View activity", "Access profile"],
    
    // Option 1: Use LeadForge's OAuth App (Recommended)
    useSharedApp: true,
    sharedCredentials: {
      clientId: process.env.LEADFORGE_GITHUB_CLIENT_ID || "",
      clientSecret: process.env.LEADFORGE_GITHUB_CLIENT_SECRET || "",
    },
    
    // Option 2: User creates their own app
    manualSetup: {
      url: "https://github.com/settings/developers",
      steps: [
        "Go to GitHub Settings → Developer settings → OAuth Apps",
        "Click 'New OAuth App'",
        "Fill in application details",
        "Add callback URL",
        "Copy Client ID and Secret"
      ],
    },
    
    scopes: ["user", "repo", "read:org"],
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
  },
  
  gmail: {
    name: "Gmail",
    icon: "📧",
    description: "Read and send emails from your Gmail account",
    features: ["Read emails", "Send emails", "Manage inbox"],
    
    useSharedApp: true,
    sharedCredentials: {
      clientId: process.env.LEADFORGE_GMAIL_CLIENT_ID || "",
      clientSecret: process.env.LEADFORGE_GMAIL_CLIENT_SECRET || "",
    },
    
    manualSetup: {
      url: "https://console.cloud.google.com/apis/credentials",
      steps: [
        "Go to Google Cloud Console",
        "Create or select a project",
        "Enable Gmail API",
        "Create OAuth 2.0 Client ID",
        "Add authorized redirect URI",
        "Copy credentials"
      ],
    },
    
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ],
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
  },
  
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    description: "Connect your professional network",
    features: ["View profile", "Access connections", "Read posts"],
    
    useSharedApp: true,
    sharedCredentials: {
      clientId: process.env.LEADFORGE_LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LEADFORGE_LINKEDIN_CLIENT_SECRET || "",
    },
    
    manualSetup: {
      url: "https://www.linkedin.com/developers/apps",
      steps: [
        "Go to LinkedIn Developers",
        "Create a new app",
        "Request access to Sign In with LinkedIn",
        "Add redirect URIs",
        "Copy Client ID and Secret"
      ],
    },
    
    scopes: ["r_liteprofile", "r_emailaddress", "w_member_social"],
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  },
  
  instagram: {
    name: "Instagram",
    icon: "📸",
    description: "Access your Instagram posts and insights",
    features: ["View posts", "Read insights", "Access profile"],
    
    useSharedApp: true,
    sharedCredentials: {
      clientId: process.env.LEADFORGE_INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.LEADFORGE_INSTAGRAM_CLIENT_SECRET || "",
    },
    
    manualSetup: {
      url: "https://developers.facebook.com/apps",
      steps: [
        "Go to Facebook Developers",
        "Create a new app",
        "Add Instagram Basic Display product",
        "Configure OAuth redirect URIs",
        "Copy App ID and Secret"
      ],
    },
    
    scopes: ["user_profile", "user_media"],
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
  },
};

/**
 * Check if provider has shared OAuth app configured
 */
export function hasSharedApp(provider) {
  const config = oauthProviders[provider];
  if (!config || !config.useSharedApp) return false;
  
  const { clientId, clientSecret } = config.sharedCredentials;
  return !!(clientId && clientSecret);
}

/**
 * Get OAuth configuration for a provider
 */
export function getProviderConfig(provider) {
  const config = oauthProviders[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  
  return {
    ...config,
    hasSharedApp: hasSharedApp(provider),
    requiresManualSetup: !hasSharedApp(provider),
  };
}

/**
 * Get all available providers with their connection status
 */
export function getAllProviders() {
  return Object.entries(oauthProviders).map(([id, config]) => ({
    id,
    name: config.name,
    icon: config.icon,
    description: config.description,
    features: config.features,
    hasSharedApp: hasSharedApp(id),
    requiresManualSetup: !hasSharedApp(id),
    manualSetupUrl: config.manualSetup?.url,
  }));
}

/**
 * Generate authorization URL for a provider
 */
export function generateAuthUrl(provider, userId, redirectUri) {
  const config = getProviderConfig(provider);
  
  // Use shared app if available
  const clientId = config.hasSharedApp 
    ? config.sharedCredentials.clientId
    : process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  
  if (!clientId) {
    throw new Error(`No OAuth credentials configured for ${provider}. Please configure in settings.`);
  }
  
  const state = Buffer.from(JSON.stringify({ provider, userId })).toString('base64');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });
  
  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCode(provider, code, redirectUri) {
  const config = getProviderConfig(provider);
  
  const clientId = config.hasSharedApp 
    ? config.sharedCredentials.clientId
    : process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    
  const clientSecret = config.hasSharedApp 
    ? config.sharedCredentials.clientSecret
    : process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  
  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${provider}`);
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return await response.json();
}

/**
 * AI-powered setup assistant
 * Helps users configure OAuth if needed
 */
export async function getSetupInstructions(provider) {
  const config = getProviderConfig(provider);
  
  if (config.hasSharedApp) {
    return {
      type: "shared_app",
      message: `Just click "Connect ${config.name}" - no setup required!`,
      steps: [],
    };
  }
  
  // Generate personalized setup instructions using AI
  const prompt = `Generate clear, step-by-step instructions for setting up OAuth for ${config.name}.
  
Setup URL: ${config.manualSetup.url}
Required: Create OAuth app and get Client ID and Secret
Callback URL: ${process.env.BACKEND_URL}/oauth/callback/${provider}

Format the response as JSON with:
{
  "steps": ["step 1", "step 2", ...],
  "tips": ["tip 1", "tip 2", ...],
  "estimatedTime": "X minutes"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const instructions = JSON.parse(completion.choices[0].message.content);
    
    return {
      type: "manual_setup",
      provider: config.name,
      url: config.manualSetup.url,
      ...instructions,
    };
  } catch (error) {
    // Fallback to manual steps
    return {
      type: "manual_setup",
      provider: config.name,
      url: config.manualSetup.url,
      steps: config.manualSetup.steps,
      estimatedTime: "5 minutes",
    };
  }
}
