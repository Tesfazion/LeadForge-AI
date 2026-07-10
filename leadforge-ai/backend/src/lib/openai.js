import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("[lib/openai] OPENAI_API_KEY is not set - AI agent calls will fail until configured.");
}

// OpenRouter configuration
// OpenRouter is a unified API that routes to multiple LLM providers
// API Key format: sk-or-v1-...
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:1101",
    "X-Title": "LeadForge AI",
  },
});
