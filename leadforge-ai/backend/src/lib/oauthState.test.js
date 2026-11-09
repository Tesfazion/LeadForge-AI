import test from "node:test";
import assert from "node:assert/strict";
import { createOAuthState, verifyOAuthState } from "./oauthState.js";

test("OAuth state is signed and bound to its workspace and provider", () => {
  const previous = process.env.OAUTH_STATE_SECRET;
  process.env.OAUTH_STATE_SECRET = "test-only-oauth-state-secret-with-32-bytes";
  try {
    const state = createOAuthState("workspace-1", "github");
    assert.deepEqual(verifyOAuthState(state, "github").workspaceId, "workspace-1");
    assert.throws(() => verifyOAuthState(state, "gmail"), /mismatched/);
    assert.throws(() => verifyOAuthState(`${state.slice(0, -1)}x`, "github"), /Invalid OAuth state/);
  } finally {
    if (previous === undefined) delete process.env.OAUTH_STATE_SECRET;
    else process.env.OAUTH_STATE_SECRET = previous;
  }
});
