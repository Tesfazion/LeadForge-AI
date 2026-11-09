# LeadForge AI application

This directory contains the LeadForge web application: a Next.js frontend and
an Express API for workspace-based lead management and AI-assisted workflows.
For the complete project overview, screenshots, and setup instructions, start
with the [repository README](../README.md).

## In this directory

| Path | Description |
|---|---|
| [`frontend/`](./frontend/) | Next.js dashboard and public product pages |
| [`backend/`](./backend/) | Express API, Prisma schema, and database migrations |
| [`BYOK_AND_BILLING.md`](./BYOK_AND_BILLING.md) | Supabase Auth, migration, encrypted AI key, and billing setup |
| [`OPENROUTER_CONFIGURATION.md`](./OPENROUTER_CONFIGURATION.md) | OpenRouter configuration |
| [`backend/openapi.yaml`](./backend/openapi.yaml) | API specification |

## Local development

Follow the [repository setup guide](../README.md#get-started) for the frontend,
backend, Supabase, and database migration steps. Use the committed environment
templates as references; keep populated `.env` files local.

## Project status

Supabase Auth and workspace isolation are implemented. Provider-backed AI,
lead discovery, email, and deployment workflows require configuration. Stripe
billing is not active, and workspace-specific inbox monitoring is disabled.
See [capabilities and limitations](../README.md#capabilities-and-limitations)
before deploying.
