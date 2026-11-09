import test from "node:test";
import assert from "node:assert/strict";
import { scopeWorkspaceQuery } from "./prisma.js";

test("workspace scope is added to unique and list queries", () => {
  const params = {
    model: "Lead",
    action: "findUnique",
    args: { where: { id: "lead-1" } },
  };

  scopeWorkspaceQuery(params, "workspace-1");

  assert.deepEqual(params.args.where, { id: "lead-1", workspaceId: "workspace-1" });
});

test("new rows are assigned to the active workspace", () => {
  const params = {
    model: "Message",
    action: "create",
    args: { data: { conversationId: "conversation-1", content: "hello" } },
  };

  scopeWorkspaceQuery(params, "workspace-2");

  assert.equal(params.args.data.workspaceId, "workspace-2");
});

test("createMany and upsert writes cannot override workspace ownership", () => {
  const batch = {
    model: "Lead",
    action: "createMany",
    args: { data: [{ email: "one@example.test", workspaceId: "other" }] },
  };
  scopeWorkspaceQuery(batch, "workspace-3");
  assert.equal(batch.args.data[0].workspaceId, "workspace-3");

  const upsert = {
    model: "Project",
    action: "upsert",
    args: {
      where: { id: "project-1" },
      create: { leadId: "lead-1", name: "site" },
      update: { workspaceId: "other", name: "updated" },
    },
  };
  scopeWorkspaceQuery(upsert, "workspace-3");
  assert.equal(upsert.args.where.workspaceId, "workspace-3");
  assert.equal(upsert.args.create.workspaceId, "workspace-3");
  assert.equal("workspaceId" in upsert.args.update, false);
});

test("queries without a workspace context are not silently rewritten", () => {
  const params = { model: "Lead", action: "findMany", args: { where: { email: "x" } } };
  scopeWorkspaceQuery(params, null);
  assert.deepEqual(params.args.where, { email: "x" });
});
