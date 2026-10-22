# LeadForge AI — Vercel Deployment Guide

This document walks through deploying the full LeadForge AI monorepo to Vercel:
a Next.js frontend served as a standard Vercel project, and an Express backend
served as a single Node.js serverless function at `/api/*`.

---

## Architecture on Vercel

```
Browser
  │
  ├── GET /dashboard, /leads, /outreach, ...
  │       └── @vercel/next  (frontend/pages/*)
  │
  └── GET/POST /api/leads, /api/outreach, ...
          └── @vercel/node  (backend/api/index.js)
                  └── Express app (backend/src/routes/*)
```

`vercel.json` wires this together — no manual configuration is needed after
the environment variables are set.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20.x |
| npm | 10.x |
| Vercel CLI (optional, for CLI deploy) | `npm i -g vercel` |
| PostgreSQL database | Any hosted provider (see below) |

---

## Step 1 — Provision a PostgreSQL database

LeadForge AI requires a PostgreSQL database reachable from Vercel's serverless
functions. Recommended free-tier options:

- **Neon** — https://neon.tech (generous free tier, edge-compatible)
- **Supabase** — https://supabase.com → Project Settings → Database → URI
- **Railway** — https://railway.app
- **Vercel Postgres** — available directly in the Vercel dashboard

Copy the **connection string** (pooled / session mode, not transaction mode).
It will look like:

```
postgresql://user:password@host:5432/dbname?sslmode=require
```

---

## Step 2 — Run the database migration locally (once)

Before deploying, run the Prisma migration against your hosted database so
the schema is created:

```bash
cd leadforge-ai/backend

# Set your hosted DB URL temporarily
$env:DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

npx prisma migrate deploy
npx prisma generate
```

> **Note:** `migrate deploy` applies all pending migrations without prompting.
> Use this in CI/CD. `migrate dev` is for local schema changes only.

---

## Step 3 — Import the project into Vercel

