import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { extractRequirements } from "../agents/requirementsAgent.js";
import { recordActivity } from "./activities.js";

export const requirementsRouter = Router();

/**
 * POST /requirements/:conversationId/extract
 * Reads the full conversation transcript, extracts structured requirements
 * JSON, and creates (or updates) a Project record for that lead so the
 * Developer Agent can pick it up next.
 */
requirementsRouter.post("/:conversationId/extract", async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } }, lead: true },
    });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    recordActivity({
      agent: "requirements",
      action: "extracting_requirements",
      leadId: conversation.leadId,
      conversationId: conversation.id,
      status: "started",
      metadata: { leadName: conversation.lead.name },
    });

    const history = conversation.messages.map((m) => ({ role: m.role, content: m.content }));
    const requirements = await extractRequirements(history);

    const project = await prisma.project.create({
      data: {
        leadId: conversation.leadId,
        name: requirements.brand?.name || `${conversation.lead.company || conversation.lead.name}'s site`,
        requirements,
        status: requirements.openQuestions.length > 0 ? "GATHERING_REQUIREMENTS" : "READY_TO_BUILD",
      },
    });

    await prisma.lead.update({ where: { id: conversation.leadId }, data: { status: "QUALIFIED" } });

    recordActivity({
      agent: "requirements",
      action: "extracting_requirements",
      leadId: conversation.leadId,
      conversationId: conversation.id,
      projectId: project.id,
      status: "completed",
      metadata: { projectName: project.name, status: project.status },
    });

    res.status(201).json(project);
  } catch (err) {
    recordActivity({
      agent: "requirements",
      action: "extracting_requirements",
      conversationId: req.params.conversationId,
      status: "error",
      metadata: { error: err.message },
    });
    next(err);
  }
});

/** GET /requirements/project/:projectId - view current structured requirements. */
requirementsRouter.get("/project/:projectId", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    next(err);
  }
});
