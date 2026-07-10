import { Router } from "express";
import { recordOpen, recordClick } from "../lib/emailTracking.js";
import { prisma } from "../lib/prisma.js";

export const trackingRouter = Router();

/**
 * Track email open
 * GET /track/open/:token
 */
trackingRouter.get("/open/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const metadata = {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      timestamp: new Date(),
    };

    const result = recordOpen(token, metadata);
    
    if (result) {
      // Update message tracking in database
      await prisma.message.update({
        where: { id: result.messageId },
        data: {
          // You could add tracking fields to Message model
          // openedAt: result.firstOpen ? new Date() : undefined,
        },
      }).catch(() => {}); // Ignore errors if message not found
    }

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );

    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.end(pixel);
  } catch (err) {
    console.error("Track open error:", err);
    res.status(500).send("Error");
  }
});

/**
 * Track link click
 * GET /track/click/:token
 */
trackingRouter.get("/click/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const metadata = {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      timestamp: new Date(),
    };

    const result = recordClick(token, metadata);
    
    if (result) {
      // Update message tracking in database
      await prisma.message.update({
        where: { id: result.messageId },
        data: {
          // You could add tracking fields to Message model
          // clickedAt: result.firstClick ? new Date() : undefined,
        },
      }).catch(() => {}); // Ignore errors
      
      // Redirect to original URL
      return res.redirect(result.originalUrl);
    }

    res.status(404).send("Link not found");
  } catch (err) {
    console.error("Track click error:", err);
    res.status(500).send("Error");
  }
});

/**
 * Get tracking stats for a message
 * GET /track/stats/:messageId
 */
trackingRouter.get("/stats/:messageId", async (req, res, next) => {
  try {
    const { messageId } = req.params;
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { lead: true },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const { getTrackingStats } = await import("../lib/emailTracking.js");
    const stats = getTrackingStats(messageId);

    res.json({
      messageId,
      lead: message.conversation.lead,
      sentAt: message.sentAt,
      ...stats,
    });
  } catch (err) {
    next(err);
  }
});
