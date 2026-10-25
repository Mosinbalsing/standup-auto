# API contract

Base path: `/api`. JSON errors use `{ "error": "Actionable message", "code": "ERROR_CODE" }`.

After sign-in, use the HttpOnly `sa_session` cookie. For every account mutation, send `Origin: APP_ORIGIN` and `X-CSRF-Token` from `/me` or `/workspace`. Never send GitHub tokens from the browser.

| Method | Path                                   | Request / result                                                              |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/health`                              | `{ ok: true }`                                                                |
| GET    | `/me`                                  | Public auth/config status; authenticated user and CSRF token when signed in   |
| POST   | `/demo/login`                          | Same-origin only; creates an isolated sample account when enabled             |
| GET    | `/auth/github`                         | Redirect to GitHub OAuth with state and PKCE                                  |
| GET    | `/auth/github/callback`                | Validate state cookie, exchange code, create session, redirect                |
| POST   | `/logout`                              | Invalidate this session                                                       |
| GET    | `/workspace?date=YYYY-MM-DD`           | Account-owned repositories, activity, draft/version, blockers and sync status |
| POST   | `/repositories/refresh`                | Refresh available repositories; preserves selection where still authorized    |
| PUT    | `/repositories`                        | `{ selected: [repositoryId] }`, maximum 20 owned IDs                          |
| POST   | `/sync`                                | Start a job; `202 { id }`                                                     |
| GET    | `/jobs/{id}`                           | Owned job: running / succeeded / partial / failed                             |
| GET    | `/standups/{date}`                     | Get or initialize a source-linked daily draft                                 |
| PUT    | `/standups/{date}`                     | `{ version, items: { yesterday, today, blockers }, reviewed }`                |
| GET    | `/weekly?start=YYYY-MM-DD`             | Five daily statuses, reviewed highlights, optional edited recap/version       |
| PUT    | `/weekly`                              | `{ start, version, text }`; version-checked edited recap                      |
| GET    | `/export?date=YYYY-MM-DD&format=plain` | `{ text }` from the saved standup; formats: plain / slack / whatsapp          |
| POST   | `/blockers/dismiss`                    | `{ activityId }`; owned activity only                                         |
| PATCH  | `/settings`                            | `{ timezone, standupTime, workingDays, activityWindow, scheduledSync }`       |
| POST   | `/disconnect`                          | Remove stored token, stop future collection, retain saved standups            |
| POST   | `/demo/reconnect`                      | Reconnect sample account; unavailable for GitHub accounts                     |
| DELETE | `/me/data`                             | `{ confirm: "DELETE" }`; delete account-owned records and clear cookie        |
| POST   | `/jobs/run`                            | Scheduler only: `Authorization: Bearer JOB_SECRET`                            |

## Standup items

Each item contains `id`, `text`, `manual`, and `sourceIds`. An item ID must be unique within the standup; text is 1–2,000 characters. Each section supports at most 100 items. Source IDs and manual status on existing generated items are preserved by the server. New client-created items are manual with no fabricated sources.

Saving a new standup uses `version: 0`. Saving an existing one must use its current version. A stale version returns `409 VERSION_CONFLICT`; reload and reconcile rather than blindly retrying the old payload.

## Settings

`timezone` is a valid IANA timezone. `standupTime` is `HH:mm`. `workingDays` uses JavaScript weekday numbers, Sunday=0 through Saturday=6. `activityWindow` is `yesterday` or `previous-working-day`. Scheduling preferences only take effect when the host runs the worker.

## Errors

- `400`: invalid input; correct it before retrying.
- `401`: missing/expired session, or GitHub reconnection needed.
- `403`: rejected origin or CSRF token; reload from the application origin.
- `404`: record/path not found, including another account's job.
- `409`: version conflict or disconnected integration.
- `413`: JSON body exceeds 150KB.
- `422`: upstream activity exceeds bounded collection size.
- `429`: request or GitHub rate/access limit; retry later or check authorization.
- `502/503`: upstream/database/configuration unavailable; inspect server setup and retry.

Partial repository failures are returned in the job result and sync status, not described as a complete sync. The caller should inspect each repository's status.

## Postman

Import `standup-auto.postman_collection.json`. It contains a sample-account flow without external credentials. Its cookie jar preserves the session; scripts retain CSRF and job IDs as collection variables. Poll the job until terminal before retrieving/saving the draft. The default collection does not delete account data.
