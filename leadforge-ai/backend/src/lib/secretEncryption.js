import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getEncryptionKey() {
  const configured = process.env.AI_KEY_ENCRYPTION_KEY;
  if (!configured) {
    const error = new Error("AI key encryption is not configured on the server");
    error.status = 503;
    throw error;
  }

  const key = /^[\da-f]{64}$/i.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64");
  if (key.length !== 32) {
    const error = new Error("AI_KEY_ENCRYPTION_KEY must encode exactly 32 bytes");
    error.status = 503;
    throw error;
  }
  return key;
}

export function encryptSecret(value, workspaceId) {
  if (!workspaceId) throw new Error("A workspace is required to encrypt this secret");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), nonce);
  cipher.setAAD(Buffer.from(workspaceId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret({ ciphertext, nonce, authTag }, workspaceId) {
  if (!workspaceId) throw new Error("A workspace is required to decrypt this secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(nonce, "base64")
  );
  decipher.setAAD(Buffer.from(workspaceId, "utf8"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
