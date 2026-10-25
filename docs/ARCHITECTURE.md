# Architecture

## Three pieces

1. React + Vite renders the interface. Features own their screens, APIs and TanStack Query hooks.
2. Express routes choose controllers. Controllers validate input, enforce the authenticated owner, and call domain services.
3. The storage adapter implements owner-scoped records in local SQLite or Supabase PostgreSQL.

## Request flow

Browser → feature hook → typed API client → Express session/CSRF middleware → feature controller → service → owner-scoped storage or GitHub → query invalidation → React update.

GitHub sign-in redirects through Express. OAuth state, PKCE and server sessions remain server-owned. OAuth tokens are encrypted at rest. The browser receives a CSRF token and a user-safe profile, never provider/database secrets.

## Frontend state

TanStack Query owns session, workspace, recap and sync-job server state. Mutations invalidate related queries only after success. Editor component state holds unsaved bullets. React Router blocks navigation with an accessible confirmation when a draft is dirty; refresh/close also warns. Conflicting saves return 409 without silently replacing another tab's changes.

## UI

Shared shadcn-style components live in frontend/src/components/ui and use Radix Dialog, AlertDialog and Select primitives. Button variants use class-variance-authority; class merging uses clsx and tailwind-merge. Tailwind utilities coexist with preserved approved CSS tokens. Theme state is persisted locally and applied throughout public and signed-in routes. Lucide navigation/control icons animate using transform/opacity; reduced motion disables these effects.

## Backend features

- auth: OAuth, sample account, session/sign-out.
- github: repository access, opt-in, activity normalization and sync.
- standup: provenance-preserving editing, conservative generation, export and blocker dismissal.
- dashboard: aggregate workspace response.
- weekly: reviewed-day aggregation and versioned edited recaps.
- settings: preferences, disconnect and account-data deletion.

Controllers own transport logic. Services do not know React or routing. Schemas validate request boundaries. Shared security, date and database helpers remain outside features.

## Storage

A versioned records table stores user, integration, repository, activity, standup, recap, dismissal, session, oauth, job and sync records. Every application read/write supplies an owner; the only global lookup is the hashed session token. Existing data layout is preserved during the framework migration. Supabase RLS is enabled with no browser grants; Express enforces account authorization through the server-only key.

## Deployment

Local development uses Express + Vite middleware on one origin. A standard Node host serves the compiled frontend. Vercel serves static Vite output and api/[...path].ts initializes Express with Supabase. Serverless sync waits for completion before responding so work is not left running after an invocation freezes. A future queue is needed for workloads beyond the function time limit.
