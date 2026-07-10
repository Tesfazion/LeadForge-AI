import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { discoverLeads } from "../agents/leadDiscoveryAgent.js";

export const discoveryRouter = Router();

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
    } = req.body;

    // Discover leads
    const leads = await discoverLeads({
      industry,
      location,
      companySize,
      count: parseInt(count, 10) || 5,
    });

    // Optionally add them to database
    if (autoAdd) {
      const created = [];
      for (const lead of leads) {
        try {
          // Check if email already exists
          const existing = await prisma.lead.findUnique({
            where: { email: lead.email },
          });

          if (!existing) {
            const newLead = await prisma.lead.create({
              data: {
                name: lead.name,
                email: lead.email,
                company: lead.company,
                source: lead.source,
                notes: lead.notes,
                status: "NEW",
              },
            });
            created.push(newLead);
          }
        } catch (err) {
          console.error(`Failed to create lead ${lead.email}:`, err.message);
        }
      }

      res.status(201).json({
        discovered: leads.length,
        added: created.length,
        leads: created,
      });
    } else {
      res.json({
        discovered: leads.length,
        leads,
      });
    }
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
