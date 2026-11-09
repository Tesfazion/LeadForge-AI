import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret } from "./secretEncryption.js";

test("workspace AI keys encrypt and decrypt with AES-256-GCM", () => {
  const previous = process.env.AI_KEY_ENCRYPTION_KEY;
  process.env.AI_KEY_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  try {
    const key = "test-openrouter-api-key-value";
    const encrypted = encryptSecret(key, "workspace-1");

    assert.notEqual(encrypted.ciphertext, key);
    assert.equal(decryptSecret(encrypted, "workspace-1"), key);
    assert.throws(() => decryptSecret(encrypted, "workspace-2"));
    assert.throws(() => decryptSecret({ ...encrypted, authTag: randomBytes(16).toString("base64") }, "workspace-1"));
  } finally {
    if (previous === undefined) delete process.env.AI_KEY_ENCRYPTION_KEY;
    else process.env.AI_KEY_ENCRYPTION_KEY = previous;
  }
});

test("invalid encryption configuration fails explicitly", () => {
  const previous = process.env.AI_KEY_ENCRYPTION_KEY;
  delete process.env.AI_KEY_ENCRYPTION_KEY;
  try {
    assert.throws(() => encryptSecret("secret", "workspace-1"), { status: 503 });
  } finally {
    if (previous !== undefined) process.env.AI_KEY_ENCRYPTION_KEY = previous;
  }
});
