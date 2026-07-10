import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const activitiesRouter = Router();

// In-memory activity store for real-time updates (could be Redis in production)
const recentActivities = [];
const MAX_ACTIVITIES = 100;

/**
 * Record an agent activity
 * Called internally by agents when they perform actions
 */
export function recordActivity({ agent, action, leadId, conversationId, projectId, status, metadata = {} }) {
  const activity = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    agent, // "outreach" | "chat" | "requirements" | "developer"
    action, // e.g. "drafting_email", "extracting_requirements", "building_site"
    leadId,
    conversationId,
    projectId,
    status, // "started" | "completed" | "error"
    metadata,
    timestamp: new Date().toISOString(),
  };

  recentActivities.unshift(activity);
  
  // Keep only recent activities
  if (recentActivities.length > MAX_ACTIVITIES) {
    recentActivities.pop();
  }

  return activity;
}

/**
 * GET /activities - Get recent agent activities
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
 * GET /activities/stats - Get agent statistics
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
 * GET /activities/agent/:agentName/status - Get current status of an agent
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
