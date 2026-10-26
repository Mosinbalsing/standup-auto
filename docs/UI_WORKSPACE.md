# Workspace interaction and theme guidance

Preserve the approved Apple-inspired glass identity, existing system font stack, and lime product brand. Workspace navigation and evidence use a blue accent with clear surfaces in light and dark modes. System appearance follows the OS; explicit light/dark selection persists.

Applied UI/UX Pro Max from https://github.com/nextlevelbuilder/ui-ux-pro-max-skill. Searches on 2026-10-26:
- `glassmorphism productivity dashboard --domain style`: Glassmorphism; SaaS fit, keyboard focus, readable contrast, reduced motion.
- `loading progress feedback --domain ux`: stable skeletons, accessible busy status and meaningful progress.
- `async loading feedback --stack react`: async error handling and non-blocking UI.
The generic design-system palette was not adopted because it did not match the approved product identity.

Use the shared Button loading state for API actions. Start requests from the interaction; do not add artificial delays. Keep errors visible with a retry action. Skeletons reserve workspace space; spinners animate only transform. Respect OS and application reduced-motion settings.

Repository search matches name/description. Select all applies to the current matches and preserves selection outside the search. Selection is saved explicitly. Commit cards show only collected facts: repository, message, short SHA/PR number and timestamp. Detail dialogs link to validated GitHub sources. Activity renders 30 matches initially with an explicit Show more action.
