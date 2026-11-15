import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import express from "express";
import { decryptSecret } from "../lib/secretEncryption.js";
import { prisma } from "../lib/prisma.js";
import { workspaceRouter } from "./workspace.js";

test("workspace AI key is encrypted, persists, and is never returned", async () => {
  const previousEncryptionKey = process.env.AI_KEY_ENCRYPTION_KEY;
  const previousServerKey = process.env.OPENAI_API_KEY;
  const originalFindUnique = prisma.workspace.findUnique;
  const originalUpdate = prisma.workspace.update;
  process.env.AI_KEY_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  delete process.env.OPENAI_API_KEY;

  const workspace = {
    id: "workspace-test",
    aiKeyCiphertext: null,
    aiKeyNonce: null,
    aiKeyAuthTag: null,
  };
  prisma.workspace.findUnique = async () => ({ ...workspace });
  prisma.workspace.update = async ({ data }) => {
    Object.assign(workspace, data);
    return { id: workspace.id };
  };

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.workspaceId = workspace.id;
    next();
  });
  app.use("/", workspaceRouter);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const invalidSave = await fetch(`${baseUrl}/ai-key`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "sk-or-v1-placeholder" }),
    });
    assert.equal(invalidSave.status, 400);
    assert.equal(workspace.aiKeyCiphertext, null);

    const key = `sk-or-v1-${"c".repeat(64)}`;
    const save = await fetch(`${baseUrl}/ai-key`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    assert.equal(save.status, 200);
    assert.deepEqual(await save.json(), { configured: true, activeKeySource: "workspace" });
    assert.notEqual(workspace.aiKeyCiphertext, key);
    assert.equal(decryptSecret({
      ciphertext: workspace.aiKeyCiphertext,
      nonce: workspace.aiKeyNonce,
      authTag: workspace.aiKeyAuthTag,
    }, workspace.id), key);

    const settingsResponse = await fetch(`${baseUrl}/settings`);
    const settings = await settingsResponse.json();
    assert.equal(settings.ai.workspaceKeyConfigured, true);
    assert.equal(settings.ai.activeKeySource, "workspace");
    assert.equal(JSON.stringify(settings).includes(key), false);

    process.env.OPENAI_API_KEY = "sk-or-v1-placeholder";
    const removeResponse = await fetch(`${baseUrl}/ai-key`, { method: "DELETE" });
    assert.deepEqual(await removeResponse.json(), {
      configured: false,
      activeKeySource: "missing",
    });
    assert.equal(workspace.aiKeyCiphertext, null);
    assert.equal(workspace.aiKeyNonce, null);
    assert.equal(workspace.aiKeyAuthTag, null);

    const placeholderSettings = await fetch(`${baseUrl}/settings`).then((response) => response.json());
    assert.equal(placeholderSettings.ai.activeKeySource, "missing");
    process.env.OPENAI_API_KEY = `sk-or-v1-${"d".repeat(64)}`;
    const serverSettings = await fetch(`${baseUrl}/settings`).then((response) => response.json());
    assert.equal(serverSettings.ai.activeKeySource, "server");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    prisma.workspace.findUnique = originalFindUnique;
    prisma.workspace.update = originalUpdate;
    if (previousEncryptionKey === undefined) delete process.env.AI_KEY_ENCRYPTION_KEY;
    else process.env.AI_KEY_ENCRYPTION_KEY = previousEncryptionKey;
    if (previousServerKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousServerKey;
  }
});
