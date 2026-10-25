# Deploying Standup Auto

## Vercel

Import this repository with its root directory at the repository root. vercel.json supplies npm ci, npm run build, frontend/dist, the Express function and SPA fallback routes. Node 24 is required.

Configure these **server** variables in the Vercel project:

- NODE_ENV=production
- DATABASE_DRIVER=supabase
- SUPABASE_URL: the selected Supabase project's HTTPS URL.
- SUPABASE_SECRET_KEY: server secret or legacy service_role key. Never use VITE_ for secrets.
- TOKEN_ENCRYPTION_KEY: stable random 32-byte base64 value. Keep it stable across releases.
- GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET: the production OAuth app.
- GITHUB_SCOPE: empty for public repositories; repo for private repositories with broad OAuth scope.
- ALLOW_DEMO=true if a hosted sample account is wanted.
- APP_ORIGIN: the stable HTTPS production origin, with no trailing slash. When omitted on Vercel, the app uses VERCEL_PROJECT_PRODUCTION_URL.
- JOB_SECRET: optional authenticated scheduled-worker secret.

Apply supabase/migrations/001_records.sql to the selected database once. It creates only the namespaced sa_records table, owner index, and backend-only access grants. Inspect existing tables before applying it.

Add the deployed URL as the GitHub OAuth Homepage URL, and its /api/auth/github/callback URL as a redirect URI. Keep the local redirect URI if continuing local development.

The API returns a clear 503 when required production configuration is absent. This is a configuration failure, not a working hosted database. A deployment URL alone does not verify sign-in or persistence.

Vercel deployments retain the account's deployment protection settings. Do not weaken those settings merely to test a deployment. Use authenticated access for verification when protection is enabled.

## Scheduled sync

The existing command npm run sync:due processes eligible users in their timezone. On a persistent Node host, invoke it through the host scheduler. The protected POST /api/jobs/run endpoint is available for a server scheduler using Authorization: Bearer JOB_SECRET. No recurring paid service is created automatically. Scheduled preference alone does not schedule a host job.

Failed/partial daily jobs can retry up to three times per local date. A terminated process can leave a running record; manual retry remains available. This is an MVP job runner, not a durable queue. Vercel invocations finish sync work before returning and are bounded by the function duration.

## Standard Node host

Run npm ci and npm run build. Set production variables and npm start. Use HTTPS and persistent storage if choosing SQLite. Local .data is ignored by Git and is never included in deployment uploads.
