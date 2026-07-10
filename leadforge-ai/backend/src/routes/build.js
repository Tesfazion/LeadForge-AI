import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { generateSite, writeProjectToDisk, deployToVercel } from "../agents/developerAgent.js";
import { recordActivity } from "./activities.js";

export const buildRouter = Router();

/**
 * POST /build/:projectId
 * Generates site code from the project's stored requirements, writes it to
 * disk, and deploys to Vercel. Updates the Project with repo/deploy status
 * so the dashboard can show progress.
 */
buildRouter.post("/:projectId", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId }, include: { lead: true } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.requirements) {
      return res.status(400).json({ error: "Project has no requirements yet - run /requirements/:conversationId/extract first" });
    }

    recordActivity({
      agent: "developer",
      action: "building_site",
      leadId: project.leadId,
      projectId: project.id,
      status: "started",
      metadata: { projectName: project.name },
    });

    await prisma.project.update({ where: { id: project.id }, data: { status: "BUILDING" } });

    const files = await generateSite(project.requirements);
    const localPath = await writeProjectToDisk(project.id, files);

    let deployResult;
    try {
      deployResult = await deployToVercel(project.name, files);
    } catch (deployErr) {
      const failed = await prisma.project.update({
        where: { id: project.id },
        data: { status: "BUILD_FAILED", buildLog: String(deployErr.message || deployErr) },
      });
      
      recordActivity({
        agent: "developer",
        action: "building_site",
        leadId: project.leadId,
        projectId: project.id,
        status: "error",
        metadata: { error: deployErr.message, projectName: project.name },
      });
      
      return res.status(502).json({ error: "Deployment failed", project: failed, localPath });
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "DEPLOYED",
        deployUrl: deployResult.url,
        buildLog: `Deployed ${deployResult.deploymentId} -> ${deployResult.url}`,
      },
    });

    recordActivity({
      agent: "developer",
      action: "building_site",
      leadId: project.leadId,
      projectId: project.id,
      status: "completed",
      metadata: { deployUrl: deployResult.url, projectName: project.name },
    });

    res.json({ project: updated, localPath });
  } catch (err) {
    recordActivity({
      agent: "developer",
      action: "building_site",
      projectId: req.params.projectId,
      status: "error",
      metadata: { error: err.message },
    });
    next(err);
  }
});

/** GET /build/:projectId/status - poll build/deploy status for the dashboard. */
buildRouter.get("/:projectId/status", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ status: project.status, deployUrl: project.deployUrl, buildLog: project.buildLog });
  } catch (err) {
    next(err);
  }
});
