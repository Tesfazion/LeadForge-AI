import { openai } from "../lib/openai.js";

const SYSTEM_PROMPT = `You are LeadForge's conversational sales+discovery assistant.
You talk to prospects who replied to an outreach email. Your goals, in order:
1. Build rapport and answer questions about what LeadForge does (an AI platform that builds and deploys small business websites/apps).
2. Understand what the prospect actually needs (type of site, features, integrations, timeline, budget range).
3. Once you have enough detail, tell them you're handing off to the requirements/build pipeline.

Keep replies short (2-6 sentences), conversational, no corporate jargon. Ask one focused question at a time.
Do not invent pricing or promises you can't keep - if asked about price/timeline, give a realistic range and say a human will confirm.`;

/**
 * Continues a conversation given its full message history.
 * `history` is an array of { role: 'LEAD' | 'AGENT' | 'HUMAN_OPERATOR', content: string }
 * ordered oldest -> newest. This function itself is stateless - the caller
 * (routes/chat.js) is responsible for persisting messages to Postgres via Prisma,
 * which is what gives the agent durable memory across turns.
 */
export async function continueConversation(history) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role === "LEAD" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.6,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
