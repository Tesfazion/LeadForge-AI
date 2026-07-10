import crypto from "crypto";

/**
 * Email Tracking System
 * Tracks email opens and link clicks
 */

const trackingData = new Map(); // In production, use Redis or database

/**
 * Generate tracking pixel for email opens
 */
export function generateTrackingPixel(messageId) {
  const token = crypto.randomBytes(16).toString("hex");
  
  trackingData.set(token, {
    messageId,
    type: "open",
    createdAt: new Date(),
    events: [],
  });

  const baseUrl = process.env.BACKEND_URL || "http://localhost:1100";
  return `${baseUrl}/track/open/${token}`;
}

/**
 * Generate tracked link for click tracking
 */
export function generateTrackedLink(messageId, originalUrl, linkId = "link") {
  const token = crypto.randomBytes(16).toString("hex");
  
  trackingData.set(token, {
    messageId,
    type: "click",
    linkId,
    originalUrl,
    createdAt: new Date(),
    events: [],
  });

  const baseUrl = process.env.BACKEND_URL || "http://localhost:1100";
  return `${baseUrl}/track/click/${token}`;
}

/**
 * Record email open event
 */
export function recordOpen(token, metadata = {}) {
  const data = trackingData.get(token);
  
  if (!data) {
    return null;
  }

  const event = {
    timestamp: new Date(),
    userAgent: metadata.userAgent,
    ip: metadata.ip,
    location: metadata.location,
  };

  data.events.push(event);
  
  return {
    messageId: data.messageId,
    firstOpen: data.events.length === 1,
    totalOpens: data.events.length,
  };
}

/**
 * Record link click event
 */
export function recordClick(token, metadata = {}) {
  const data = trackingData.get(token);
  
  if (!data) {
    return null;
  }

  const event = {
    timestamp: new Date(),
    userAgent: metadata.userAgent,
    ip: metadata.ip,
    location: metadata.location,
  };

  data.events.push(event);
  
  return {
    messageId: data.messageId,
    linkId: data.linkId,
    originalUrl: data.originalUrl,
    firstClick: data.events.length === 1,
    totalClicks: data.events.length,
  };
}

/**
 * Get tracking stats for a message
 */
export function getTrackingStats(messageId) {
  const stats = {
    opens: 0,
    clicks: 0,
    firstOpenAt: null,
    lastOpenAt: null,
    firstClickAt: null,
    lastClickAt: null,
    linkClicks: {},
  };

  for (const [token, data] of trackingData.entries()) {
    if (data.messageId !== messageId) continue;

    if (data.type === "open" && data.events.length > 0) {
      stats.opens = data.events.length;
      stats.firstOpenAt = data.events[0].timestamp;
      stats.lastOpenAt = data.events[data.events.length - 1].timestamp;
    }

    if (data.type === "click" && data.events.length > 0) {
      stats.clicks += data.events.length;
      const firstClick = data.events[0].timestamp;
      const lastClick = data.events[data.events.length - 1].timestamp;
      
      if (!stats.firstClickAt || firstClick < stats.firstClickAt) {
        stats.firstClickAt = firstClick;
      }
      if (!stats.lastClickAt || lastClick > stats.lastClickAt) {
        stats.lastClickAt = lastClick;
      }

      stats.linkClicks[data.linkId] = {
        url: data.originalUrl,
        clicks: data.events.length,
      };
    }
  }

  return stats;
}

/**
 * Inject tracking into HTML email
 */
export function injectTracking(htmlContent, messageId) {
  let tracked = htmlContent;

  // Add tracking pixel at the end of body
  const pixelUrl = generateTrackingPixel(messageId);
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  
  if (tracked.includes("</body>")) {
    tracked = tracked.replace("</body>", `${trackingPixel}</body>`);
  } else {
    tracked += trackingPixel;
  }

  // Track all links
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi;
  let linkIndex = 0;
  
  tracked = tracked.replace(linkRegex, (match, url, rest) => {
    // Skip anchor links and tracking links
    if (url.startsWith("#") || url.includes("/track/")) {
      return match;
    }

    const trackedUrl = generateTrackedLink(messageId, url, `link-${linkIndex}`);
    linkIndex++;
    
    return `<a href="${trackedUrl}"${rest}>`;
  });

  return tracked;
}

/**
 * Convert plain text email to HTML with tracking
 */
export function convertTextToTrackedHtml(textContent, messageId) {
  let html = `<html><body style="font-family: sans-serif; line-height: 1.6; color: #333;">`;
  
  // Convert line breaks to <br>
  const paragraphs = textContent.split("\n\n");
  paragraphs.forEach(para => {
    html += `<p>${para.replace(/\n/g, "<br>")}</p>`;
  });

  // Convert URLs to tracked links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let linkIndex = 0;
  
  html = html.replace(urlRegex, (url) => {
    const trackedUrl = generateTrackedLink(messageId, url, `link-${linkIndex}`);
    linkIndex++;
    return `<a href="${trackedUrl}">${url}</a>`;
  });

  html += `</body></html>`;

  // Inject tracking pixel
  return injectTracking(html, messageId);
}
