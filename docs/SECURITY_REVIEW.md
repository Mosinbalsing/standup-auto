# Security verification — 2026-10-26

This is a record of focused checks and limitations, not a guarantee that the application cannot be compromised.

## Corrected
- npm audit reported high-severity body-parser and Zod denial-of-service advisories. The lockfile now uses body-parser 2.4.0, qs 6.16.1 and Zod 4.6.7. A clean install and audit are required before release.
- Security headers previously covered Express responses only. Vercel now applies CSP, frame protection, MIME protection, referrer policy, HSTS and device permission restrictions to frontend pages too.
- Repository refresh now uses version checks, preventing a stale refresh from overwriting a concurrent saved selection. Unchanged rows are not rewritten.

## Tested guarantees
- Account-scoped reads/writes; cross-account job access denied.
- Mutating workspace requests require the authenticated session, same origin and CSRF token.
- OAuth cookie state, PKCE, replay rejection and encrypted token storage.
- Stale revisions rejected; sync preserves saved edits and deleted bullets.
- Repository selection rejects IDs outside the authenticated account.
- Bounded concurrent I/O waits for in-flight writes on error.
- Source links accept HTTPS github.com URLs; React renders messages as text.

Backend tests use isolated SQLite accounts. GitHub refresh regression checks use a local HTTP fixture, not real GitHub authorization.

## Remaining limitations
- Rotate GitHub/Supabase secrets previously shared in chat and replace their Vercel values; none are committed to this repository.
- Current application throttles are per process and reset across serverless instances. A distributed abuse limit or platform firewall rule is advisable before opening public demo creation to broad traffic.
- Public demo accounts can consume database space; add lifecycle cleanup or disable public demos for a wider launch.
- CodeRabbit CLI 0.9.1 was installed, but authentication returned `environment_unsupported`: browser login is unavailable in the isolated environment and an Agentic API key is not provisioned. No CodeRabbit review ran. This limitation was not reported as a passing review.
- No independent penetration test, infrastructure-wide audit or assurance against unknown vulnerabilities was performed.

Dependency advisories: https://github.com/advisories/GHSA-27r3-jxmh-p828 and https://github.com/advisories/GHSA-mrhx-c7xc-m3w5.
