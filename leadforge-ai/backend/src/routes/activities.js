/**
 * Activities route + recordActivity helper
 *
 * Provides a real-time event feed for the Agents dashboard page.
 *
 * ⚠️  PERSISTENCE WARNING
 * `recentActivities` is an in-memory circular buffer.  All events are lost
 * when the server restarts.  This is intentional for the current demo — it
 * avoids a DB schema change just for ephemeral UI updates.
 * For production, replace with a Redis list or a dedicated `Activity` Prisma
 * model and call `recordActivity` asynchronously (fire-and-forget).
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const activitiesRouter = Router();

// ---------------------------------------------------------------------------
// In-memory store — see persistence warning in the module header above
// ---------------------------------------------------------------------------

/** Circular buffer: newest events at index 0, oldest at the tail. */
const recentActivities = [];

/** Maximum number of events kept in memory at any time. */
const MAX_ACTIVITIES = 100;

/**
 * Record an agent activity event.
 *
 * Called internally by route handlers when an agent starts, completes, or
 * fails an action.  Fire-and-forget — no need to await the return value.
 *
 * @param {object} params
 * @param {string} params.agent          - Agent name: "outreach"|"chat"|"requirements"|"developer"|"oauth"
 * @param {string} params.action         - Human-readable action label (e.g. "drafting_email")
 * @param {string} params.status         - "started"|"completed"|"error"
 * @param {string} [params.leadId]
 * @param {string} [params.conversationId]
 * @param {string} [params.projectId]
 * @param {object} [params.metadata={}]  - Any extra key/value pairs useful for debugging
 * @returns {object} The activity object that was stored
 */
export function recordActivity({ agent, action, leadId, conversationId, projectId, status, metadata = {} }) {
  const activity = {
    id:             `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    agent,
    action,
    leadId,
    conversationId,
    projectId,
    status,
    metadata,
    timestamp:      new Date().toISOString(),
  };

  recentActivities.unshift(activity);

  // Drop oldest event once the buffer is full
  if (recentActivities.length > MAX_ACTIVITIES) {
    recentActivities.pop();
  }

  return activity;
}

/**
 * Factory that returns a pre-bound `recordActivity` for a specific agent name.
 * Use this inside a route module to avoid repeating `agent: "developer"` on
 * every call.
 *
 * Example:
 *   const activity = makeActivityRecorder("developer");
 *   activity({ action: "building_site", status: "started", projectId });
 *
 * @param {string} agent - Agent name to bind
 * @returns {function} Bound recordActivity with `agent` pre-filled
 */
export function makeActivityRecorder(agent) {
  return (params) => recordActivity({ agent, ...params });
}

/**
 * GET /activities
 * Returns recent agent activity events, newest first.
 * Query param: `limit` (default 50, max MAX_ACTIVITIES)
 */
activitiesRouter.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json(recentActivities.slice(0, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /activities/stats
 * Returns aggregate counts for each agent, sourced from the database so the
 * numbers survive server restarts (unlike recentActivities above).
 */
activitiesRouter.get("/stats", async (req, res, next) => {
  try {
    // Get counts for different statuses and agents
    const stats = {
      outreach: {
        pending: await prisma.message.count({
          where: { role: "AGENT", approved: false },
        }),
        sent: await prisma.message.count({
          where: { role: "AGENT", approved: true },
        }),
      },
      chat: {
        active: await prisma.conversation.count({
          where: {
            messages: {
              some: { role: "LEAD" },
            },
          },
        }),
      },
      requirements: {
        extracted: await prisma.project.count({
          where: { requirements: { not: null } },
        }),
      },
      developer: {
        deployed: await prisma.project.count({
          where: { status: "DEPLOYED" },
        }),
        building: await prisma.project.count({
          where: { status: "BUILDING" },
        }),
      },
    };

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /activities/agent/:agentName/status
 * Returns "working" | "error" | "idle" for the named agent, based on its
 * most recent activity event.  An event is considered "working" if its
 * status is "started" and it was recorded less than 60 s ago.
 */
activitiesRouter.get("/agent/:agentName/status", async (req, res, next) => {
  try {
    const { agentName } = req.params;
    
    // Find most recent activity for this agent
    const recentActivity = recentActivities.find(a => a.agent === agentName);
    
    if (!recentActivity) {
      return res.json({ status: "idle", lastActivity: null });
    }

    // If the last activity was recent and "started", agent is working
    const timeSinceActivity = Date.now() - new Date(recentActivity.timestamp).getTime();
    const isWorking = recentActivity.status === "started" && timeSinceActivity < 60000; // 1 minute

    res.json({
      status: isWorking ? "working" : recentActivity.status === "error" ? "error" : "idle",
      lastActivity: recentActivity,
    });
  } catch (err) {
    next(err);
  }
});
