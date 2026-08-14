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

Full protocols: **`AI_ROADMAP.md` §1.1** (HANDOVER) and **§1.2** (PLATFORM_DOCUMENTATION).

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
- Repo: `C:\Users\DELL\Desktop\foody\rekadijo`.
- Branch: `main`, tracking `origin/main`.
- Last known pushed baseline: commit `15caf45` (`Stabilize marketplace baseline`) on `origin/main`.
- **Documentation (Aug 2026):** `PLATFORM_DOCUMENTATION.md`, `AI_ROADMAP.md` — platform reference + prioritized AI work batches.
- **Next agent:** start with **Immediate Next Steps** below unless user directs otherwise.
- Git safe-directory if needed: `git config --global --add safe.directory C:/Users/DELL/Desktop/foody/rekadijo`.

---

## Immediate Next Steps

1. **Batch 1 (AI_ROADMAP §9):** Cart persistence + min order enforcement + wire `cartCount` in bottom nav (`layout.tsx` currently hardcodes `0`).
2. Verify `/dashboard/vendor/menu` create-item submit end-to-end (multipart image upload) — prior session blocked by browser clipboard; try manual test or `locator.press()`.

---

## Backlog

Prioritized queue — **always keep ≥5 items**. Remove when done; add new items as you discover gaps.

| # | Priority | Task | Reference |
|---|---|---|---|
| 1 | P1-A | Menu item modal with options picker (`MenuItemOption` → buyer UI) | AI_ROADMAP §5 P1-A |
| 2 | P1-A | Sticky mobile checkout bar on vendor page | AI_ROADMAP §5 P1-A |
| 3 | P1-E | Edit menu item (not just create/delete) + delete/replace image UI | AI_ROADMAP §5 P1-E |
| 4 | P1-C | Rich order status timeline on buyer order detail | AI_ROADMAP §5 P1-C |
| 5 | P1-D | Quotation revision diff view + expiry handling | AI_ROADMAP §5 P1-D |
| 6 | P1-B | Recent searches + distance sort on search page | AI_ROADMAP §5 P1-B |
| 7 | P1-B | Category landing pages (`/categories/[slug]`) | AI_ROADMAP §5 P1-B |
| 8 | P1-F | Dashboard empty states + mobile card layouts | AI_ROADMAP §5 P1-F |
| 9 | P0 | Payment gateway integration (needs user credentials) | AI_ROADMAP §4 P0-1 |
| 10 | P0 | Email notifications (`src/lib/notify.ts`) | AI_ROADMAP §4 P0-2 |
| 11 | P0 | S3 file storage driver | AI_ROADMAP §4 P0-3 |
| 12 | P2 | Address autocomplete (Google Places / Mapbox) | AI_ROADMAP §6 P2-2 |
| 13 | P2 | Playwright e2e + GitHub Actions CI | AI_ROADMAP §6 P2-7 |
| 14 | P2 | Real-time driver location (WebSocket/Pusher) | AI_ROADMAP §6 P2-1 |
| 15 | P2 | Rate limiting on auth + contact form | AI_ROADMAP §6 P2-3 |

*Agents: when you complete an item, delete its row and add new ones from AI_ROADMAP or gaps you find.*

---

## Recently Completed

- `PLATFORM_DOCUMENTATION.md` — full code-side platform documentation (routes, models, components, flows, gap analysis).
- `AI_ROADMAP.md` — prioritized P0–P3 work batches with acceptance criteria and file touch map.
- Homepage marketplace redesign, search typeahead, vendor detail tabbed order panel, menu image upload UI.
- Prior verification: typecheck, lint, build passed; browser smoke on home, search, vendor detail.

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

Last known (prior session):

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run build`: passed (Next.js 16.3.0/Turbopack)
- Browser smoke: homepage, search, vendor detail — no app console errors (`PASS`, prior session evidence)

*Update this section after every batch. Do not preserve a `PASS` statement when later verification invalidates it.*


---

## Material Assumptions

Record only assumptions that materially affected implementation or prioritization.
Each entry should state the assumption and whether it remains unverified.

- No material assumptions recorded in this baseline handover.

---

## Latest Change Record

- **Baseline:** Autonomous AI operating rules strengthened on August 13, 2026.
- **Code changes:** None made by this documentation-only update.
- **Verification:** Documentation content reviewed; repository code was not modified by this document update.
- **Next code task:** Batch 1 remains the current implementation target unless repository reconciliation identifies a higher-priority blocker.

---

## Future Work

Standing themes toward Uber Eats–level robustness (detail in `AI_ROADMAP.md`):

- **P0:** Real payments, outbound email, production storage
- **P1:** Cart/options/mobile checkout, tracking, quotations polish, vendor menu edit, discovery, dashboards
- **P2:** Realtime, geocoding, security, refunds, auto-dispatch, tests/CI
- **P3:** Multi-vendor cart, loyalty, PWA, native apps, i18n, AI recommendations

Gap analysis: `PLATFORM_DOCUMENTATION.md` §18.

**Agents:** as tiers complete, add evidence-backed refinement items (a11y, performance, edge cases, observability) so the backlog remains useful. Do not invent features merely to keep the queue non-empty.
