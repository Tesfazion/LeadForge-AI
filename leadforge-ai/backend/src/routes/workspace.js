import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { encryptSecret } from "../lib/secretEncryption.js";

export const workspaceRouter = Router();

function paymentSetup() {
  const configured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_ID
  );
  return {
    status: "inactive",
    configured,
    enabled: false,
    message: "Payments are not enabled yet. Stripe credentials and pricing must be configured, then checkout must be activated.",
  };
}

workspaceRouter.get("/settings", async (req, res, next) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      select: {
        id: true,
        aiKeyCiphertext: true,
      },
    });

    res.json({
      id: workspace.id,
      ai: {
        provider: "OpenRouter",
        workspaceKeyConfigured: Boolean(workspace.aiKeyCiphertext),
        activeKeySource: workspace.aiKeyCiphertext
          ? "workspace"
          : process.env.OPENAI_API_KEY ? "server" : "missing",
      },
      billing: paymentSetup(),
    });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.put("/ai-key", async (req, res, next) => {
  try {
    const key = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
    if (key.length < 20 || key.length > 2048 || /\s/.test(key)) {
      return res.status(400).json({ error: "Enter a valid OpenRouter API key" });
    }

    const encrypted = encryptSecret(key, req.workspaceId);
    await prisma.workspace.update({
      where: { id: req.workspaceId },
      data: {
        aiKeyCiphertext: encrypted.ciphertext,
        aiKeyNonce: encrypted.nonce,
        aiKeyAuthTag: encrypted.authTag,
      },
      select: { id: true },
    });

    res.json({ configured: true, activeKeySource: "workspace" });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.delete("/ai-key", async (req, res, next) => {
  try {
    await prisma.workspace.update({
      where: { id: req.workspaceId },
      data: { aiKeyCiphertext: null, aiKeyNonce: null, aiKeyAuthTag: null },
      select: { id: true },
    });
    res.json({
      configured: false,
      activeKeySource: process.env.OPENAI_API_KEY ? "server" : "missing",
    });
  } catch (error) {
    next(error);
  }
});