### Option A — Vercel Dashboard (recommended)

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"** and select the `LeadForge-AI` repo
3. Set **Root Directory** to `leadforge-ai` (where `vercel.json` lives)
4. Leave **Framework Preset** as **Other** — `vercel.json` handles both builds
5. Click **Deploy** (it will fail the first time because env vars are not set — that's expected)

### Option B — Vercel CLI

```bash
cd leadforge-ai          # must be in the directory that contains vercel.json
vercel                   # follow the interactive prompts
vercel --prod            # promote to production once env vars are configured
```

---

## Step 4 — Set environment variables in Vercel

Go to your project in the Vercel dashboard → **Settings → Environment Variables**.
Add every variable below. Set the **Environment** to **Production** (and
optionally Preview) for each one.

### Required — will not start without these

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (pooled mode) | `postgresql://user:pass@host/db?sslmode=require` |
| `OPENAI_API_KEY` | OpenRouter API key (`sk-or-v1-...`) — routes to GPT-4o-mini | `sk-or-v1-xxxxxxxx` |
| `FRONTEND_URL` | Your Vercel frontend URL — used by CORS and OAuth callbacks | `https://leadforge-ai.vercel.app` |
| `BACKEND_URL` | Same domain — used for OAuth callback redirect URIs | `https://leadforge-ai.vercel.app` |

> `FRONTEND_URL` and `BACKEND_URL` are the **same** URL on Vercel because both
> the frontend and backend share one deployment domain.

### Email outreach (choose one path)

**Gmail OAuth2 (recommended)**

| Variable | Description |
|----------|-------------|
| `GMAIL_CLIENT_ID` | From Google Cloud Console → OAuth 2.0 Client |
| `GMAIL_CLIENT_SECRET` | Same OAuth 2.0 Client |
| `GMAIL_REFRESH_TOKEN` | Generated via the Gmail OAuth playground |
| `GMAIL_SENDER_EMAIL` | The Gmail address to send from |

**SMTP / App Password (simpler)**

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | Gmail App Password (16-char, no spaces) |

### Lead discovery APIs (optional but recommended)

| Variable | Description |
|----------|-------------|
| `APOLLO_API_KEY` | Apollo.io API key — enables real lead search |
| `HUNTER_API_KEY` | Hunter.io API key — email finder |
| `CLEARBIT_API_KEY` | Clearbit API key — lead enrichment |

> Without these, the Discovery Agent falls back to AI-generated fictional leads.

### Site deployment (Developer Agent → Vercel)

| Variable | Description |
|----------|-------------|
| `VERCEL_TOKEN` | Vercel API token — Settings → Tokens |
| `VERCEL_TEAM_ID` | Optional — your Vercel team slug (e.g. `team_abc123`) |

### OAuth platform connections (optional)

| Variable | Description |
|----------|-------------|
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` | Already set above |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn Developer App |
| `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET` | Meta Developer App |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App |

### Frontend variable (leave UNSET on Vercel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Do not set this on Vercel.** Leave it unset so the frontend uses relative `/api/*` paths that Vercel routes to the serverless function. Set it only in `frontend/.env.local` for local development. |

---

## Step 5 — Redeploy

After setting all environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or click **Redeploy** in the Vercel dashboard.

---

## Step 6 — Set OAuth callback URLs

Once deployed, update the OAuth callback URL in each provider's developer
console to:

```
https://<your-domain>.vercel.app/api/oauth/callback/<platform>
```

Examples:
```
https://leadforge-ai.vercel.app/api/oauth/callback/gmail
https://leadforge-ai.vercel.app/api/oauth/callback/linkedin
https://leadforge-ai.vercel.app/api/oauth/callback/github
https://leadforge-ai.vercel.app/api/oauth/callback/instagram
```

---

## Verify the deployment

```bash
# Health check
curl https://<your-domain>.vercel.app/api/health
# → {"ok":true,"env":"vercel"}

# API index
curl https://<your-domain>.vercel.app/api
# → {"name":"LeadForge AI API","version":"1.0.0","docs":"/api/api-docs"}

# Interactive API docs
open https://<your-domain>.vercel.app/api/api-docs
```

---

## Local development (unchanged)

```bash
# Terminal 1 — backend
cd leadforge-ai/backend
cp .env.example .env          # fill in your values
npm run dev                   # starts on http://localhost:4000

# Terminal 2 — frontend
cd leadforge-ai/frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                        # starts on http://localhost:1101
```

---

## What does NOT work in the serverless environment

| Feature | Reason | Alternative |
|---------|--------|-------------|
| IMAP inbox monitoring | Persistent TCP connections are not supported in serverless functions | Run a separate long-lived worker (Railway, Fly.io, or a VPS) |
| SSE build progress stream (`/api/build/:id/stream`) | Streaming responses time out after ~25 s on Vercel Hobby | Upgrade to Vercel Pro, or poll `/api/build/:id/status` instead |
| Desktop IDE opener (`/desktop/*`) | Opening local apps has no meaning in a cloud environment | Use locally only |
| Writing generated sites to disk | The serverless filesystem is ephemeral and read-only | Store generated file content in the database (Project.buildLog or a new `files` Json field) |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `CORS error` in browser | `FRONTEND_URL` not set or wrong | Set `FRONTEND_URL=https://your-domain.vercel.app` in Vercel env vars |
| `PrismaClientInitializationError` | `DATABASE_URL` missing or unreachable | Check the connection string and ensure your DB allows connections from `0.0.0.0/0` |
| `500` on all `/api/*` routes | Missing `OPENAI_API_KEY` or bad DB | Check Function Logs in Vercel dashboard |
| OAuth redirect loops | `BACKEND_URL` not set | Set `BACKEND_URL=https://your-domain.vercel.app` |
| Build fails with `Cannot find module` | `vercel.json` `includeFiles` missing a path | Add the missing path to the `includeFiles` array in `vercel.json` |
