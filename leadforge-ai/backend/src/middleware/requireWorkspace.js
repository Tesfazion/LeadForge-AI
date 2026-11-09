import { prisma } from "../lib/prisma.js";
import { withWorkspace } from "../lib/workspaceContext.js";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const supabasePublicKey = process.env.SUPABASE_ANON_KEY;

export async function requireWorkspace(req, res, next) {
  const isPublicCallback = /\/oauth\/callback\/[^/]+$/.test(req.path);
  const isPublicTracking = /\/track\/(open|click)\/[^/]+$/.test(req.path);
  if (isPublicCallback || isPublicTracking) return next();

  if (!supabaseUrl || !supabasePublicKey) {
    return res.status(503).json({ error: "Supabase authentication is not configured" });
  }

  try {
    const authorization = req.get("authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) return res.status(401).json({ error: "Authentication required" });

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabasePublicKey,
        Authorization: `Bearer ${tokenMatch[1]}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 401 || response.status === 403) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }
    if (!response.ok) {
      console.error(`[auth] Supabase user verification failed with status ${response.status}`);
      return res.status(503).json({ error: "Authentication service is temporarily unavailable" });
    }

    const user = await response.json();
    if (typeof user.id !== "string" || !user.id) {
      return res.status(401).json({ error: "Invalid authenticated user" });
    }

    const workspace = await prisma.workspace.upsert({
      where: { authUserId: user.id },
      create: { authUserId: user.id },
      update: {},
      select: { id: true },
    });

    req.userId = user.id;
    req.workspaceId = workspace.id;
    return withWorkspace(workspace.id, next);
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(503).json({ error: "Authentication service timed out" });
    }
    return next(error);
  }
}
