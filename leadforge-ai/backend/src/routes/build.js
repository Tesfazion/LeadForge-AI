import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { generateSite, writeProjectToDisk, deployToVercel } from "../agents/developerAgent.js";
import { getRealtimeBuilder } from "../lib/realtimeBuilder.js";
import { recordActivity } from "./activities.js";

export const buildRouter = Router();

/**
 * Helper: Read all files from a project directory
 */
async function readProjectFromDisk(projectPath) {
  const files = {};
  
  async function readDir(dir, base = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = base ? `${base}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        await readDir(fullPath, relativePath);
      } else {
        const content = await fs.readFile(fullPath, "utf-8");
        files[relativePath] = content;
      }
    }
  }
  
  await readDir(projectPath);
  return files;
}

/**
 * POST /build/:projectId
 * Generates site code from the project's stored requirements and creates a preview.
 * The preview can be reviewed before deployment.
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

    // Generate files
    const files = await generateSite(project.requirements);
    
    // Write to disk for preview
    const localPath = await writeProjectToDisk(project.id, files);

    // Update project with preview status
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "PREVIEW_READY",
        buildLog: `Preview created at ${localPath}. Ready for review and deployment.`,
      },
    });

    recordActivity({
      agent: "developer",
      action: "building_site",
      leadId: project.leadId,
      projectId: project.id,
      status: "completed",
      metadata: { localPath, projectName: project.name, stage: "preview" },
    });

    res.json({ 
      project: updated, 
      localPath,
      files,
      previewReady: true,
      message: "Website generated successfully. Review the preview before deploying."
    });
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

/**
 * POST /build/:projectId/deploy
 * Deploy the previewed website to Vercel after review
 */
buildRouter.post("/:projectId/deploy", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.status !== "PREVIEW_READY") {
      return res.status(400).json({ error: "Project must be in PREVIEW_READY status. Build the site first." });
    }

    recordActivity({
      agent: "developer",
      action: "deploying_site",
      leadId: project.leadId,
      projectId: project.id,
      status: "started",
      metadata: { projectName: project.name },
    });

    await prisma.project.update({ where: { id: project.id }, data: { status: "DEPLOYING" } });

    // Read files from disk
    const localPath = path.join(process.cwd(), "generated-sites", project.id);
    const files = await readProjectFromDisk(localPath);

    // Deploy to Vercel
    let deployResult;
    try {
      deployResult = await deployToVercel(project.name, files);
    } catch (deployErr) {
      const failed = await prisma.project.update({
        where: { id: project.id },
        data: { status: "DEPLOY_FAILED", buildLog: String(deployErr.message || deployErr) },
      });
      
      recordActivity({
        agent: "developer",
        action: "deploying_site",
        leadId: project.leadId,
        projectId: project.id,
        status: "error",
        metadata: { error: deployErr.message, projectName: project.name },
      });
      
      return res.status(502).json({ error: "Deployment failed", project: failed });
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
      action: "deploying_site",
      leadId: project.leadId,
      projectId: project.id,
      status: "completed",
      metadata: { deployUrl: deployResult.url, projectName: project.name },
    });

    res.json({ project: updated, deployUrl: deployResult.url });
  } catch (err) {
    recordActivity({
      agent: "developer",
      action: "deploying_site",
      projectId: req.params.projectId,
      status: "error",
      metadata: { error: err.message },
    });
    next(err);
  }
});

/**
 * GET /build/:projectId/preview
 * Get the preview files for the project
 */
buildRouter.get("/:projectId/preview", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const localPath = path.join(process.cwd(), "generated-sites", project.id);
    
    try {
      const files = await readProjectFromDisk(localPath);
      res.json({ 
        project, 
        files,
        localPath,
        canDeploy: project.status === "PREVIEW_READY"
      });
    } catch (err) {
      res.status(404).json({ error: "Preview not found. Build the project first." });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /build/:projectId/open-in-vscode
 * Open the project in VS Code
 */
buildRouter.post("/:projectId/open-in-vscode", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const localPath = path.join(process.cwd(), "generated-sites", project.id);
    
    // Open in VS Code using 'code' command
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      await execAsync(`code "${localPath}"`);
      
      recordActivity({
        agent: "developer",
        action: "open_in_vscode",
        projectId: project.id,
        status: "completed",
        metadata: { localPath, projectName: project.name },
      });

      res.json({ 
        success: true, 
        message: "Project opened in VS Code",
        localPath 
      });
    } catch (err) {
      res.status(500).json({ 
        error: "Failed to open VS Code. Make sure VS Code is installed and 'code' command is available.",
        localPath,
        hint: "You can manually open this path in your IDE"
      });
    }
  } catch (err) {
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

/**
 * GET /build/:projectId/stream
 * Server-Sent Events stream for real-time build progress
 */
buildRouter.get("/:projectId/stream", (req, res) => {
  const projectId = req.params.projectId;

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  // Get builder instance
  const builder = getRealtimeBuilder();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", projectId })}\n\n`);

  // Listen for progress updates
  const progressHandler = (data) => {
    if (data.projectId === projectId) {
      res.write(`data: ${JSON.stringify({ type: "progress", ...data })}\n\n`);
    }
  };

  builder.on("progress", progressHandler);

  // Clean up on close
  req.on("close", () => {
    builder.off("progress", progressHandler);
    res.end();
  });
});
