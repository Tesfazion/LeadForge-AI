/**
 * LeadForge AI — Express Server Entry Point
 *
 * Boots the HTTP server, registers global middleware, mounts all route
 * modules, serves the OpenAPI docs, and provides a central error handler.
 *
 * Port resolution order:
 *   1. PORT env variable (set this in production)
 *   2. Default: 4000
 *
 * CORS allowed origin order:
 *   1. FRONTEND_URL env variable
 *   2. Default: http://localhost:1101  (Next.js dev server)
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

// Route modules
import { leadsRouter }        from "./routes/leads.js";
import { outreachRouter }     from "./routes/outreach.js";
import { chatRouter }         from "./routes/chat.js";
import { requirementsRouter } from "./routes/requirements.js";
import { buildRouter }        from "./routes/build.js";
import { discoveryRouter }    from "./routes/discovery.js";
import { trackingRouter }     from "./routes/tracking.js";
import { activitiesRouter }   from "./routes/activities.js";
import { inboxRouter }        from "./routes/inbox.js";
import { oauthRouter }        from "./routes/oauth.js";
import { desktopRouter }      from "./routes/desktop.js";
import { workspaceRouter }    from "./routes/workspace.js";
import { requireWorkspace } from "./middleware/requireWorkspace.js";

// Resolve __dirname for ES Modules (not available by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();

// Load the OpenAPI YAML spec once at startup (used by Swagger UI below)
const openapiDocument = YAML.load(path.join(__dirname, "../openapi.yaml"));

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// Security headers (Content-Security-Policy, X-Frame-Options, etc.)
app.use(helmet());

// CORS — restrict to the frontend origin only
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:1101" }));

// Request logging (dev format: method + url + status + response time)
app.use(morgan("dev"));

// Parse incoming JSON bodies
app.use(express.json());

// ---------------------------------------------------------------------------
// Utility endpoints
// ---------------------------------------------------------------------------

/** Liveness probe — used by Docker/cloud health checks */
app.get("/health", (_req, res) => res.json({ ok: true }));

/** API index — lists every available endpoint for quick reference */
app.get("/api", (req, res) => {
  res.json({
    name:          "LeadForge AI API",
    version:       "1.0.0",
    documentation: `${req.protocol}://${req.get("host")}/api-docs`,
    endpoints: {
      health:       "GET  /health",
      leads:        "     /leads",
      outreach:     "     /outreach",
      chat:         "     /chat",
      requirements: "     /requirements",
      build:        "     /build",
      discovery:    "     /discovery",
      activities:   "     /activities",
      tracking:     "     /track",
      inbox:        "     /inbox",
      oauth:        "     /oauth",
      desktop:      "     /desktop",
      workspace:    "     /workspace",
    },
  });
});

/** Interactive API documentation (hides the default Swagger top-bar) */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customCss:       ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LeadForge AI API Documentation",
  })
);

// ---------------------------------------------------------------------------
// Route modules
// ---------------------------------------------------------------------------

app.use(requireWorkspace);
app.use("/leads",        leadsRouter);
app.use("/outreach",     outreachRouter);
app.use("/chat",         chatRouter);
app.use("/requirements", requirementsRouter);
app.use("/build",        buildRouter);
app.use("/discovery",    discoveryRouter);
app.use("/track",        trackingRouter);
app.use("/activities",   activitiesRouter);
app.use("/inbox",        inboxRouter);
app.use("/oauth",        oauthRouter);
app.use("/desktop",      desktopRouter);
app.use("/workspace",    workspaceRouter);

// ---------------------------------------------------------------------------
// Central error handler
// Every route should call next(err) on failure rather than responding inline.
// Attach err.status to control the HTTP status code (defaults to 500).
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`LeadForge backend  →  http://localhost:${PORT}`);
  console.log(`API docs           →  http://localhost:${PORT}/api-docs`);
});
