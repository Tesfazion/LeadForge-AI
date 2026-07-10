# LeadForge AI

An automation platform that finds/tracks leads, drafts and sends outreach, chats with
prospects who reply, extracts structured requirements from that conversation, and
generates + deploys a starter website for them.

## Architecture

```
leadforge-ai/
  backend/     Node + Express API, PostgreSQL via Prisma
    src/agents/        the four AI agents (outreach, chat, requirements, developer)
    src/routes/         /leads /outreach /chat /requirements /build
    prisma/schema.prisma
  frontend/    Next.js dashboard (leads list, conversation view, outreach approval queue)
```

**Data flow:** Lead created → Outreach Agent drafts email (saved unapproved) → human
approves in dashboard → email sent → lead replies → Chat Agent continues the
conversation, all turns persisted in Postgres (this *is* the memory — no separate
vector store or LangChain runtime needed at this scale, since Postgres + full transcript
replay is simpler to operate and debug than a chain framework for a linear conversation
loop like this) → once enough signal exists, Requirements Agent extracts structured JSON
→ Developer Agent generates a Next.js site from that JSON and deploys it to Vercel.

## What's implemented vs. stubbed

Implemented and runnable once you add API keys:
- Full Express API with all four requested endpoints + a `/leads` CRUD route the
  dashboard needs.
- Prisma schema for leads, conversations, messages, projects.
- OpenAI-backed agents for drafting, chatting, and structured extraction (zod-validated).
- Gmail OAuth2 sending via nodemailer, with an approval gate before anything sends.
- Site generation + Vercel deployment via Vercel's REST API (no CLI dependency).
- Next.js dashboard: lead list, add-lead form, conversation view with a "simulate
  lead reply" box (stand-in for a real inbound email webhook), outreach approval
  queue, requirements JSON viewer, build/deploy trigger.

Deliberately left as follow-up work, since they depend on accounts/infra I can't
provision on your behalf:
- **Lead sourcing**: there's no scraper/enrichment API wired in. `/leads` is
  manual-entry today; plug in Apollo, Clearbit, or a scraper of your choice and
  POST to `/leads`.
- **Inbound email → `/chat/:id/reply`**: currently triggered manually from the
  dashboard. For production you'd add a Gmail Pub/Sub push webhook (or Outlook
  Graph subscription) that calls this route when a reply lands.
- **Outlook/Graph sending**: only Gmail OAuth2 is wired in `src/lib/mailer.js`;
  the function signature is provider-agnostic so swapping in Graph is a
  same-file change.
- **Supabase auth on the dashboard itself**: not added — add it in the frontend
  when you're ready to have multiple team members log in.

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env    # fill in DATABASE_URL, OPENAI_API_KEY, Gmail + Vercel creds
npm install
npm run prisma:migrate  # creates tables
npm run dev              # http://localhost:4000
```

### 2. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev               # http://localhost:3000
```

## Getting each credential

- **DATABASE_URL**: easiest path is a free [Supabase](https://supabase.com) project
  → Project Settings → Database → Connection string.
- **OPENAI_API_KEY**: platform.openai.com → API keys.
- **Gmail sending**: see the setup comment at the top of `backend/src/lib/mailer.js`
  (Google Cloud Console → Gmail API → OAuth2 → OAuth Playground for a refresh token).
- **VERCEL_TOKEN**: vercel.com/account/tokens.

## Deploying the platform itself

- **Backend** → Render or Heroku: point it at your repo's `backend/` directory,
  set the env vars above, run `npm run prisma:migrate` once via a one-off job/shell.
- **Frontend** → Vercel: point it at `frontend/`, set `NEXT_PUBLIC_API_URL` to your
  deployed backend URL.
- **Database** → Supabase (or Render/Heroku Postgres) — just needs to match
  `DATABASE_URL`.

## Notes on scope

This is a genuinely large system — four AI agents, email integration, code
generation, and auto-deployment. What's here is a coherent, working skeleton
with real logic in every layer (not placeholder mocks), sized so you can run it
locally today and extend each piece independently. The biggest next investments
are usually: (1) a real lead-sourcing integration, (2) an inbound email webhook
instead of the manual "simulate reply" box, and (3) hardening the Developer
Agent's codegen (currently one homepage per site — extending to multi-page,
multi-component generation is straightforward following the same pattern in
`developerAgent.js`).
