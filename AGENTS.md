# Working on Standup Auto

- Preserve the approved frontend design and accessibility behavior.
- Use the Ponytail approach: read the callers, reuse existing helpers, add the smallest complete change.
- Use the documented React + Vite + TypeScript frontend and Express backend on Node 24+.
- Frontend features own API functions, TanStack Query hooks, screens, and domain components. Reuse shadcn/ui primitives in components/ui.
- Backend routes wire controllers; controllers validate HTTP inputs; services own business logic. Keep shared security and storage outside features.
- Authenticate every workspace API. Scope database reads and writes to the authenticated account.
- Never send tokens, database secrets, or the encryption key to the browser or logs.
- Keep generated claims grounded in source activity. Plans remain manual; stale PRs are suggestions.
- Do not replace saved edits during sync. Check revisions to prevent stale-tab overwrites.
- Add focused tests for new nontrivial logic. Run `npm test` after backend changes.
- Real GitHub/cloud behavior must be reported separately from mocked verification.
- Do not migrate an unrelated cloud project or publish publicly without the user's instruction.
