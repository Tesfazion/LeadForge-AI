import { PrismaClient } from "@prisma/client";
import { currentWorkspaceId } from "./workspaceContext.js";

// Prevent multiple instances in dev with --watch
const globalForPrisma = globalThis;

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

const workspaceModels = new Set(["Lead", "Conversation", "Message", "Project"]);

export function scopeWorkspaceQuery(params, workspaceId) {
  if (!workspaceId || !workspaceModels.has(params.model)) return params;
  const args = params.args ?? {};
  params.args = args;

  if (params.action === "create") {
    args.data = { ...args.data, workspaceId };
  } else if (params.action === "createMany") {
    args.data = Array.isArray(args.data)
      ? args.data.map((record) => ({ ...record, workspaceId }))
      : { ...args.data, workspaceId };
  } else if (params.action === "upsert") {
    args.where = { ...args.where, workspaceId };
    args.create = { ...args.create, workspaceId };
    if (args.update) delete args.update.workspaceId;
  } else {
    args.where = { ...args.where, workspaceId };
    if (args.data) delete args.data.workspaceId;
  }

  return params;
}

basePrisma.$use((params, next) => next(scopeWorkspaceQuery(params, currentWorkspaceId())));

export const prisma = basePrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}
