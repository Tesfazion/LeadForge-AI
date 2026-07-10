import nodemailer from "nodemailer";

let transporter;

/**
 * Lazily builds a nodemailer transporter.
 * Supports multiple modes:
 * 1. Gmail OAuth2 (production)
 * 2. SMTP with credentials (e.g., Gmail App Password, SendGrid, etc.)
 * 3. Test mode (logs email without sending)
 *
 * Setting up Gmail with App Password (easiest):
 * 1. Go to Google Account Settings → Security → 2-Step Verification
 * 2. Enable 2-Step Verification if not enabled
 * 3. Go to App Passwords (search for it)
 * 4. Generate app password for "Mail" → "Other (Custom name)"
 * 5. Set SMTP_USER (your gmail) and SMTP_PASS (the generated password) in .env
 */
function getTransporter() {
  if (transporter) return transporter;

  const { 
    GMAIL_CLIENT_ID, 
    GMAIL_CLIENT_SECRET, 
    GMAIL_REFRESH_TOKEN, 
    GMAIL_SENDER_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_MODE
  } = process.env;

  // Mode 1: Gmail OAuth2
  if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && GMAIL_SENDER_EMAIL) {
    console.log("[mailer] Using Gmail OAuth2");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: GMAIL_SENDER_EMAIL,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
      },
    });
    return transporter;
  }

  // Mode 2: SMTP with credentials (Gmail App Password, SendGrid, etc.)
  if (SMTP_USER && SMTP_PASS) {
    const host = SMTP_HOST || "smtp.gmail.com";
    const port = SMTP_PORT || 587;
    console.log(`[mailer] Using SMTP: ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port == 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    return transporter;
  }

  // Mode 3: Test mode (no actual sending)
  console.warn("[mailer] No email credentials configured. Using test mode (emails will be logged but not sent)");
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  
  const { SMTP_USER, GMAIL_SENDER_EMAIL, EMAIL_FROM } = process.env;
  const fromEmail = EMAIL_FROM || SMTP_USER || GMAIL_SENDER_EMAIL || "noreply@leadforge.ai";
  
  const mailOptions = {
    from: fromEmail,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await t.sendMail(mailOptions);
    
    // If using test mode, log the email
    if (info.message) {
      const preview = JSON.parse(info.message);
      console.log("[mailer] TEST MODE - Email would be sent:");
      console.log("  To:", to);
      console.log("  Subject:", subject);
      console.log("  Preview:", preview.text?.substring(0, 100) + "...");
    } else {
      console.log("[mailer] Email sent successfully to:", to);
    }
    
    return info;
  } catch (error) {
    console.error("[mailer] Failed to send email:", error.message);
    throw error;
  }
}
