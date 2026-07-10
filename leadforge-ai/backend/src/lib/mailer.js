import nodemailer from "nodemailer";

let transporter;

/**
 * Lazily builds a nodemailer transporter for Gmail using OAuth2.
 * Swap this out for Microsoft Graph / Outlook if you prefer - the
 * sendEmail() interface below is what the rest of the app depends on.
 *
 * Setting up Gmail OAuth2 (one-time):
 * 1. Create a project in Google Cloud Console, enable the Gmail API.
 * 2. Create OAuth2 credentials (Desktop app type is easiest for getting a refresh token).
 * 3. Use the OAuth2 Playground (https://developers.google.com/oauthplayground)
 *    with your client id/secret to authorize the "https://mail.google.com/" scope
 *    and obtain a refresh token.
 * 4. Put the client id/secret/refresh token + sender email in backend/.env.
 */
function getTransporter() {
  if (transporter) return transporter;

  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL } =
    process.env;

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER_EMAIL) {
    throw new Error(
      "Gmail credentials are not fully configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL in backend/.env"
    );
  }

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

export async function sendEmail({ to, subject, text }) {
  const t = getTransporter();
  return t.sendMail({
    from: process.env.GMAIL_SENDER_EMAIL,
    to,
    subject,
    text,
  });
}
