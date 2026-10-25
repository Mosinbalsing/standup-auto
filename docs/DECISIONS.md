# Implementation decisions

- Migrated the original zero-dependency prototype to the user's documented React + Vite + TypeScript frontend and Express backend.
- Preserved the approved visual tokens, glass cards, beams, stacking notifications, and account-scoped data model.
- Used feature folders, typed fetch, TanStack Query hooks, React Router, Tailwind and owned shadcn-style/Radix controls.
- Kept business rules and security logic intact while moving them into services and shared utilities.
- Retained SQLite for no-cloud local development and Supabase for persistent Vercel storage.
- Kept frontend TypeScript strict; enabled backend null checking while preserving flexible payloads in the existing document/GitHub adapters. These can be narrowed without changing the API later.
- Runtime dependencies are declared normally and locked to npm registry artifacts. The local package cache was used to install when external npm access was unavailable; it is not part of the application.
- No AI service, automatic posting, extra state library, or paid recurring job service was added.
