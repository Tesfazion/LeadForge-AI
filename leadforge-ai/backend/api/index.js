/**
 * Vercel Serverless Entry Point
 *
 * Vercel's Node.js runtime calls this file's default export as a plain
 * (req, res) handler — it must NOT call app.listen().
 *
 * What changes vs. the local dev server (src/server.js):
 *   • No app.listen() call — Vercel manages the HTTP lifecycle
 *   • No IMAP auto-start  — persistent connections don't survive serverless cold starts
 *   • morgan logging is disabled in production (Vercel captures stdout anyway)
 *   • CORS origin is driven entirely by the FRONTEND_URL env variable
 *   • Swagger UI is still served at /api/api-docs for API exploration
 *
 * All route logic is unchanged — routes still import from ../src/routes/*.
 *
 * Path note: this file lives at  backend/api/index.js
 * Source routes live at          backend/src/routes/*.js
 * Relative imports below use     ../src/...
 */

import express   from "express";
import cors      from "cors";
import helmet    from "helmet";
import morgan    from "morgan";
import swaggerUi from "swagger-ui-express";
import YAML      from "yamljs";
import path      from "path";
import { fileURLToPath } from "url";

// Route modules
import { leadsRouter }        from "../src/routes/leads.js";
import { outreachRouter }     from "../src/routes/outreach.js";
import { chatRouter }         from "../src/routes/chat.js";
import { requirementsRouter } from "../src/routes/requirements.js";
import { buildRouter }        from "../src/routes/build.js";
import { discoveryRouter }    from "../src/routes/discovery.js";
import { trackingRouter }     from "../src/routes/tracking.js";
import { activitiesRouter }   from "../src/routes/activities.js";
import { inboxRouter }        from "../src/routes/inbox.js";
import { oauthRouter }        from "../src/routes/oauth.js";
import { workspaceRouter }    from "../src/routes/workspace.js";
import { requireWorkspace } from "../src/middleware/requireWorkspace.js";

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = express();

// Load OpenAPI spec (bundled via vercel.json's includeFiles)
const openapiDocument = YAML.load(path.join(__dirname, "../openapi.yaml"));

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(helmet({
  // Relax CSP so the Swagger UI assets load correctly
  contentSecurityPolicy: false,
}));

// CORS — in production, FRONTEND_URL must be set to your Vercel frontend URL
app.use(cors({
  origin:      process.env.FRONTEND_URL || "*",
  credentials: true,
}));

// Request logging — only in local dev. Vercel captures stdout directly so
// morgan output would be redundant noise in production logs.
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "2mb" }));

// ---------------------------------------------------------------------------
// Utility endpoints
// ---------------------------------------------------------------------------

/** Liveness probe */
app.get("/api/health", (_req, res) => res.json({ ok: true, env: "vercel" }));

/** API index */
app.get("/api", (_req, res) => {
  res.json({
    name:    "LeadForge AI API",
    version: "1.0.0",
    docs:    "/api/api-docs",
  });
});

/** Interactive API docs */
app.use(
  "/api/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customCss:       ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LeadForge AI API",
  })
);

// ---------------------------------------------------------------------------
// Routes — all mounted under /api so they match the frontend rewrite rule
// ---------------------------------------------------------------------------

app.use(requireWorkspace);
app.use("/api/leads",        leadsRouter);
app.use("/api/outreach",     outreachRouter);
app.use("/api/chat",         chatRouter);
app.use("/api/requirements", requirementsRouter);
app.use("/api/build",        buildRouter);
app.use("/api/discovery",    discoveryRouter);
app.use("/api/track",        trackingRouter);
app.use("/api/activities",   activitiesRouter);
app.use("/api/inbox",        inboxRouter);
app.use("/api/oauth",        oauthRouter);
app.use("/api/workspace",    workspaceRouter);

// Note: /api/desktop is intentionally omitted — opening local IDE apps has
// no meaning in a serverless / cloud environment.

// ---------------------------------------------------------------------------
// Central error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ---------------------------------------------------------------------------
// Export for Vercel  (do NOT call app.listen here)
// ---------------------------------------------------------------------------
export default app;
