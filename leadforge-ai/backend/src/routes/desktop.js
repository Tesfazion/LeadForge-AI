import { Router } from "express";
import path from "path";
import { prisma } from "../lib/prisma.js";
import {
  getInstalledApps,
  openInApp,
  openInMultipleApps,
  createVSCodeWorkspace,
  openInBrowser,
} from "../lib/desktopIntegration.js";
import { recordActivity } from "./activities.js";

export const desktopRouter = Router();

/**
 * GET /desktop/apps
 * Get list of installed desktop applications
 */
desktopRouter.get("/apps", async (req, res, next) => {
  try {
    const apps = await getInstalledApps();
    res.json(apps);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /desktop/open
 * Open a project in a specific desktop application
 * Body: { projectId, appId, appIds[] }
 */
desktopRouter.post("/open", async (req, res, next) => {
  try {
    const { projectId, appId, appIds } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectPath = path.join(process.cwd(), "generated-sites", project.id);

    // Open in multiple apps
    if (appIds && Array.isArray(appIds)) {
      const results = await openInMultipleApps(appIds, projectPath);

      recordActivity({
        agent: "desktop",
        action: "open_in_apps",
        projectId: project.id,
        status: "completed",
        metadata: { apps: appIds, projectName: project.name, results },
      });

      return res.json({ results, projectPath });
    }

    // Open in single app
    if (!appId) {
      return res.status(400).json({ error: "appId or appIds is required" });
    }

    const result = await openInApp(appId, projectPath);

    recordActivity({
      agent: "desktop",
      action: "open_in_app",
      projectId: project.id,
      status: "completed",
      metadata: { app: appId, projectName: project.name },
    });

    res.json({ ...result, projectPath });
  } catch (err) {
    if (err.message.includes("not installed")) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * POST /desktop/workspace
 * Create VS Code workspace file
 */
desktopRouter.post("/workspace", async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectPath = path.join(process.cwd(), "generated-sites", project.id);
    const workspacePath = await createVSCodeWorkspace(projectPath, project.name);

    recordActivity({
      agent: "desktop",
      action: "create_workspace",
      projectId: project.id,
      status: "completed",
      metadata: { workspacePath, projectName: project.name },
    });

    res.json({ workspacePath, projectPath });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /desktop/open-url
 * Open a URL in browser
 */
desktopRouter.post("/open-url", async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const result = await openInBrowser(url);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /desktop/open-folder
 * Open project folder in file explorer
 */
desktopRouter.post("/open-folder", async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectPath = path.join(process.cwd(), "generated-sites", project.id);
    const result = await openInApp("explorer", projectPath);

    recordActivity({
      agent: "desktop",
      action: "open_folder",
      projectId: project.id,
      status: "completed",
      metadata: { projectPath, projectName: project.name },
    });

    res.json({ ...result, projectPath });
  } catch (err) {
    next(err);
  }
});
