# LeadForge AI

**A lead-to-delivery workspace for finding prospects, managing outreach, and turning qualified conversations into websites.**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Auth%20%26%20Data-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

LeadForge AI brings lead management, AI-assisted engagement, and website delivery into one workspace. Teams stay in control of outreach approvals while AI helps with research, drafting, conversation follow-up, and project handoff.

> **Project status:** LeadForge is under active development. Some integrations require provider credentials, billing is not active, and workspace-specific inbox monitoring is not enabled. See [current capabilities](#capabilities-and-limitations) before deploying.

## Contents

- [Product overview](#product-overview)
- [Screenshots](#screenshots)
- [Capabilities and limitations](#capabilities-and-limitations)
- [Workflow](#workflow)
- [Architecture](#architecture)
- [Technology](#technology)
- [Get started](#get-started)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Development and tests](#development-and-tests)
- [Security](#security)

## Product overview

LeadForge is built to help teams move from a new prospect to a clear next step:

1. Organize and qualify leads in a shared workspace.
2. Prepare personalized outreach and keep sending under human approval.
3. Manage prospect replies and extract structured project requirements.
4. Generate and deploy a starter website when a project is ready.

Accounts use Supabase Auth. Each account receives an isolated workspace, and workspace AI credentials are encrypted before storage.

## Screenshots

These are real screenshots captured from the running frontend. The dashboard preview on the public landing page contains illustrative sample content, not live customer data. The sign-in screen is shown separately; no authenticated dashboard data is represented here.

<p align="center">
  <img src="leadforge-ai/docs/screenshots/landing-desktop.png" alt="LeadForge AI public landing page with an illustrative dashboard preview" width="100%">
</p>

<p align="center"><em>Public product overview — desktop</em></p>

<p align="center">
  <img src="leadforge-ai/docs/screenshots/dashboard-sign-in.png" alt="LeadForge AI dashboard sign-in screen" width="100%">
</p>

<p align="center"><em>Dashboard sign-in</em></p>

## Capabilities and limitations

### Available in the application

- Lead, conversation, project, and activity workflows.
- Supabase email/password authentication and workspace-scoped API access.
- AI-assisted outreach and conversation workflows.
- Workspace OpenRouter key settings, encrypted at rest with AES-256-GCM.
- Dashboard preferences and account settings.
- Website generation and Vercel deployment integrations when configured.

### Not active or requiring additional setup

- Stripe billing is configuration scaffolding only; checkout and subscriptions are not enabled.
- Inbox monitoring is disabled until mailbox credentials and stored connections are workspace-specific.
- AI, lead discovery, email, and deployment actions depend on valid provider credentials and configuration.
- Existing records from before workspace isolation are not automatically assigned to new accounts.

## Workflow

```text
Lead → Review and qualify → Draft outreach → Human approval
     → Conversation → Extract requirements → Generate website → Deploy
```

The workflow is designed to keep people in control: outreach is reviewed before sending, and integrations are enabled only when configured.

## Architecture

```text
┌──────────────────────┐       ┌────────────────────────┐
│ Next.js web app      │──────▶│ Express API            │
│ Auth, dashboard, UX  │  REST │ Auth and workspace     │
└──────────────────────┘       │ scoping, AI workflows  │
                               └───────────┬────────────┘
                                           │ Prisma
                               ┌───────────▼────────────┐
                               │ PostgreSQL / Supabase  │
                               └────────────────────────┘
```

- **Frontend:** `leadforge-ai/frontend`
- **Backend:** `leadforge-ai/backend`
- **Database:** PostgreSQL managed through Prisma
- **Authentication:** Supabase Auth
- **AI credentials:** workspace keys are encrypted by the backend; keys are never returned to the frontend

## Technology

| Area | Stack |
|---|---|
| Frontend | Next.js 15, React 18, SWR |
| Backend | Node.js 20+, Express |
| Data | PostgreSQL, Prisma |
| Authentication | Supabase Auth |
| AI | OpenAI-compatible API, including OpenRouter |
| Tests | Node.js built-in test runner |

## Get started

### Prerequisites

- Node.js 20 or later and npm
- A PostgreSQL database
- A Supabase project for authentication

AI, email, lead-source, and deployment credentials are optional for local startup, but required to use their respective integrations.

### 1. Configure Supabase

Create a Supabase project and configure email/password sign-in. Copy the project URL and public anon/publishable key into both environment files as described in [Configuration](#configuration). Add `http://localhost:1101` to the Supabase Auth site and redirect URL settings.

### 2. Configure and start the backend

In PowerShell, from the repository root:

```powershell
cd leadforge-ai\backend
Copy-Item .env.example .env
```

Set the database connection, Supabase URL and public key, and OAuth state secret in `backend\.env`. For a new, empty database:

```powershell
npm install
npm run prisma:migrate
npm run dev
```

The API listens on `http://localhost:4000`. If your database already has the legacy LeadForge schema, **do not** apply the initial migration directly; follow the [database migration instructions](leadforge-ai/BYOK_AND_BILLING.md#accounts-and-workspaces) first.

### 3. Configure and start the frontend

In a second terminal, from the repository root:

```powershell
cd leadforge-ai\frontend
Copy-Item .env.local.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `frontend\.env.local`, then run:

```powershell
npm install
npm run dev
```

Open the app at `http://localhost:1101`.

## Configuration

Environment templates are provided at:

- [Backend `.env.example`](leadforge-ai/backend/.env.example)
- [Frontend `.env.local.example`](leadforge-ai/frontend/.env.local.example)

Keep actual `.env` and `.env.local` files out of version control. The frontend must only contain the Supabase public anon/publishable key; never put a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

For detailed instructions on Supabase Auth, migration baselines, AI key encryption, OAuth state, billing status, and deployment settings, see [BYOK, accounts, and billing](leadforge-ai/BYOK_AND_BILLING.md).

## Documentation

| Guide | What it covers |
|---|---|
| [BYOK, accounts, and billing](leadforge-ai/BYOK_AND_BILLING.md) | Supabase setup, database migrations, encrypted AI keys, billing status, deployment notes |
| [OpenRouter configuration](leadforge-ai/OPENROUTER_CONFIGURATION.md) | OpenRouter and AI-provider configuration |
| [OpenAPI specification](leadforge-ai/backend/openapi.yaml) | API schema for clients and tooling |
| [Backend source](leadforge-ai/backend/) | Express API and Prisma schema |
| [Frontend source](leadforge-ai/frontend/) | Next.js application |

## Development and tests

Run backend tests:

```powershell
cd leadforge-ai\backend
npm test
```

Build the frontend for production:

```powershell
cd leadforge-ai\frontend
npm run build
```

## Security

- Never commit provider keys, database URLs, or populated environment files.
- Store workspace AI keys in the application settings; do not paste them into issues or documentation.
- Keep `AI_KEY_ENCRYPTION_KEY` stable and backed up. Changing it makes existing encrypted workspace keys unreadable.
- Rotate any credential that may have been exposed.
