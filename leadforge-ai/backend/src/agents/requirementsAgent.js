import { z } from "zod";
import { openai } from "../lib/openai.js";

// The structured shape the Developer Agent expects. Keep this in sync with
// prisma schema's Project.requirements (stored as Json).
export const RequirementsSchema = z.object({
  siteType: z.string().describe("e.g. 'booking system', 'portfolio', 'ecommerce store'"),
  features: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]), // e.g. "Supabase", "Stripe", "Calendly"
  pages: z.array(z.string()).default([]),
  brand: z
    .object({
      name: z.string().optional(),
      colors: z.array(z.string()).optional(),
      tone: z.string().optional(),
    })
    .default({}),
  timeline: z.string().optional(),
  budgetRange: z.string().optional(),
  openQuestions: z.array(z.string()).default([]),
});

/**
 * Parses a full conversation transcript into structured requirements JSON.
 * `history` is an array of { role, content } (same shape as chatAgent).
 */
export async function extractRequirements(history) {
  const transcript = history
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `Read this sales conversation transcript and extract structured website/app requirements.
If information is missing, leave arrays empty or omit optional fields - do NOT invent details.
List anything unclear or unconfirmed under "openQuestions".

Transcript:
${transcript}

Respond as strict JSON matching this shape:
{
  "siteType": string,
  "features": string[],
  "integrations": string[],
  "pages": string[],
  "brand": { "name"?: string, "colors"?: string[], "tone"?: string },
  "timeline"?: string,
  "budgetRange"?: string,
  "openQuestions": string[]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  // Validate/coerce against schema so downstream agents get a predictable shape
  return RequirementsSchema.parse(parsed);
}
