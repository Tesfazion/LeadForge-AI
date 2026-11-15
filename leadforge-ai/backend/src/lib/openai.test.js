import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { getOpenAIClient, isConfiguredOpenRouterKey } from "./openai.js";
import { encryptSecret } from "./secretEncryption.js";
import { prisma } from "./prisma.js";

const serverKey = `sk-or-v1-${"b".repeat(64)}`;
const workspaceKey = `sk-or-v1-${"a".repeat(64)}`;

test("OpenRouter configuration ignores placeholders", () => {
  assert.equal(isConfiguredOpenRouterKey(serverKey), true);
  assert.equal(isConfiguredOpenRouterKey("sk-or-v1-placeholder"), false);
  assert.equal(isConfiguredOpenRouterKey("sk-or-v1-..."), false);
  assert.equal(isConfiguredOpenRouterKey(""), false);
});

test("workspace key takes precedence over the server key and valid fallback is used", async () => {
  const previousEncryptionKey = process.env.AI_KEY_ENCRYPTION_KEY;
  const previousServerKey = process.env.OPENAI_API_KEY;
  const originalFindUnique = prisma.workspace.findUnique;
  process.env.AI_KEY_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  process.env.OPENAI_API_KEY = serverKey;
  const encrypted = encryptSecret(workspaceKey, "workspace-1");

  try {
    prisma.workspace.findUnique = async () => ({
      aiKeyCiphertext: encrypted.ciphertext,
      aiKeyNonce: encrypted.nonce,
      aiKeyAuthTag: encrypted.authTag,
    });
    const workspaceClient = await getOpenAIClient("workspace-1");
    assert.equal(workspaceClient.apiKey, workspaceKey);

    prisma.workspace.findUnique = async () => null;
    const serverClient = await getOpenAIClient(null);
    assert.equal(serverClient.apiKey, serverKey);

    process.env.OPENAI_API_KEY = "sk-or-v1-placeholder";
    await assert.rejects(
      getOpenAIClient(null),
      (error) => error.status === 503 && /usable OpenRouter API key/.test(error.message)
    );
  } finally {
    prisma.workspace.findUnique = originalFindUnique;
    if (previousEncryptionKey === undefined) delete process.env.AI_KEY_ENCRYPTION_KEY;
    else process.env.AI_KEY_ENCRYPTION_KEY = previousEncryptionKey;
    if (previousServerKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousServerKey;
  }
});
