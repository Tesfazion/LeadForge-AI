/**
 * Discovery route
 *
 * Searches Apollo for real prospects or generates explicitly fictional AI
 * sample records for preview.
 * Optionally auto-inserts discovered leads into the database (skipping
 * duplicates by email).
 *
 * Endpoints:
 *   POST /discovery/search  — discover leads by criteria
 *   GET  /discovery/stats   — count leads by source for analytics
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { discoverLeads, getDiscoverySources } from "../agents/leadDiscoveryAgent.js";

export const discoveryRouter = Router();

discoveryRouter.get("/sources", (_req, res) => {
  res.json(getDiscoverySources());
});

/**
 * POST /discovery/search
 * body: { industry, location, companySize, count, autoAdd }
 * 
 * Discovers leads based on criteria and optionally adds them to the database.
 */
discoveryRouter.post("/search", async (req, res, next) => {
  try {
    const {
      industry = "technology",
      location = "United States",
      companySize = "1-50 employees",
      count = 5,
      autoAdd = false,
      source = "apollo",
    } = req.body;

    if (!["apollo", "ai"].includes(source)) {
      return res.status(400).json({ error: "Choose Apollo live search or AI sample mode." });
    }
    if (source === "ai" && autoAdd) {
      return res.status(400).json({ error: "AI sample records are fictional and cannot be saved to the contactable lead pipeline." });
    }

    const requestedCount = Number.parseInt(count, 10);
    if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > 20) {
      return res.status(400).json({ error: "count must be a whole number between 1 and 20." });
    }

    const leads = await discoverLeads({
      industry,
      location,
      companySize,
      count: requestedCount,
      source,
    });

    let added = 0;
    if (autoAdd) {
      for (const lead of leads) {
        if (!lead.email) continue;
        const existing = await prisma.lead.findFirst({ where: { email: lead.email } });
        if (existing) continue;
        await prisma.lead.create({
          data: {
            name: lead.name,
            email: lead.email,
            company: lead.company,
            source: lead.source,
            notes: lead.notes,
            status: "NEW",
          },
        });
        added += 1;
      }
    }

    res.status(autoAdd ? 201 : 200).json({
      discovered: leads.length,
      added,
      source,
      isSampleData: source === "ai",
      leads,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /discovery/stats
 * Returns statistics about lead sources
 */
discoveryRouter.get("/stats", async (req, res, next) => {
  try {
    const allLeads = await prisma.lead.findMany({
      select: { source: true },
    });

    const sourceStats = allLeads.reduce((acc, lead) => {
      const source = lead.source || "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    res.json(sourceStats);
  } catch (err) {
    next(err);
  }
});
