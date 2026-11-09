/**
 * Leads route
 *
 * Core CRUD for Lead records.  Every other pipeline feature (outreach, chat,
 * requirements, build) references leads by ID, so this is the foundational
 * resource in the whole system.
 *
 * Endpoints:
 *   GET  /leads        — list all leads (with conversation/project counts)
 *   POST /leads        — manually create a lead
 *   GET  /leads/:id    — single lead with full conversation + project history
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const leadsRouter = Router();

/** GET /leads/summary - return bounded, aggregated dashboard data. */
leadsRouter.get("/summary", async (req, res, next) => {
  try {
    const range = [7, 30, 90].includes(Number(req.query.range)) ? Number(req.query.range) : 30;
    const now = new Date();
    const end = new Date(now);
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - range);
    const previousStart = new Date(start);
    previousStart.setUTCDate(previousStart.getUTCDate() - range);

    const [statusRows, sourceRows, latestLeads, dailyRows, pendingOutreachCount] = await Promise.all([
      prisma.lead.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          source: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "Lead"
        WHERE "workspaceId" = ${req.workspaceId}
          AND "createdAt" >= ${previousStart} AND "createdAt" < ${end}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.message.count({
        where: { role: "AGENT", approved: false, sentAt: null },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      statusRows.map(({ status, _count }) => [status, _count._all])
    );
    const sourceStats = Object.fromEntries(
      sourceRows
        .sort((a, b) => b._count._all - a._count._all)
        .map(({ source, _count }) => [source || "Unknown", _count._all])
    );
    const dailyCounts = new Map(
      dailyRows.map(({ day, count }) => [new Date(day).toISOString().slice(0, 10), count])
    );
    const toDateKey = (date) => date.toISOString().slice(0, 10);
    const currentCount = dailyRows.reduce((total, { day, count }) => (
      new Date(day) >= start ? total + count : total
    ), 0);
    const previousCount = dailyRows.reduce((total, { day, count }) => {
      const date = new Date(day);
      return date >= previousStart && date < start ? total + count : total;
    }, 0);
    const bucketSize = range === 90 ? 7 : 1;
    const trend = [];

    for (let offset = 0, index = 0; offset < range; offset += bucketSize, index += 1) {
      const bucketStart = new Date(start);
      bucketStart.setUTCDate(bucketStart.getUTCDate() + offset);
      const bucketDays = Math.min(bucketSize, range - offset);
      let count = 0;
      for (let day = 0; day < bucketDays; day += 1) {
        const date = new Date(bucketStart);
        date.setUTCDate(date.getUTCDate() + day);
        count += dailyCounts.get(toDateKey(date)) || 0;
      }

      trend.push({
        label: range === 90
          ? `Week ${index + 1}`
          : bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        leads: count,
      });
    }

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const qualified = statusCounts.QUALIFIED || 0;
    const replied = statusCounts.REPLIED || 0;
    const contacted = (statusCounts.OUTREACH_SENT || 0) + replied + qualified;
    const responded = replied + qualified;

    res.json({
      total,
      statusCounts,
      contacted,
      responded,
      qualified,
      currentCount,
      previousCount,
      change: previousCount ? ((currentCount - previousCount) / previousCount) * 100 : null,
      conversion: total ? (qualified / total) * 100 : 0,
      responseRate: contacted ? (responded / contacted) * 100 : 0,
      pendingOutreachCount,
      trend,
      latestLeads,
      sourceStats,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /leads/search - bounded search for the global workspace palette. */
leadsRouter.get("/search", async (req, res, next) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 120) : "";
    if (query.length < 2) return res.json([]);

    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
      },
    });

    res.json(leads);
  } catch (err) {
    next(err);
  }
});

/** GET /leads - list all leads with conversation/project counts. */
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
