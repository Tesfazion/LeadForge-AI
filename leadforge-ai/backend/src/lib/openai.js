import OpenAI from "openai";
import { currentWorkspaceId } from "./workspaceContext.js";
import { prisma } from "./prisma.js";
import { decryptSecret } from "./secretEncryption.js";

function createClient(apiKey) {
  if (!apiKey) {
    const error = new Error("No OpenRouter API key is configured for this workspace");
    error.status = 503;
    throw error;
  }

  return new OpenAI({
    apiKey,
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
