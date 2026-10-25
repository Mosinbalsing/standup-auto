# Verification

## Automated

- npm run typecheck checks frontend and backend.
- npm run build produces the Vite bundle and compiled Express backend.
- npm test runs 11 backend regression tests covering owner isolation, CSRF/origin, OAuth/PKCE, token encryption, version conflicts, source provenance, GitHub pagination, Supabase headers, draft preservation, recap editing, disconnect/deletion and scheduled retry behavior.

The API regression journey runs the actual Express app on an ephemeral local HTTP port. GitHub and Supabase upstream responses are mocked in their focused tests.

## Browser

The local browser check uses the actual React frontend, Express HTTP server and SQLite database. It verifies sample login, repository opt-in, sync polling, unsaved-navigation confirmation, editor persistence across reloads, saved-format clipboard output, Radix dropdown selection, activity filtering, reviewed recap editing, settings, theme toggles and mobile navigation. Public and signed-in layouts were checked at 320, 390, 768 and 1440px with no horizontal overflow or browser runtime errors.

Local QA scripts/screenshots are in ignored .data; they use the bundled browser runtime on this workstation and are not an application dependency.

## Live services

Local and mocked tests do not prove real GitHub authorization, hosted Supabase operations, production cookies, physical-device accessibility, or deployed end-to-end behavior. Record live checks separately after credentials and deployment are configured.
