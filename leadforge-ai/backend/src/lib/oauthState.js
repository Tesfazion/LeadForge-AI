import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function getStateSecret() {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error("OAuth state signing is not configured");
    error.status = 503;
    throw error;
  }
  return secret;
}

function signature(payload) {
  return createHmac("sha256", getStateSecret()).update(payload).digest();
}

export function createOAuthState(workspaceId, platform) {
  const payload = Buffer.from(JSON.stringify({
    workspaceId,
    platform,
    nonce: randomBytes(16).toString("hex"),
    expiresAt: Date.now() + 10 * 60 * 1000,
  })).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function verifyOAuthState(state, platform) {
  if (typeof state !== "string") throw new Error("Invalid OAuth state");
  const [payload, encodedSignature, ...extra] = state.split(".");
  if (!payload || !encodedSignature || extra.length) throw new Error("Invalid OAuth state");

  const received = Buffer.from(encodedSignature, "base64url");
  const expected = signature(payload);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid OAuth state");
  }

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (
    data.platform !== platform ||
    typeof data.workspaceId !== "string" ||
    !data.workspaceId ||
    typeof data.expiresAt !== "number" ||
    data.expiresAt < Date.now()
  ) {
    throw new Error("Expired or mismatched OAuth state");
  }
  return data;
}
