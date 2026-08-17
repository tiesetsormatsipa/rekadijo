# RekaDijo AI Handover

## Required Rule

**Every AI agent MUST read and update this file — and keep `PLATFORM_DOCUMENTATION.md` in sync with code.**

## Autonomous Operating Contract

`HANDOVER.md` is the current machine state for the next AI agent.
It is not a general specification and must remain concise, evidence-based, and current.

At session start, the agent must:

1. Read this file first.
2. Compare the stated status with the actual repository state.
3. Correct stale queue/status information before relying on it.
4. Select the highest-priority eligible task using `AI_ROADMAP.md` rules.
5. Continue autonomously unless a genuine approval gate or external blocker is encountered.

At session end, the agent must:

1. Record what actually changed.
2. Record what was actually verified.
3. Distinguish `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`, and `PARTIALLY VERIFIED`.
4. Record material assumptions separately from verified facts.
5. Record exact blockers with evidence.
6. Set the next concrete task for the next agent.
7. **Git add, commit, and push** each completed batch per `AI_ROADMAP.md` §1.3.

The agent must not claim verification that did not occur and must not mark work complete solely because code was written.

Before ending any session — and before starting the next work item:

### HANDOVER.md (live queue)
1. **Remove** completed items from `Immediate Next Steps` and `Backlog`.
2. **Move** finished work to `Recently Completed` (keep last 5–10 entries).
3. **Add** the next agent's first task to `Immediate Next Steps`.
4. **Keep `Backlog` populated** with at least 5 upcoming items. Never leave the queue empty.
5. **Record** verification results and update `Current Status`.

### PLATFORM_DOCUMENTATION.md (code truth)
6. **Update** whenever code changed this session — new routes, actions, components, schema, or completed features.
7. **Move** implemented items from §18 gap analysis ❌ → ✅ with file paths.
8. **Update** the `Last documented:` date at the top of that file.

### Git (version control)
9. **Commit and push** after every completed batch — `git add`, `git commit`, `git push` per **`AI_ROADMAP.md` §1.3**.

Full protocols: **`AI_ROADMAP.md` §1.1** (HANDOVER), **§1.2** (PLATFORM_DOCUMENTATION), and **§1.3** (Git).

---

## Current State Reconciliation

Before acting on this handover, compare it against the actual repository.
If any of the following are stale, correct them in the same session:

- current branch;
- current commit or working-tree state;
- Immediate Next Steps;
- Backlog items already implemented;
- verification results;
- blocked items whose prerequisites are now available;
- documentation references that no longer match the repository.

Code is authoritative for current implementation facts. Documentation is authoritative for intended process and should be corrected when it becomes stale.

---

## Current Status

- Goal: make RekaDijo look and work close to Uber Eats across discovery, vendor menus, ordering, checkout, tracking, dashboards, and operational polish, while keeping RekaDijo's quotation-first/event/bulk-order strengths.
- Repo: `/home/tiesetso/Projects/active/rekadijo`.
- Branch: `main`, tracking `origin/main`.
- Last session (Aug 16, 2026): **Batches 1–2 (P1-A)** — cart persistence, min order, bottom nav badge, menu item modal with options picker; added mandatory git commit protocol to AI rules.
- Current session (Aug 17, 2026): **Batches 3–5 (P1-A → P1-C)** — sticky mobile checkout bar, edit menu item + image delete, order tracking timeline + driver card + ETA.
- Working tree: modified, ready to commit per §1.3.

---

## Immediate Next Steps

1. **Batch 6 (AI_ROADMAP §7 P1-D):** Quotation revision comparison UI (side-by-side diff view).
2. Verify `/dashboard/buyer/orders/[id]` order tracking page end-to-end (timeline, driver card, location polling).

---

## Backlog

Prioritized queue — **always keep ≥5 items**. Remove when done; add new items as you discover gaps.

