import { openai } from "../lib/openai.js";

/**
 * Drafts a personalized outreach email for a lead.
 * Returns { subject, body } - this is NOT sent automatically; it is
 * saved as an unapproved Message so a human can review it in the dashboard
 * (see routes/outreach.js and the frontend "Approve outreach" screen).
 */
export async function draftOutreachEmail(lead) {
  const prompt = `You are an SDR writing a first-touch cold email for a small-business website/automation agency called LeadForge.
Write a short, specific, non-generic outreach email to the lead below. No fluff, no "I hope this finds you well".
Keep it under 120 words. End with a soft, low-pressure call to action (a question, not a meeting link).

Lead:
- Name: ${lead.name ?? "Unknown"}
- Company: ${lead.company ?? "Unknown"}
- Source/context: ${lead.source ?? "none provided"}
- Notes: ${lead.notes ?? "none"}

Respond as strict JSON: {"subject": string, "body": string}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return {
    subject: parsed.subject ?? `Quick question about ${lead.company ?? "your website"}`,
    body: parsed.body ?? "",
  };
}
