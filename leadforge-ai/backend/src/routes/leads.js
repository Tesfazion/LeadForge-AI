import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const leadsRouter = Router();

/** GET /leads - list all leads with conversation/project counts for the dashboard. */
leadsRouter.get("/", async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { conversations: true, projects: true } },
      },
    });
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

/** POST /leads - manually add a lead (until the outreach-sourcing pipeline is wired to a lead-gen provider). */
leadsRouter.post("/", async (req, res, next) => {
  try {
    const { name, email, company, source, notes } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const lead = await prisma.lead.create({ data: { name, email, company, source, notes } });
    res.status(201).json(lead);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A lead with this email already exists" });
    }
    next(err);
  }
});

/** GET /leads/:id - single lead with full conversation + project history. */
leadsRouter.get("/:id", async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        conversations: { include: { messages: { orderBy: { createdAt: "asc" } } } },
        projects: true,
      },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});
