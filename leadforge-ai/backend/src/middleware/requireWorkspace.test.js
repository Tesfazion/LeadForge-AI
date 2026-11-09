import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://supabase.example";
process.env.SUPABASE_ANON_KEY = "test-public-key";

const { requireWorkspace } = await import("./requireWorkspace.js");
const { prisma } = await import("../lib/prisma.js");
const { currentWorkspaceId } = await import("../lib/workspaceContext.js");

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("validates the Supabase bearer token and provisions its workspace", async () => {
  const originalFetch = globalThis.fetch;
  const originalUpsert = prisma.workspace.upsert;
  let upsertArgs;

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://supabase.example/auth/v1/user");
    assert.equal(options.headers.apikey, "test-public-key");
    assert.equal(options.headers.Authorization, "Bearer valid-token");
    return new Response(JSON.stringify({ id: "supabase-user-1" }), { status: 200 });
  };
  prisma.workspace.upsert = async (args) => {
    upsertArgs = args;
    return { id: "workspace-1" };
  };

  try {
    const req = {
      path: "/leads",
      get: (name) => name === "authorization" ? "Bearer valid-token" : undefined,
    };
    const res = responseRecorder();
    let nextCalled = false;

    await requireWorkspace(req, res, () => {
      nextCalled = true;
      assert.equal(currentWorkspaceId(), "workspace-1");
    });

    assert.equal(nextCalled, true);
    assert.equal(req.userId, "supabase-user-1");
    assert.equal(req.workspaceId, "workspace-1");
    assert.equal(upsertArgs.where.authUserId, "supabase-user-1");
    assert.equal(res.statusCode, null);
  } finally {
    globalThis.fetch = originalFetch;
    prisma.workspace.upsert = originalUpsert;
  }
});

test("rejects an invalid Supabase bearer token without provisioning a workspace", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 401 });

  try {
    const req = { path: "/leads", get: () => "Bearer expired-token" };
    const res = responseRecorder();
    let nextCalled = false;

    await requireWorkspace(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, "Invalid or expired access token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
