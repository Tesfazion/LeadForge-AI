/**
 * Outreach route
 *
 * Manages the human-in-the-loop email outreach workflow:
 *   1. Agent drafts an email  (POST /outreach/draft)
 *   2. Human reviews it       (GET  /outreach/pending)
 *   3. Human edits if needed  (PUT  /outreach/:id/edit)
 *   4. Human approves → sent  (POST /outreach/:id/approve)
 *      or rejects → deleted   (POST /outreach/:id/reject)
 *
 * Approved messages are sent via the configured mailer and have open/click
 * tracking injected before sending.
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { draftOutreachEmail } from "../agents/outreachAgent.js";
import { sendEmail } from "../lib/mailer.js";
import { convertTextToTrackedHtml } from "../lib/emailTracking.js";
import { recordActivity } from "./activities.js";

export const outreachRouter = Router();

/**
 * POST /outreach/draft
 * body: { leadId }
 * Creates a draft outreach email as an unapproved Message, tied to a new
 * Conversation for that lead. Does NOT send it - see /outreach/:messageId/approve.
 */
outreachRouter.post("/draft", async (req, res, next) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: "leadId is required" });

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const pendingDraft = await prisma.message.findFirst({
      where: {
        role: "AGENT",
        approved: false,
        sentAt: null,
        conversation: { leadId: lead.id },
      },
      select: { id: true },
    });
    if (pendingDraft) {
      return res.status(409).json({ error: "This lead already has an outreach draft waiting for review." });
    }

    recordActivity({
      agent: "outreach",
      action: "drafting_email",
      leadId: lead.id,
      status: "started",
      metadata: { leadName: lead.name, leadEmail: lead.email },
    });

    const { subject, body } = await draftOutreachEmail(lead);

    const conversation = await prisma.conversation.create({
      data: { leadId: lead.id, subject },
    });
    const draft = await prisma.message.create({
      data: { conversationId: conversation.id, role: "AGENT", content: body, approved: false },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "OUTREACH_PENDING_APPROVAL" },
    });

    recordActivity({
      agent: "outreach",
      action: "drafting_email",
      leadId: lead.id,
      conversationId: conversation.id,
      status: "completed",
      metadata: { subject },
    });

    res.status(201).json({ ...conversation, messages: [draft] });
  } catch (err) {
    recordActivity({
      agent: "outreach",
      action: "drafting_email",
      leadId: req.body.leadId,
      status: "error",
      metadata: { error: err.message },
    });
    next(err);
  }
});

/**
 * GET /outreach/pending
 * Lists drafted-but-unapproved outreach messages for the dashboard's
 * "Approve outreach" screen.
 */
outreachRouter.get("/pending", async (req, res, next) => {
  try {
    const pending = await prisma.message.findMany({
      where: { role: "AGENT", approved: false, sentAt: null },
      include: { conversation: { include: { lead: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(pending);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /outreach/:messageId/approve
 * Marks a drafted email approved and sends it via the configured provider.
 */
outreachRouter.post("/:messageId/approve", async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId },
      include: { conversation: { include: { lead: true } } },
    });
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.role !== "AGENT" || message.approved || message.sentAt) {
      return res.status(409).json({ error: "Only an unsent outreach draft can be approved." });
    }

    // Convert text to HTML with tracking
    const htmlContent = convertTextToTrackedHtml(message.content, message.id);

    await sendEmail({
      to: message.conversation.lead.email,
      subject: message.conversation.subject || "Following up",
      text: message.content,
      html: htmlContent,
    });

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: { approved: true, sentAt: new Date() },
    });

    await prisma.lead.update({
      where: { id: message.conversation.leadId },
      data: { status: "OUTREACH_SENT" },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /outreach/:messageId/edit
 * Updates the content and/or subject of a drafted email before approval
 */
outreachRouter.put("/:messageId/edit", async (req, res, next) => {
  try {
    const { content, subject } = req.body;
    const messageId = req.params.messageId;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.role !== "AGENT" || message.approved || message.sentAt) {
      return res.status(400).json({ error: "Only an unsent outreach draft can be edited." });
    }

    // Update message content
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: { conversation: { include: { lead: true } } },
    });

    // Update conversation subject if provided
    if (subject && subject !== message.conversation.subject) {
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: { subject },
      });
    }

    recordActivity({
      agent: "outreach",
      action: "edit_draft",
      leadId: message.conversation.leadId,
      conversationId: message.conversationId,
      status: "completed",
      metadata: { messageId, edited: true },
    });

    res.json(updatedMessage);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /outreach/:messageId/reject
 * Discards a drafted email without sending it (e.g. human edits and re-drafts).
 */
outreachRouter.post("/:messageId/reject", async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId },
      include: { conversation: true },
    });
    if (!message) return res.status(404).json({ error: "Draft not found" });
    if (message.role !== "AGENT" || message.approved || message.sentAt) {
      return res.status(409).json({ error: "Only an unsent outreach draft can be discarded." });
    }

    const deleted = await prisma.message.delete({ where: { id: message.id } });
    const lead = await prisma.lead.findUnique({ where: { id: message.conversation.leadId } });
    if (lead?.status === "OUTREACH_PENDING_APPROVAL") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "NEW" },
      });
    }
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});
