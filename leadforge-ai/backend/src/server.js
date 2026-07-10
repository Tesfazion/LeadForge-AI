import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

import { outreachRouter } from "./routes/outreach.js";
import { chatRouter } from "./routes/chat.js";
import { requirementsRouter } from "./routes/requirements.js";
import { buildRouter } from "./routes/build.js";
import { leadsRouter } from "./routes/leads.js";
import { discoveryRouter } from "./routes/discovery.js";
import { trackingRouter } from "./routes/tracking.js";
import { activitiesRouter } from "./routes/activities.js";
import { inboxRouter } from "./routes/inbox.js";
import { oauthRouter } from "./routes/oauth.js";
import { desktopRouter } from "./routes/desktop.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Load OpenAPI specification
const openapiDocument = YAML.load(path.join(__dirname, "../openapi.yaml"));

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "LeadForge AI API Documentation",
}));

// API Info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "LeadForge AI API",
    version: "1.0.0",
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    endpoints: {
      health: "/health",
      leads: "/leads",
      outreach: "/outreach",
      chat: "/chat",
      requirements: "/requirements",
      build: "/build",
      discovery: "/discovery",
      activities: "/activities",
      tracking: "/track",
      inbox: "/inbox",
      oauth: "/oauth",
      desktop: "/desktop",
    },
  });
});

app.use("/leads", leadsRouter);
app.use("/outreach", outreachRouter);
app.use("/chat", chatRouter);
app.use("/requirements", requirementsRouter);
app.use("/build", buildRouter);
app.use("/discovery", discoveryRouter);
app.use("/track", trackingRouter);
app.use("/activities", activitiesRouter);
app.use("/inbox", inboxRouter);
app.use("/oauth", oauthRouter);
app.use("/desktop", desktopRouter);

// Central error handler - every route calls next(err) on failure
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`LeadForge backend listening on http://localhost:${port}`);
});
