/**
 * Inbox route
 *
 * Manages IMAP email monitoring and AI-powered email analysis.
 * When a new email arrives the AI classifies its intent, auto-creates
 * lead records for unknown senders, and generates actionable tasks.
 *
 * ⚠️  PERSISTENCE WARNING
 * `inboxEmails` and `inboxTasks` are in-memory arrays reset on every
 * server restart.  For production, store these in the database.
 *
 * Monitoring remains disabled until mailbox connections can be stored per workspace.
 *
 * Endpoints:
 *   GET  /inbox/emails                      — list monitored emails
 *   GET  /inbox/emails/:emailId/tasks       — tasks for a specific email
 *   POST /inbox/emails/:emailId/read        — mark email as read
 *   GET  /inbox/tasks                       — all AI-generated tasks
 *   POST /inbox/tasks/:taskId/complete      — mark task complete
 *   GET  /inbox/status                      — monitoring status + counts
 *   POST /inbox/start                       — start IMAP monitoring
 */

import { Router } from "express";

export const inboxRouter = Router();

// In-memory stores — see persistence warning in the module header above
let inboxEmails = [];
let inboxTasks  = [];

/**
 * GET /inbox/emails
 * Get all inbox emails
 */
inboxRouter.get("/emails", async (req, res) => {
  res.json(inboxEmails.filter((email) => email.workspaceId === req.workspaceId).slice(0, 50));
});

/**
 * GET /inbox/tasks
 * Get all tasks created from emails
 */
inboxRouter.get("/tasks", async (req, res) => {
  res.json(inboxTasks.filter((task) => task.workspaceId === req.workspaceId));
});

/**
 * POST /inbox/tasks/:id/complete
 * Mark task as completed
 */
inboxRouter.post("/tasks/:id/complete", async (req, res) => {
  const task = inboxTasks.find((item) => item.id === req.params.id && item.workspaceId === req.workspaceId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.completed = true;
  task.completedAt = new Date();
  res.json(task);
});

/**
 * POST /inbox/emails/:id/mark-read
 * Mark email as read
 */
inboxRouter.post("/emails/:id/mark-read", async (req, res) => {
  const email = inboxEmails.find((item) => item.id === req.params.id && item.workspaceId === req.workspaceId);
  if (!email) return res.status(404).json({ error: "Email not found" });
  email.read = true;
  res.json(email);
});

/**
 * POST /inbox/start
 * Start email monitoring
 */
inboxRouter.post("/start", async (req, res) => {
  res.status(503).json({
    error: "Workspace-specific email connections are not available yet",
  });
});

/**
 * GET /inbox/status
 * Get monitoring status
 */
inboxRouter.get("/status", (req, res) => {
  res.json({
    monitoring: false,
    message: "Workspace-specific email connections are not available yet.",
    emailCount: inboxEmails.filter((email) => email.workspaceId === req.workspaceId).length,
    taskCount: inboxTasks.filter((task) => task.workspaceId === req.workspaceId).length,
    unreadCount: inboxEmails.filter((email) => email.workspaceId === req.workspaceId && !email.read).length,
  });
});

// Monitoring is intentionally disabled: process-wide mailboxes would mix
// messages between workspaces until per-workspace connections are implemented.
