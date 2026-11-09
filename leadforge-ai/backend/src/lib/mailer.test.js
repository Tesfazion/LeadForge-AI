import test from "node:test";
import assert from "node:assert/strict";
import { sendEmail } from "./mailer.js";

test("outreach delivery fails explicitly when no real mail provider is configured", async () => {
  const keys = [
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REFRESH_TOKEN",
    "GMAIL_SENDER_EMAIL",
    "SMTP_USER",
    "SMTP_PASS",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  keys.forEach((key) => delete process.env[key]);

  try {
    await assert.rejects(
      sendEmail({
        to: "sample@example.invalid",
        subject: "Test",
        text: "Not delivered",
        html: "<p>Not delivered</p>",
      }),
      (error) => error.status === 503 && error.message.includes("Email delivery is not configured")
    );
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
