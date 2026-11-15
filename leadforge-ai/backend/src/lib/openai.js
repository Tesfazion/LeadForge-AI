import OpenAI from "openai";
import { currentWorkspaceId } from "./workspaceContext.js";
import { prisma } from "./prisma.js";
import { decryptSecret } from "./secretEncryption.js";

const placeholderKeyPattern = /placeholder|your[_ -]?api[_ -]?key|\.\.\./i;

export function isConfiguredOpenRouterKey(apiKey) {
  return typeof apiKey === "string" &&
    apiKey.trim().length >= 20 &&
    !placeholderKeyPattern.test(apiKey);
}

function createClient(apiKey) {
  const normalizedKey = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!isConfiguredOpenRouterKey(normalizedKey)) {
    const error = new Error("No usable OpenRouter API key is configured. Set OPENAI_API_KEY or save a workspace key.");
    error.status = 503;
    throw error;
  }

  return new OpenAI({
    apiKey: normalizedKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:1101",
      "X-Title": "LeadForge AI",
    },
  });
}

export async function getOpenAIClient(workspaceId = currentWorkspaceId()) {
  if (workspaceId) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        aiKeyCiphertext: true,
        aiKeyNonce: true,
        aiKeyAuthTag: true,
      },
    });

    if (workspace?.aiKeyCiphertext) {
      return createClient(decryptSecret({
        ciphertext: workspace.aiKeyCiphertext,
        nonce: workspace.aiKeyNonce,
        authTag: workspace.aiKeyAuthTag,
      }, workspaceId));
    }
  }

  return createClient(process.env.OPENAI_API_KEY);
}

export const openai = {
  chat: {
    completions: {
      create: async (...args) => {
        const client = await getOpenAIClient();
        return client.chat.completions.create(...args);
      },
    },
  },
};
