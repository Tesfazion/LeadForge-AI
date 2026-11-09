ALTER TABLE "Workspace" RENAME COLUMN "clerkUserId" TO "authUserId";
ALTER INDEX "Workspace_clerkUserId_key" RENAME TO "Workspace_authUserId_key";
