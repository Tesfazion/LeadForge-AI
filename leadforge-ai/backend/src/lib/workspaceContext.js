import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

export function withWorkspace(workspaceId, callback) {
  return storage.run({ workspaceId }, callback);
}

export function currentWorkspaceId() {
  return storage.getStore()?.workspaceId ?? null;
}
