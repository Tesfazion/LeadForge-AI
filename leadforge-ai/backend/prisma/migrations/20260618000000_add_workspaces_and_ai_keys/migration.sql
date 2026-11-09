CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "aiKeyCiphertext" TEXT,
    "aiKeyNonce" TEXT,
    "aiKeyAuthTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_clerkUserId_key" ON "Workspace"("clerkUserId");

ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_email_key";
DROP INDEX IF EXISTS "Lead_email_key";
ALTER TABLE "Lead"
    ADD COLUMN "workspaceId" TEXT,
    ADD CONSTRAINT "Lead_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Lead_workspaceId_email_key" ON "Lead"("workspaceId", "email");
CREATE INDEX "Lead_workspaceId_createdAt_idx" ON "Lead"("workspaceId", "createdAt");

ALTER TABLE "Conversation"
    ADD COLUMN "workspaceId" TEXT,
    ADD CONSTRAINT "Conversation_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Conversation_workspaceId_createdAt_idx" ON "Conversation"("workspaceId", "createdAt");

ALTER TABLE "Message"
    ADD COLUMN "workspaceId" TEXT,
    ADD CONSTRAINT "Message_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Message_workspaceId_createdAt_idx" ON "Message"("workspaceId", "createdAt");

ALTER TABLE "Project"
    ADD COLUMN "workspaceId" TEXT,
    ADD CONSTRAINT "Project_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Project_workspaceId_createdAt_idx" ON "Project"("workspaceId", "createdAt");
