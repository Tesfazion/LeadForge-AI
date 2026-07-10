import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getEmailMonitor, initializeEmailMonitoring } from "../lib/emailInbox.js";
import { openai } from "../lib/openai.js";
import { recordActivity } from "./activities.js";

export const inboxRouter = Router();

// Store for inbox data
let inboxEmails = [];
let inboxTasks = [];

/**
 * Initialize email monitoring
 */
async function setupEmailMonitoring() {
  const monitor = getEmailMonitor();

  // Listen for new emails
  monitor.on("newEmail", async (email) => {
    console.log("[Inbox] New email received:", email.subject);
    
    // Store email
    inboxEmails.unshift({
      id: email.messageId || Date.now().toString(),
      from: email.from,
      subject: email.subject,
      text: email.text,
      date: email.date || new Date(),
      read: false,
      processed: false,
    });

    // Analyze email with AI
    try {
      const analysis = await analyzeEmailIntent(email);
      
      // Create lead if it's from a potential customer
      if (analysis.intent === "lead" || analysis.intent === "inquiry") {
        await createLeadFromEmail(email, analysis);
      }

      // Create task if action is needed
      if (analysis.actionRequired) {
        await createTaskFromEmail(email, analysis);
      }

      recordActivity({
        agent: "inbox",
        action: "email_received",
        status: "completed",
        metadata: {
          from: email.from,
          subject: email.subject,
          intent: analysis.intent,
        },
      });
    } catch (error) {
      console.error("[Inbox] Error processing email:", error);
    }
  });

  // Start monitoring
  await initializeEmailMonitoring();
}

/**
 * Analyze email intent with AI
 */
async function analyzeEmailIntent(email) {
  const prompt = `Analyze this email and determine:
1. Intent (lead/inquiry/reply/spam/general)
2. Is action required? (yes/no)
3. Suggested action
4. Priority (high/medium/low)
5. Extract contact info if present

Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.text?.substring(0, 500)}

Return JSON: { "intent": "...", "actionRequired": true/false, "suggestedAction": "...", "priority": "...", "contactInfo": {...} }`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    return {
      intent: "general",
      actionRequired: false,
      suggestedAction: "Review manually",
      priority: "low",
    };
  }
}

/**
 * Create lead from email
 */
async function createLeadFromEmail(email, analysis) {
  const emailParts = email.from.match(/(.*)<(.*)>/) || [];
  const name = emailParts[1]?.trim() || email.from;
  const emailAddress = emailParts[2]?.trim() || email.from;

  const lead = await prisma.lead.create({
    data: {
      name,
      email: emailAddress,
      company: analysis.contactInfo?.company,
      status: "NEW",
      source: "email_inbox",
    },
  });

  recordActivity({
    agent: "inbox",
    action: "lead_created",
    leadId: lead.id,
    status: "completed",
    metadata: { from: email.from, subject: email.subject },
  });

  return lead;
}

/**
 * Create task from email
 */
async function createTaskFromEmail(email, analysis) {
  const task = {
    id: Date.now().toString(),
    title: email.subject,
    description: email.text?.substring(0, 200),
    action: analysis.suggestedAction,
    priority: analysis.priority,
    from: email.from,
    createdAt: new Date(),
    completed: false,
  };

  inboxTasks.push(task);

  recordActivity({
    agent: "inbox",
    action: "task_created",
    status: "completed",
    metadata: { taskId: task.id, action: task.action },
  });

  return task;
}

/**
 * GET /inbox/emails
 * Get all inbox emails
 */
inboxRouter.get("/emails", async (req, res) => {
  res.json(inboxEmails.slice(0, 50)); // Last 50 emails
});

/**
 * GET /inbox/tasks
 * Get all tasks created from emails
 */
inboxRouter.get("/tasks", async (req, res) => {
  res.json(inboxTasks);
});

/**
 * POST /inbox/tasks/:id/complete
 * Mark task as completed
 */
inboxRouter.post("/tasks/:id/complete", async (req, res) => {
  const task = inboxTasks.find(t => t.id === req.params.id);
  if (task) {
    task.completed = true;
    task.completedAt = new Date();
  }
  res.json(task);
});

/**
 * POST /inbox/emails/:id/mark-read
 * Mark email as read
 */
inboxRouter.post("/emails/:id/mark-read", async (req, res) => {
  const email = inboxEmails.find(e => e.id === req.params.id);
  if (email) {
    email.read = true;
  }
  res.json(email);
});

/**
 * POST /inbox/start
 * Start email monitoring
 */
inboxRouter.post("/start", async (req, res) => {
  try {
    await setupEmailMonitoring();
    res.json({ status: "started", message: "Email monitoring active" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /inbox/status
 * Get monitoring status
 */
inboxRouter.get("/status", (req, res) => {
  const monitor = getEmailMonitor();
  res.json({
    monitoring: monitor.isMonitoring,
    emailCount: inboxEmails.length,
    taskCount: inboxTasks.length,
    unreadCount: inboxEmails.filter(e => !e.read).length,
  });
});

// Auto-start monitoring on server start (if configured)
setTimeout(() => {
  setupEmailMonitoring().catch(err => {
    console.log("[Inbox] Email monitoring not configured:", err.message);
  });
}, 2000);
