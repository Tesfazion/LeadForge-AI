# BYOK, accounts, and billing setup

## Accounts and workspaces

LeadForge uses Supabase Auth for email/password sign-up and sign-in, and creates
one workspace per Supabase user. To configure it:

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the project, open **Project Settings → API** (or **API Keys**, depending
   on the dashboard version). Copy the **Project URL** and the **anon/public**
   key. A `sb_publishable_...` key is also suitable; never use a secret or
   service-role key in the browser.
3. Add the Project URL and public key to `frontend/.env.local` as
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add the same
   values to `backend/.env` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4. In **Authentication → URL Configuration**, set the Site URL to
   `http://localhost:1101` and add `http://localhost:1101/**` to the redirect
   URLs for local development. For deployment, add the deployed frontend URL
   and its callback path there as well.
5. In **Authentication → Providers → Email**, enable email/password sign-in
   and allow new users to sign up. Email confirmation can remain enabled;
   users must follow the confirmation link before signing in.
6. Restart both servers after changing environment files.

The public key is intentionally used for client sign-in and backend token
verification. Do not put a Supabase service-role/secret key in the frontend or
use it to verify user sessions. The generated-site provisioning integration's
optional service-role key is separate.

Existing lead, conversation, message, and project rows are intentionally left
unassigned by the workspace migration. They remain hidden from new accounts
until an administrator explicitly maps them to an owner. Do not assign legacy
rows to the first account automatically.

If migrating from Clerk, the database migration preserves existing workspace
rows and renames their identity column. Clerk user IDs are not Supabase user
IDs, so existing workspace ownership needs an explicit, verified user-ID
mapping before those workspaces can be accessed by Supabase accounts.

For a database that already contains the pre-workspace schema but has never
used Prisma Migrate, back it up and verify it matches the initial migration.
Then mark that baseline as applied before deploying the workspace migration:

```powershell
cd backend
npx prisma migrate resolve --applied 20260617000000_initial_schema
npm run prisma:migrate
```

For a fresh database, run `npm run prisma:migrate` to apply all migrations.
Do not run the baseline command against an empty database.

## Bring your own AI key

The workspace settings page accepts an OpenRouter API key. The server encrypts
it with AES-256-GCM and never returns the secret. Generate a persistent
32-byte encryption key and configure it as base64 in `AI_KEY_ENCRYPTION_KEY`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Keep this encryption key backed up and stable. Changing it makes existing
workspace keys undecryptable. If a workspace key is saved, it takes precedence
over `OPENAI_API_KEY`; removing it restores the optional server-managed
fallback. If neither key exists, AI requests return a configuration error.
If an OpenRouter key was ever committed in project documentation or code,
revoke it and issue a replacement before using the integration.

Generate a separate, persistent random secret of at least 32 characters for
`OAUTH_STATE_SECRET`. It signs OAuth state so callbacks cannot select another
workspace. The secret and provider credentials must only be configured in
server environment settings, never committed to source control.

## Payments

Stripe is setup-only. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`STRIPE_PRICE_ID` are recognized for configuration readiness, but LeadForge
does not yet create checkout sessions, process webhooks, manage subscriptions,
or store payment methods. The UI clearly reports billing as inactive and no
customers can be charged.

## Deployment notes

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the
  frontend deployment; set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`,
  `AI_KEY_ENCRYPTION_KEY`, and `OAUTH_STATE_SECRET` in the backend deployment.
- Configure the Supabase Auth Site URL and allowed redirect URLs for the
  deployed frontend, and set the API's `FRONTEND_URL` / `BACKEND_URL`.
- Apply Prisma migrations before serving authenticated API traffic.
- Email inbox monitoring is disabled until mailbox credentials and stored
  connections are workspace-specific. Existing process-wide mailbox settings
  must not be used for multiple customer workspaces.
