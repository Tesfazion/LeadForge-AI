import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { continueConversation } from "../agents/chatAgent.js";
import { recordActivity } from "./activities.js";

export const chatRouter = Router();

/**
 * POST /chat/:conversationId/reply
 * body: { content }  -- the lead's incoming reply (e.g. from an email
 * webhook, or pasted in manually via the dashboard for now).
 * Persists the lead's message, asks the Chat Agent for a response using the
 * full stored history, persists that too, and returns both.
 */
chatRouter.post("/:conversationId/reply", async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });

    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } }, lead: true },
    });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    recordActivity({
      agent: "chat",
      action: "generating_reply",
      leadId: conversation.leadId,
      conversationId: conversation.id,
      status: "started",
      metadata: { leadName: conversation.lead.name },
    });

    const leadMessage = await prisma.message.create({
      data: { conversationId: conversation.id, role: "LEAD", content, approved: true, sentAt: new Date() },
    });

    await prisma.lead.update({ where: { id: conversation.leadId }, data: { status: "REPLIED" } });

    const history = [...conversation.messages, leadMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const replyText = await continueConversation(history);

    const agentMessage = await prisma.message.create({
      data: { conversationId: conversation.id, role: "AGENT", content: replyText, approved: true, sentAt: new Date() },
    });

    recordActivity({
      agent: "chat",
      action: "generating_reply",
      leadId: conversation.leadId,
      conversationId: conversation.id,
      status: "completed",
      metadata: { messageLength: replyText.length },
    });

    res.status(201).json({ leadMessage, agentMessage });
  } catch (err) {
    recordActivity({
      agent: "chat",
      action: "generating_reply",
      conversationId: req.params.conversationId,
      status: "error",
      metadata: { error: err.message },
    });
    next(err);
  }
});

/** GET /chat/:conversationId - full transcript for the dashboard chat view. */
chatRouter.get("/:conversationId", async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } }, lead: true },
    });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});
