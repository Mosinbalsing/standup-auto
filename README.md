# Standup Auto

Turn selected GitHub activity into daily standups you can review, edit, and copy. Nothing is automatically posted.

## Stack

- **Frontend:** React + Vite + TypeScript, TanStack Query, React Router, Tailwind CSS, shadcn/ui components using Radix primitives, Lucide icons.
- **Backend:** Express 5 + TypeScript, GitHub OAuth with PKCE, encrypted tokens and server sessions.
- **Storage:** SQLite for local development; Supabase PostgreSQL for Vercel.

## Run locally

Install Node.js 24 or newer. Open a terminal in this folder:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

If you already have a .env file, keep it. Open **http://127.0.0.1:5190**. Express serves the API and Vite development middleware on the same port, so cookies and the GitHub callback stay on one origin. Demo mode needs no external credentials. Production: run `npm run build`, configure production variables, then `npm start` on a Node host.

## GitHub sign-in

Register an OAuth App at https://github.com/settings/applications/new. Use homepage `http://127.0.0.1:5190` and redirect URI `http://127.0.0.1:5190/api/auth/github/callback`. Put its Client ID and Client Secret in the root .env as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. Restart the server after editing environment variables. Keep the secret out of browser variables and Git.

An empty `GITHUB_SCOPE` starts with public repositories. Private repositories require OAuth `repo` scope, which grants broader upstream permissions than read-only. The application itself reads metadata; a GitHub App with per-repository read permissions is the recommended later upgrade.

## Folder structure

```text
standup-auto/
  frontend/
    src/
      components/       Shared Header, Sidebar, Loader, and shadcn/ui controls
      features/
        auth/           api, hooks, components, screens
        dashboard/      workspace queries, Home and Activity screens
        standup/        API, mutation hooks, editor, source links
        github/         repository selection, sync APIs and polling
        weekly/         recap API, hooks and screen
        settings/       preferences, theme and privacy controls
      navigation/       React Router and authentication guard
      services/api/     Typed fetch client and TanStack Query client
      theme/            Theme provider and approved visual styles
      hooks/            Shared notifications
      types/            API response and domain types
      utils/            Date helpers and class merging
      App.tsx
      main.tsx
      index.css
    package.json
    vite.config.ts
  backend/
    src/
      config/           Environment and owner-scoped database adapter
      middleware/       Session, CSRF and structured errors
      modules/          auth, dashboard, github, standup, weekly, settings
        <feature>/      routes, controllers, services, schemas
      routes/           API router composition
      jobs/             Sync jobs and scheduled worker
      utils/            Encryption, cookies, dates and validation
      types/            Controller dependency types
      app.ts            Testable Express app factory
      server.ts         Local/Node-host entry point
    package.json
  api/[...path].ts       Vercel Express adapter
  supabase/migrations/  Database schema
  tests/                Backend and API regression tests
  docs/                 Architecture, API, deployment, verification
  .env.example          Root configuration template
  vercel.json
```

The folder layout follows the supplied project documentation. Run `node create-structure.cjs` to recreate optional feature folders. Empty folders are reserved for future implementation, rather than containing dummy files. Frontend data lives in TanStack Query; local component state holds unsaved editing state. There is no extra global store to learn.

## Check your changes

```powershell
npm run typecheck
npm test
npm run build
npm run format:check
```

Frontend TypeScript is strict. Backend modules check nullability and typed Express boundaries; preserved dynamic record and GitHub adapters still use flexible payload types. See docs/VERIFICATION.md for coverage and live-service limitations.

## Main screens

- **Today:** source-linked Yesterday, manual plans, confirmed blockers, reorder/remove/undo, versioned save, reviewed status, saved-text copy formats.
- **Activity:** searchable collected events with repository/type dropdown filters and source dialogs.
- **Repositories:** explicit opt-in, refresh, save and sync.
- **Weekly:** reviewed daily updates, deduplicated highlights, editable recap, copy/download.
- **Settings:** timezone, work days, scheduled-sync preference, light/dark theme, reduced motion, disconnect and delete.

Light/dark appearance is also available in every signed-in page header. Dropdowns and dialogs use Radix keyboard/focus behavior. Animation pauses offscreen and respects reduced-motion preferences.

## Deployment

See docs/DEPLOYMENT.md. The Vercel configuration builds React into frontend/dist and routes /api to Express. Production requires Supabase credentials and a stable token encryption key. Vercel cannot persist a local SQLite database. Local data is not automatically migrated to the hosted database.

## Current boundaries

Rule-based drafts are grounded in GitHub metadata; future plans remain manual. Collection covers default-branch commits, authored PRs and submitted reviews. Sync preserves existing edited drafts. Scheduling needs a host scheduler invoking the worker or authenticated endpoint. Real GitHub, hosted database and deployment verification are recorded separately from mocked tests.
