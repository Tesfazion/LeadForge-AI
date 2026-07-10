import Imap from "imap";
import { simpleParser } from "mailparser";
import { EventEmitter } from "events";

/**
 * Email Inbox Integration
 * Monitors Gmail inbox for new emails and creates tasks/leads automatically
 * 
 * Features:
 * - Real-time email monitoring via IMAP
 * - Automatic lead creation from emails
 * - Task creation from email content
 * - AI analysis of email intent
 * - Reply detection and conversation linking
 */

class EmailInboxMonitor extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.imap = null;
    this.isMonitoring = false;
  }

  /**
   * Connect to Gmail inbox
   */
  async connect() {
    if (!this.config.user || !this.config.password) {
      console.warn("[EmailInbox] No credentials configured. Email monitoring disabled.");
      return false;
    }

    this.imap = new Imap({
      user: this.config.user,
      password: this.config.password,
      host: this.config.host || "imap.gmail.com",
      port: this.config.port || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        console.log("[EmailInbox] Connected to inbox");
        resolve(true);
      });

      this.imap.once("error", (err) => {
        console.error("[EmailInbox] Connection error:", err.message);
        reject(err);
      });

      this.imap.connect();
    });
  }

  /**
   * Start monitoring inbox for new emails
   */
  async startMonitoring() {
    if (!this.imap || this.isMonitoring) return;

    this.isMonitoring = true;

    this.imap.openBox("INBOX", false, (err) => {
      if (err) {
        console.error("[EmailInbox] Failed to open inbox:", err);
        return;
      }

      console.log("[EmailInbox] Monitoring inbox for new emails...");

      // Listen for new emails
      this.imap.on("mail", () => {
        this.fetchNewEmails();
      });

      // Initial fetch
      this.fetchNewEmails();
    });
  }

  /**
   * Fetch new unread emails
   */
  async fetchNewEmails() {
    this.imap.search(["UNSEEN"], (err, results) => {
      if (err || !results || results.length === 0) return;

      const fetch = this.imap.fetch(results, { bodies: "" });

      fetch.on("message", (msg) => {
        msg.on("body", (stream) => {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              console.error("[EmailInbox] Parse error:", err);
              return;
            }

            // Emit new email event
            this.emit("newEmail", {
              from: parsed.from?.text,
              to: parsed.to?.text,
              subject: parsed.subject,
              text: parsed.text,
              html: parsed.html,
              date: parsed.date,
              messageId: parsed.messageId,
              inReplyTo: parsed.inReplyTo,
            });
          });
        });
      });
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.imap) {
      this.imap.end();
    }
  }
}

// Singleton instance
let monitorInstance = null;

/**
 * Get or create email monitor instance
 */
export function getEmailMonitor() {
  if (!monitorInstance) {
    const config = {
      user: process.env.SMTP_USER || process.env.GMAIL_SENDER_EMAIL,
      password: process.env.SMTP_PASS || process.env.GMAIL_REFRESH_TOKEN,
      host: process.env.IMAP_HOST || "imap.gmail.com",
      port: process.env.IMAP_PORT || 993,
    };

    monitorInstance = new EmailInboxMonitor(config);
  }

  return monitorInstance;
}

/**
 * Initialize email monitoring
 */
export async function initializeEmailMonitoring() {
  const monitor = getEmailMonitor();
  
  try {
    const connected = await monitor.connect();
    if (connected) {
      await monitor.startMonitoring();
      return true;
    }
  } catch (error) {
    console.error("[EmailInbox] Failed to initialize:", error.message);
  }
  
  return false;
}
