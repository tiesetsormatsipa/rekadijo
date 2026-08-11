# RekaDijo AI Handover

## Required Rule For Every AI Model

Before changing this project, read this file first. Keep it updated as work progresses:

- Add newly discovered bugs, risks, and improvement opportunities here.
- Remove or move items once they are successfully completed and verified.
- Record verification commands and their outcomes.
- Do not restart by scanning the whole project unless this file is clearly stale or incomplete.
- Preserve RekaDijo's product nature: an Uber Eats-style food marketplace with a quotation-first separator for bulk, catering, events, and vendor-negotiated orders.

## Current Focus

Stabilize the codebase first, then improve platform quality in ways that fit the product: buyer discovery, branch-aware fulfillment, quotation-to-payment flow, vendor operations, driver dispatch, admin controls, mobile usability, and trust/legal readiness.

## Product Direction From Owner

- UI/UX should move much closer to Uber and Uber Eats: clean, fast, location-aware, mobile-first, familiar marketplace flows, strong search/map/cart/order-tracking ergonomics, and polished admin/vendor dashboards.
- Search and discovery must treat each restaurant branch/location as its own nearby business listing, like Uber Eats does. Example: KFC should not appear once as "KFC" and then make the buyer open it to see three locations. If three KFC branches support delivery to the buyer's area, search should show three nearby KFC listings ordered by proximity/availability, each tied to its own branch/location.
- Admin portals should aim for full Uber Eats-style operational maturity: platform oversight, business verification, users, stores/branches, orders, disputes/support, payments, promotions, moderation, drivers, permissions, and analytics should become complete enough for real platform administration.
- Vendor portals must support businesses with multiple positions and roles. Business owners need to define staff roles/permissions and assign them to employees across branches or the whole business, so different staff members can manage menu, orders, quotations, branches, promotions, drivers, analytics, or settings based only on owner-granted permissions.

## Active Bugs

- No active verified bugs after the Next 16 migration pass. Continue treating payment, notifications, storage, realtime tracking, and cross-device cart persistence as production-readiness gaps rather than already-broken behavior.

## Improvement Backlog

- Add real payment gateway integration with webhook reconciliation and idempotent order/payment state transitions.
- Add geocoding/address autocomplete loading strategy with clear fallback when no map provider key is configured.
- Add outbound email/SMS/push notification providers using the existing `Notification` rows as the source of truth.
- Replace local upload storage with S3-compatible object storage for production.
- Add real-time order and driver tracking with WebSockets or a managed realtime provider.
- Add buyer cart persistence across devices instead of relying only on client state.
- Add moderation/admin tooling for reviews, menu media, vendor documents, and support messages.
- Refactor buyer search, map, home discovery, and vendor cards so branch/location listings are first-class results ordered by delivery proximity and availability, while still preserving shared parent-business branding.
- Redesign buyer-facing UI/UX toward Uber Eats quality: dense but clear discovery, quick filters, branch-specific ETA/fees, better cart/checkout flow, map/list switching, order tracking, and mobile bottom-navigation polish.
- Expand admin dashboards toward full platform operations: branch/store oversight, support/disputes, payments/refunds, promotions, driver operations, moderation queues, audit logs, and actionable analytics.
- Complete vendor staff/role management for multi-position teams: owner-defined roles, permission presets, branch-scoped assignments, invitations, activity logs, and permission-gated dashboard screens/actions.
- Add automated tests around quotation status transitions, instant order checkout, promotions, cancellation, branch delivery rules, and permissions.
- Improve mobile performance and UI QA for the Uber Eats-style buyer flows: home, search, map, vendor detail, cart, checkout, order tracking.
- Harden production deployment: backups, migrations runbook, observability, error reporting, rate limiting, and secrets rotation.

## Completed In This Pass

- Initialized the project for a public GitHub push with a `.gitignore` that excludes `.env`, dependency folders, logs, build output, editor state, and TypeScript build info.
- Upgraded Next.js and `eslint-config-next` from 14.x to 16.3.0, and upgraded ESLint to 9.x.
- Replaced the removed `next lint` workflow with the ESLint CLI and flat `eslint.config.mjs`.
- Updated `npm run build` to run lint before `next build`, preserving the old quality gate behavior.
- Updated session cookie helpers for Next 16's async `cookies()` API.
- Migrated `src/middleware.ts` to `src/proxy.ts` to match the Next 16 file convention while preserving dashboard auth gating.
- Set `turbopack.root` in `next.config.js` so Next does not infer the workspace root from a parent/home-directory lockfile.
- Cleaned migration lint issues in global error navigation, dynamic Lucide icon lookup typing, quotation cart item removal, staff action imports, and vendor quotation delivery-fee initialization.
- Added `src/lib/auth-token.ts` and updated middleware to import JWT verification without pulling `bcryptjs` into the Edge runtime.
- Added `src/types/google-maps.d.ts` for the Google Places autocomplete surface used by address forms.
- Added local `addAndSelectAddress` support to `src/lib/address-store.tsx` so searched addresses can be selected immediately.
- Fixed address selector selected-state checks to use `selected.kind === "address"` and `selected.addressId`.
- Fixed nearby vendor discovery to read delivery radius from each `Branch`, matching the Prisma schema.
- Added `.eslintrc.json` and dev dependencies for non-interactive `npm run lint`.
- Fixed lint issues in address components, nearby vendors, map page memo dependencies, and JSX copy escaping.

## Verification Log

- 2026-08-11: `npm run typecheck` failed with address/location/discovery TypeScript errors.
- 2026-08-11: `npm run lint` did not run checks; Next.js prompted to configure ESLint interactively.
- 2026-08-11: `npm run typecheck` passes.
- 2026-08-11: `npm run lint` passes with no warnings or errors.
- 2026-08-11: `npm run build` passes with no Edge runtime bcrypt warning after the auth-token split.
- 2026-08-11: `npx prisma validate` passes.
- 2026-08-11: `npm audit fix` applied safe dependency updates, but `npm audit` still reports 5 vulnerabilities requiring a breaking Next major upgrade.
- 2026-08-11: Browser smoke test passed at `http://localhost:3400`; homepage renders, header address dropdown opens, search/GPS/manage controls appear, and app console has no errors. Screenshot: `smoke-home-address-dropdown.png`.
- 2026-08-11: Final `npm run build` passes after stopping the dev server to avoid `.next` contention. Dev server restarted afterward and returns HTTP 200 at `http://localhost:3400`.
- 2026-08-11: `npm run lint` passes after Next 16 / ESLint 9 flat-config migration.
- 2026-08-11: `npm run typecheck` passes after updating auth cookies for Next 16.
- 2026-08-11: `npm audit` reports 0 vulnerabilities after upgrading to `next@16.3.0` and `eslint-config-next@16.3.0`.
- 2026-08-11: `npm run build` passes on Next 16.3.0 with the proxy migration and explicit Turbopack root.