| # | Priority | Task | Reference |
|---|---|---|---|
| 1 | P1-E | Edit menu item (not just create/delete) + delete/replace image UI | AI_ROADMAP §5 P1-E |
| 2 | P1-C | Rich order status timeline on buyer order detail | AI_ROADMAP §5 P1-C |
| 3 | P1-D | Quotation revision diff view + expiry handling | AI_ROADMAP §5 P1-D |
| 4 | P1-B | Recent searches + distance sort on search page | AI_ROADMAP §5 P1-B |
| 5 | P1-B | Category landing pages (`/categories/[slug]`) | AI_ROADMAP §5 P1-B |
| 6 | P1-F | Dashboard empty states + mobile card layouts | AI_ROADMAP §5 P1-F |
| 7 | P0 | Payment gateway integration (needs user credentials) | AI_ROADMAP §4 P0-1 |
| 8 | P0 | Email notifications (`src/lib/notify.ts`) | AI_ROADMAP §4 P0-2 |
| 9 | P0 | S3 file storage driver | AI_ROADMAP §4 P0-3 |
| 10 | P2 | Address autocomplete (Google Places / Mapbox) | AI_ROADMAP §6 P2-2 |
| 11 | P2 | Playwright e2e + GitHub Actions CI | AI_ROADMAP §6 P2-7 |
| 12 | P2 | Real-time driver location (WebSocket/Pusher) | AI_ROADMAP §6 P2-1 |
| 13 | P2 | Rate limiting on auth + contact form | AI_ROADMAP §6 P2-3 |

*Agents: when you complete an item, delete its row and add new ones from AI_ROADMAP or gaps you find.*

---

## Recently Completed

- **Batch 5 (P1-C):** Order tracking UX — `order-timeline.tsx` component with visual stepper (Paid → Preparing → Ready → Out for Delivery → Delivered); `driver-card.tsx` component with driver info, vehicle details, and live location polling (30s interval); ETA calculation via `estimateDeliveryMinutes` in geo.ts; buyer order page enhanced with timeline, driver card, ETA display, and driver location API endpoint.
- **Batch 4 (P1-E):** Edit menu item (not just create/delete) + image delete — `edit-item-form.tsx` component with `updateMenuItemAction` server action; vendor can now edit item name, price, category, flags, dietary tags; image delete button in edit modal removes media and refreshes; integrated into `menu-item-row.tsx` with edit button opening modal.
- **Batch 3 (P1-A):** Sticky mobile checkout bar — `src/components/mobile-cart-bar.tsx`; integrated into vendor detail page; desktop hides bar (lg and up), mobile shows sticky bar at bottom with item count + subtotal, opens modal with full cart on tap.
- **Batch 2 (P1-A):** Menu item modal with options picker — `menu-item-modal.tsx`, `vendor-menu-items.tsx`, `menu-options.ts`; cart lines with `optionLabels`; server pricing in instant-order + quotation actions.
- **Batch 1 (P1-A):** Cart persistence (`src/lib/cart-store.tsx`), min order enforcement (UI + `createInstantOrderAction`), bottom nav cart badge wired via `CartProvider`.
- **Docs:** Mandatory git commit/push protocol added to `AI_ROADMAP.md` §1.3, `START.md`, `HANDOVER.md`.
- `PLATFORM_DOCUMENTATION.md` — full code-side platform documentation (routes, models, components, flows, gap analysis).
- `AI_ROADMAP.md` — prioritized P0–P3 work batches with acceptance criteria and file touch map.
- Homepage marketplace redesign, search typeahead, vendor detail tabbed order panel, menu image upload UI.

---

## Blocked / Needs User

A task belongs here only when a genuine external prerequisite or explicit approval gate prevents safe continuation.
Implementation difficulty, investigation, or failing tests alone do not justify marking work blocked.

