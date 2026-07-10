import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("[lib/openai] OPENAI_API_KEY is not set - AI agent calls will fail until configured.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