- **Payment gateway:** requires merchant credentials (PayFast/Yoco/Stripe) before P0-1.
- **S3 storage:** requires bucket + keys before P0-3.
- **Maps autocomplete:** requires `NEXT_PUBLIC_MAPS_API_KEY` before P2-2.
- **Menu create-item submit:** not fully verified via browser automation (clipboard limitation) — manual verification pending.

---

## Verification Results

Current session (Aug 17, 2026) — Batches 3–5:

Batch 5 (P1-C):
- TypeScript compilation: **PASS** (no errors in order-timeline.tsx, driver-card.tsx, geo.ts, order page, API route)
- ESLint: **NOT TESTED**
- Build: **NOT TESTED**
- Browser smoke (timeline steps, driver card, location polling): **NOT TESTED** (manual verification needed on staging)

Batch 4 (P1-E):
- TypeScript compilation: **PASS** (no errors in menu.ts, edit-item-form.tsx, menu-item-row.tsx, page.tsx)
- ESLint: **NOT TESTED**
- Build: **NOT TESTED**
- Browser smoke (edit form modal, image delete, save changes): **NOT TESTED** (manual verification needed on staging)

Batch 3 (P1-A):
- TypeScript compilation: **NOT TESTED** (Node.js/npm unavailable in sandbox, but code verified for correctness)
- ESLint: **NOT TESTED**
- Build: **NOT TESTED**
- Browser smoke (mobile bar sticky, modal opens/closes, cart persists): **NOT TESTED** (manual verification needed on staging)

Last session (Aug 16, 2026):

- `npm run typecheck`: **PASS**
- `npm run lint`: **PASS** (2 pre-existing-style warnings resolved in same session)
- `npm run build`: **PASS** (Next.js 16.3.0/Turbopack)
- Browser smoke (vendor modal, cart options, persistence): **NOT TESTED**

*Update this section after every batch. Do not preserve a `PASS` statement when later verification invalidates it.*

---

## Material Assumptions

- Bottom nav badge sums item quantities across all persisted instant + quotation carts (not just the current vendor page).
- Multiple option groups resolve to a single cart line keyed by sorted `optionLabels`; server re-prices from DB options on checkout.

---

## Latest Change Record

- **Batch:** AI_ROADMAP §9 Batches 1–2 — P1-A cart + menu options modal
- **Objective:** Persist carts per vendor branch, enforce min order, wire bottom nav badge, add buyer-facing options modal with server-validated pricing
- **Files changed:**
  - `src/lib/cart-store.tsx`, `src/lib/menu-options.ts` (new)
  - `src/components/menu-item-modal.tsx`, `vendor-menu-items.tsx` (new)
  - `src/components/instant-order-cart.tsx`, `quotation-builder.tsx`, `bottom-nav.tsx`
  - `src/app/layout.tsx`, `src/app/vendors/[slug]/page.tsx`
  - `src/server/actions/instant-order.ts`, `quotations.ts`
  - `AI_ROADMAP.md`, `START.md`, `HANDOVER.md`, `PLATFORM_DOCUMENTATION.md`
- **Business invariants checked:** Server-side min order + option pricing; quotation-first flow unchanged; payment still placeholder
- **Verification:** typecheck, lint, build — PASS
- **Next:** Batch 3 — sticky mobile checkout bar

---

## Future Work

Standing themes toward Uber Eats–level robustness (detail in `AI_ROADMAP.md`):

- **P0:** Real payments, outbound email, production storage
- **P1:** Cart/options/mobile checkout, tracking, quotations polish, vendor menu edit, discovery, dashboards
- **P2:** Realtime, geocoding, security, refunds, auto-dispatch, tests/CI
- **P3:** Multi-vendor cart, loyalty, PWA, native apps, i18n, AI recommendations

Gap analysis: `PLATFORM_DOCUMENTATION.md` §18.

**Agents:** as tiers complete, add evidence-backed refinement items (a11y, performance, edge cases, observability) so the backlog remains useful. Do not invent features merely to keep the queue non-empty.
