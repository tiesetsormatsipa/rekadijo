# RekaDijo — AI Development Roadmap

> **Purpose:** This document tells an AI agent (or human developer) exactly what to build next, what to improve, where to touch code, and how to verify work — without breaking RekaDijo's quotation-first identity.
>
> **Companion docs:**
> - `PLATFORM_DOCUMENTATION.md` — **authoritative code reference; MUST be updated when code changes** (see §1.2)
> - `HANDOVER.md` — **live project memory; MUST be updated after every batch** (see §1.1)
> - `README.md` — setup, deployment, seed accounts

---

## 1. Rules for AI Agents Working on This Repo

### Must follow

1. **Read `node_modules/next/dist/docs/`** before writing Next.js code — this project uses Next.js 16 with breaking changes vs older versions.
2. **Keep the quotation-first model.** Do not remove or bypass the quotation state machine in `src/lib/quotation.ts`. Payment must stay gated behind buyer acceptance for quotation orders.
3. **All app-initiated DB writes go through Server Actions** in `src/server/actions/`. External webhook handlers are the permitted exception for provider callbacks; they must still enforce authentication/signature verification, idempotency, validation, and authorization of the resulting state change. Do not add a general REST API layer unless explicitly requested.
4. **Check RBAC** on every new mutating action via `hasPermission()` in `src/lib/rbac.ts`.
5. **Match existing conventions:** Tailwind tokens (`charcoal`, `cream`, `amber`), `ActionResult` patterns, `toast` from sonner, Server Components for data fetch.
6. **Minimize scope.** One focused batch per PR/commit. Do not refactor unrelated files.
7. **Maintain `HANDOVER.md` after every batch** — this is mandatory, not optional. See [§1.1 HANDOVER.md maintenance protocol](#11-handovermd-maintenance-protocol-mandatory).
8. **Maintain `PLATFORM_DOCUMENTATION.md` when code changes** — this is mandatory, not optional. See [§1.2 PLATFORM_DOCUMENTATION.md maintenance protocol](#12-platform_documentationmd-maintenance-protocol-mandatory).
9. **Commit and push after every batch** — this is mandatory, not optional. See [§1.3 Git commit protocol](#13-git-commit-protocol-mandatory).

## 1.0 Autonomous Execution Protocol

This repository is designed to support autonomous AI engineering with minimal user intervention.
The AI is expected to act as an engineering agent, not as a passive instruction executor.

### 1.0.1 Mandatory autonomous loop

For every work session, the AI MUST follow this sequence:

1. Read `HANDOVER.md` first.
2. Read the relevant sections of `AI_ROADMAP.md`.
3. Read the relevant sections of `PLATFORM_DOCUMENTATION.md`.
4. Inspect the actual repository, configuration, installed dependencies, and current code before making assumptions.
5. Reconcile documentation with the actual repository state if they disagree.
6. Select the highest-priority eligible task according to the prioritization rules below.
7. Check prerequisites, dependencies, security implications, affected business invariants, and likely regression surfaces.
8. Implement the smallest complete safe change.
9. Run the required verification suite.
10. If verification fails, diagnose the underlying problem, fix it, and re-run verification.
11. Update all affected documentation in the same session.
12. Update `HANDOVER.md` with evidence, status, blockers, and the next task.
13. **Git add, commit, and push** the batch per [§1.3](#13-git-commit-protocol-mandatory).
14. Select the next eligible task automatically when the current environment permits continued work.

The AI MUST NOT require the user to restate instructions that are already defined in this repository documentation.

### 1.0.2 Autonomous decision rule

The AI MUST NOT ask the user for clarification when a safe decision can be made from:

- the actual repository;
- existing documentation;
- established project conventions;
- existing architecture;
- acceptance criteria;
- standard engineering practice.

When a decision can be made safely, make it, document the assumption when material, and continue.

The AI MAY ask for user input only when:

1. required credentials or secrets are unavailable;
2. a material product or business decision cannot be inferred safely;
3. an irreversible or high-risk operation requires authorization;
4. repository requirements materially contradict one another and cannot be reconciled safely;
5. a legal, compliance, financial, or ownership decision requires an explicit human owner.

### 1.0.3 Repository truth rule

The AI MUST NOT assume that a route, file, function, model, enum, dependency, environment variable, integration, or feature exists.
It MUST verify the actual repository before using or documenting it.

Never document an implementation that was not verified in the actual codebase.
Never mark a feature implemented merely because the intended code was written.
A feature is implemented only when its acceptance criteria and required verification are satisfied.

### 1.0.4 Source-of-truth hierarchy

When sources disagree, use this precedence:

1. Actual executable code and database schema
2. Automated tests and verification evidence
3. `AI_ROADMAP.md` for intended work and operating rules
4. `HANDOVER.md` for current session state and queue
5. `PLATFORM_DOCUMENTATION.md` for documented current-state reference
6. `README.md` for setup and deployment guidance
7. AI assumptions

If the code contradicts documentation, trust the code for current-state facts, correct the documentation, and do not silently change working behavior solely to make the code match stale documentation.

### 1.0.5 Definition of Done

A task is DONE only when all applicable conditions are satisfied:

- implementation is complete;
- TypeScript/typecheck passes;
- lint passes;
- production build passes;
- relevant automated tests pass;
- affected UI or API paths have been verified;
- relevant business flow has been verified;
- authorization and ownership checks have been verified;
- validation and error handling have been verified;
- no known regression has been introduced;
- `PLATFORM_DOCUMENTATION.md` is updated when required;
- `HANDOVER.md` is updated;
- batch is committed and pushed per §1.3;
- acceptance criteria are explicitly satisfied.

A task is NOT complete because the code appears correct.

### 1.0.6 Verification integrity rule

The AI MUST NEVER obtain a green verification result by weakening the verification itself.
It MUST NOT:

- disable or skip failing tests;
- weaken assertions merely to pass;
- suppress TypeScript errors solely to bypass a failure;
- add `any` solely to bypass type safety;
- disable lint rules without a justified repository-level reason;
- hide console errors;
- remove functionality merely because it caused a test to fail;
- change acceptance criteria after implementation to make a failure disappear.

Fix the underlying cause instead.

### 1.0.7 Failure recovery protocol

When a check fails:

1. Identify the exact failing command, test, route, or behavior.
2. Determine whether the failure was introduced by the current change.
3. Reproduce the failure when practical.
4. Inspect the smallest safe root cause.
5. Fix the root cause.
6. Re-run the failed check.
7. Re-run all previously passing checks affected by the fix.
8. Repeat until verification passes or the issue is genuinely external and blocked.

Never mark a task complete while its mandatory verification is failing.

### 1.0.8 Regression rule

Before changing shared code, identify its known consumers.
After changing shared code, verify both the target feature and directly dependent flows.

At minimum, consider:

- shared layout/navigation;
- authentication and RBAC;
- database mutations;
- quotation/order/payment flows;
- mobile rendering;
- shared components and utilities.

Existing functionality must not be broken in exchange for completing a new feature.

### 1.0.9 Scope control rule

- Fix issues directly required for the current task.
- Fix small, clearly safe blockers that prevent verification.
- Do not start unrelated refactors during a focused batch.
- Record unrelated discoveries in `HANDOVER.md` Backlog.
- Security, privacy, authorization, data-integrity, and payment vulnerabilities override normal scope boundaries and must be addressed or explicitly blocked before continuing normal work.

### 1.0.10 Human approval gates

The AI may work autonomously by default, but MUST obtain explicit user approval before:

- production deployment;
- deleting production data;
- destructive database migrations;
- credential rotation or secret replacement;
- changing payment provider;
- changing legal or compliance policy content;
- purchasing infrastructure or paid services;
- changing domain/DNS configuration;
- sending real external communications at scale;
- executing irreversible financial operations;
- changing core business rules that are not already specified in this repository.

Lack of approval for one gated operation does NOT block unrelated work that can safely continue.

### 1.0.11 Dependency governance

Before adding or upgrading a dependency, the AI MUST:

1. Check whether the existing dependency set already provides the required capability.
2. Prefer existing project libraries and native platform capabilities.
3. Verify compatibility with the installed framework/runtime versions.
4. Avoid major-version upgrades during unrelated work unless required.
5. Add the smallest necessary dependency.
6. Run the verification suite after dependency changes.
7. Update documentation when dependency architecture changes.

### 1.0.12 Database safety rules

Before changing `prisma/schema.prisma`:

1. Inspect affected models and relationships.
2. Confirm that the migration is actually necessary.
3. Prefer additive, backward-compatible changes.
4. Preserve existing data unless destruction is explicitly authorized.
5. Update seed data when required for development correctness.
6. Generate the Prisma client after schema changes.
7. Run migrations in development and verify affected actions/queries.
8. Document material migration implications in `HANDOVER.md`.

NEVER run destructive resets or destructive production data operations as part of ordinary development.

In particular, never use `prisma migrate reset`, `DROP DATABASE`, destructive table drops, or destructive data migrations against production without explicit authorization.

### 1.0.13 Security override

Security, authorization, privacy, and data-integrity issues take precedence over normal feature scope.

If the AI discovers privilege escalation, unauthorized record access, credential exposure, insecure file handling, authentication bypass, payment manipulation, or similar high-severity defects, it must prioritize containment and remediation before returning to ordinary feature work.

### 1.0.14 State-machine rule

For every business-critical state transition, verify:

1. current state;
2. allowed transition;
3. actor authorization;
4. required prerequisites;
5. side effects;
6. notification requirements;
7. payment implications;
8. audit implications.

Every newly introduced business-critical transition must be covered by automated tests where the repository test infrastructure permits.

### 1.0.15 Server-authoritative trust boundary

The client MUST NOT be trusted for authoritative business values.
The server must re-fetch and validate authoritative values before committing mutations.

This applies especially to:

- prices;
- discounts;
- delivery fees;
- totals;
- permissions;
- ownership;
- payment status;
- order/quotation status;
- availability;
- vendor/business identity.

### 1.0.16 Idempotency rule

Any operation that may be retried must be safe to execute more than once.
This applies especially to payments, webhooks, order creation, quotation actions, notifications, refunds, driver assignment, file uploads, and external API calls.
Duplicate requests must not create duplicate financial or business effects.

### 1.0.17 External knowledge rule

When implementation depends on behavior that may have changed:

1. inspect the installed package/runtime version;
2. use the official documentation for that version where available;
3. do not rely on memory for version-sensitive APIs;
4. record material version-specific implementation decisions when they affect future maintenance;
5. do not upgrade dependencies merely to solve a problem unless the upgrade is justified.

### 1.0.18 Honest status vocabulary

Use these verification statuses consistently in `HANDOVER.md`:

- `PASS` — verified successfully with evidence;
- `FAIL` — verification was attempted and failed;
- `BLOCKED` — verification cannot proceed because of a genuine external prerequisite;
- `NOT TESTED` — not attempted;
- `PARTIALLY VERIFIED` — some acceptance criteria or paths were verified but not all.

The AI MUST NOT claim a test, deployment, integration, browser flow, or external service works when it was not actually verified.

### 1.0.19 Definition of blocked

A task is `BLOCKED` only when:

- required credentials/secrets are unavailable;
- an external service required for the task is inaccessible;
- a required infrastructure dependency does not exist;
- a necessary human business/legal/compliance decision genuinely cannot be inferred;
- repository/tooling access required for the task is unavailable.

A task is NOT blocked merely because implementation is difficult, investigation is required, tests currently fail, or the correct implementation has not yet been found.

### 1.0.20 Investigation rule

When an implementation problem occurs:

1. inspect existing code;
2. inspect relevant documentation;
3. inspect dependencies/configuration;
4. reproduce the issue where practical;
5. attempt the smallest safe fix;
6. re-run verification.

If a genuinely unresolved external blocker remains, record precise evidence and move to the next independent eligible task instead of repeatedly asking the user for the same information.

### 1.0.21 Dynamic prioritization

The default batch order may be overridden when:

1. a security, privacy, payment, or data-integrity problem exists;
2. a production blocker is discovered;
3. a task blocks multiple downstream tasks;
4. a regression needs urgent repair;
5. a prerequisite task is missing;
6. required credentials become available;
7. a completed change makes another task obsolete.

Priority order is generally:

`Security/Data Integrity → Production Blocker → Dependency/Regression Blocker → P0 → P1 → P2 → P3 → Evidence-backed refinement`

### 1.0.22 Backlog generation rule

The backlog must remain populated, but AI agents MUST NOT invent work merely to avoid an empty queue.
New backlog items must be justified by at least one of:

- an observed defect;
- a documented gap;
- a missing acceptance criterion;
- a security/reliability issue;
- a measurable UX/performance improvement;
- a required architecture or infrastructure prerequisite.

At least five legitimate items should normally remain available, but backlog quality is more important than backlog quantity.

---

### 1.1 HANDOVER.md maintenance protocol (MANDATORY)

**Every AI agent MUST update `HANDOVER.md` before ending a session** — even if the user did not ask for it. Treat `HANDOVER.md` as the live project memory that the next agent reads first.

#### When to update

- ✅ After completing any work batch (feature, fix, refactor, doc update)
- ✅ After verification (pass or fail)
- ✅ When you discover new gaps, bugs, or ideas during implementation
- ✅ When you block on missing credentials, tooling, or user decisions
- ✅ At the start of a session — read it first, then update "Current Status" if stale

#### What to do on completion

1. **Remove** items from `Immediate Next Steps` and `Backlog` that are fully done — do not leave checked-off work in the active queue.
2. **Move** completed items to `Recently Completed` (keep last 5–10 entries; delete older ones to stay concise).
3. **Add** the next concrete step to `Immediate Next Steps` (exactly what the next agent should do first).
4. **Update** `Current Status` with branch, last commit if known, and what changed this session.
5. **Record** verification results (`typecheck`, `lint`, `build`, browser smoke, automated tests where available) using the status vocabulary in §1.0.18.
6. **Record material assumptions** and distinguish them from verified facts.
7. **Record exact blockers** with evidence when work cannot continue.
8. **Add new backlog items** you noticed while working — see below.

#### Keep the backlog alive (never empty)

The `Backlog` section in `HANDOVER.md` must **always have items**. Uber Eats–level robustness is a moving target; when the queue runs low, add more.

**Sources for new backlog items:**

- Gaps you notice while implementing (missing validation, weak UX, untested path)
- Items from `AI_ROADMAP.md` not yet in `HANDOVER.md` — pull the next P0/P1 task in
- Items from `PLATFORM_DOCUMENTATION.md` §18 gap analysis
- Production hardening: security, a11y, performance, observability, edge cases
- Polish: empty states, mobile layout, error messages, loading skeletons
- Future tiers (P2/P3): realtime, i18n, loyalty, PWA, etc.

**Rule:** If `Backlog` has fewer than 5 legitimate items, add evidence-backed tasks before closing the session. If everything in P1 is done, pull from P2, then P3, then use the continuous-improvement categories in §15 to identify justified work. Do not invent features merely to keep the queue non-empty.

#### What NOT to do

- ❌ Leave completed tasks in `Immediate Next Steps`
- ❌ Empty the `Backlog` without adding next priorities
- ❌ Skip `HANDOVER.md` because "it was a small change"
- ❌ Duplicate long specs — link to `AI_ROADMAP.md` for details; keep `HANDOVER.md` scannable

#### HANDOVER.md section template

Use these sections (see current `HANDOVER.md`):

| Section | Purpose |
|---|---|
| `Required Rule` | Permanent pointer to this protocol |
| `Current Status` | 5–10 bullets: goal, repo, branch, last session summary |
| `Immediate Next Steps` | 1–3 items — what to do **first** next session |
| `Backlog` | 5+ prioritized items — upcoming work queue |
| `Recently Completed` | Last 5–10 finished items (then prune) |
| `Blocked / Needs User` | Credentials, decisions, tooling limits |
| `Verification Results` | Latest test/build/smoke outcomes |
| `Future Work` | Short pointer to `AI_ROADMAP.md` + themes |

#### Sync with AI_ROADMAP.md

- When a batch from `AI_ROADMAP.md` §9 is completed, mark it done in `Recently Completed` and advance to the next batch in `Immediate Next Steps`.
- If you add a new task to `Backlog` that deserves a full spec, add it to `AI_ROADMAP.md` in the appropriate P-tier section too.

### 1.2 PLATFORM_DOCUMENTATION.md maintenance protocol (MANDATORY)

**Every AI agent MUST update `PLATFORM_DOCUMENTATION.md` whenever code changes affect what the doc describes.** This file is the authoritative map of the platform — if it drifts from the code, future agents will build on wrong assumptions.

#### When to update

Update `PLATFORM_DOCUMENTATION.md` in the **same session** as the code change — not later, not "next time":

- ✅ New page or route added under `src/app/`
- ✅ Page removed, renamed, or moved
- ✅ New or changed Server Action (`src/server/actions/`)
- ✅ New or changed shared component (`src/components/`)
- ✅ New or changed lib module (`src/lib/`)
- ✅ Prisma schema change (models, enums, fields)
- ✅ New env variable or external integration wired
- ✅ Feature moved from "missing" to "implemented" (update §18 gap analysis)
- ✅ Core business flow changed (quotation, checkout, auth, etc.)

#### What to update (by change type)

| Change | Section(s) to update |
|---|---|
| New route/page | §5 Route Map + relevant §6–§12 page detail section |
| Removed/renamed route | §5 Route Map — remove old entry; add note if redirected |
| New Server Action | §13 Server Actions Reference table |
| New component | §14 Shared Components table |
| New lib module | §15 Lib Modules table |
| Schema/migration | §3 Data Model (enums, models, relationships) |
| New integration (payment, email, S3) | §17 Placeholders — move from placeholder to implemented; document env vars |
| Feature completed | §18 Gap Analysis — move from ❌ Missing to ✅ Implemented |
| Project structure change | §2 Project Tree Structure |
| New business flow | §16 Core Business Flows |

#### How to update §18 Gap Analysis

This section must stay honest:

1. When you **implement** a gap item → move it to **✅ Implemented** with file locations.
2. When you **partially implement** → keep in ❌ but narrow the description (what's still missing).
3. When you **discover a new gap** while coding → add it to ❌ Missing with suggested approach.
4. Remove items from ❌ only when fully done — do not delete without documenting completion elsewhere.

#### Also update the header

Change the `Last documented:` date at the top of `PLATFORM_DOCUMENTATION.md` to the current date whenever you edit the file.

#### What NOT to do

- ❌ Ship code changes without updating the doc in the same session
- ❌ Leave stale routes or actions in the doc after deletion
- ❌ Mark gaps as done without listing where the code lives
- ❌ Rewrite entire sections unnecessarily — surgical updates only
- ❌ Duplicate `AI_ROADMAP.md` task specs — PLATFORM_DOCUMENTATION describes **what exists**; AI_ROADMAP describes **what to build next**

### 1.3 Git commit protocol (MANDATORY)

**Every AI agent MUST `git add`, `git commit`, and `git push` after completing each batch** — after verification passes and documentation is updated. Treat version control as part of the batch definition of done, not an optional cleanup step.

#### When to commit

- ✅ After completing any work batch (feature, fix, refactor, doc update tied to a batch)
- ✅ After verification passes (typecheck, lint, build at minimum)
- ✅ After `HANDOVER.md` and `PLATFORM_DOCUMENTATION.md` are updated for the batch
- ❌ Do not commit broken or unverified work
- ❌ Do not commit `.env`, credentials, or secrets

#### What to do

1. **Inspect** — run `git status` and `git diff` to confirm only intended files are included.
2. **Stage** — `git add` all files that belong to the batch (code, docs, lockfile changes caused by the batch).
3. **Commit** — write a concise message (1–2 sentences) focused on *why*, matching recent repo style.
4. **Push** — `git push` to the tracked remote branch (`git push -u origin HEAD` if no upstream yet).
5. **Record** — update `HANDOVER.md` `Current Status` with the commit hash or message.

#### Commit message guidance

- Summarize the batch outcome, not every file touched.
- Use prefixes when helpful: `feat:`, `fix:`, `docs:`, `refactor:`.
- Example: `feat: persist instant-order cart and enforce min order at checkout`

#### What NOT to do

- ❌ Leave completed batches uncommitted at session end
- ❌ Combine unrelated batches in one commit
- ❌ Push force to `main`/`master`
- ❌ Skip hooks (`--no-verify`) unless the user explicitly requests it
- ❌ Commit `.env` or secret files

#### Session checklist (docs + git)

Before ending any session with code changes:

```
[ ] HANDOVER.md — status, next steps, backlog, verification (§1.1)
[ ] PLATFORM_DOCUMENTATION.md — routes, actions, components, gaps (§1.2)
[ ] AI_ROADMAP.md — only if you added a new P-tier task or completed a batch spec
[ ] git add → git commit → git push (§1.3)
```

### Session change record

Every completed batch should leave a concise evidence trail in `HANDOVER.md` containing:

- batch/task identifier;
- objective;
- files changed;
- files intentionally not changed when scope was easy to misunderstand;
- verification results;
- business invariants checked;
- documentation updated;
- remaining work or blockers.

This record is for continuity and auditability; it does not replace the detailed project documentation.

#### Sync between docs

| Doc | Role |
|---|---|
| `PLATFORM_DOCUMENTATION.md` | **Truth** — what the codebase contains right now |
| `HANDOVER.md` | **Queue** — what's in progress and what's next |
| `AI_ROADMAP.md` | **Plan** — detailed specs for upcoming work |

When a feature ships: update PLATFORM_DOCUMENTATION (truth) → update HANDOVER (queue) → optionally trim AI_ROADMAP if batch is fully done.

### Verification checklist (run after every batch)

Minimum verification:

```powershell
npm run typecheck
npm run lint
npm run build
npm run dev   # smoke-test affected pages at http://localhost:3400
```

Then, when relevant:

```powershell
# Run the repository's automated tests if a test script exists.
npm test

# Run targeted browser/e2e tests when available for the affected flow.
npm run test:e2e
```

If a command does not exist, record `NOT APPLICABLE` or `NOT TESTED` rather than inventing a passing result.

Seed logins (password `Password@123`): see `PLATFORM_DOCUMENTATION.md` appendix.

### Known tooling blocks (from prior session)

- Vendor menu create-item submit was not fully verified via browser automation (clipboard limitation). Verify manually or with `locator.press()` character-by-character before marking done.
- Git safe-directory may be needed: `git config --global --add safe.directory C:/Users/DELL/Desktop/foody/rekadijo`

---

## 2. North Star

**Goal:** Make RekaDijo look and behave close to Uber Eats for discovery, menus, checkout, and tracking — while **keeping and polishing** the quotation/event/bulk-order differentiator.

**Do not blindly clone Uber Eats.** Preserve:
- Quotation revision workflow
- Payment-after-approval enforcement
- Order size classification (SMALL/MEDIUM/LARGE/BULK)
- Branch-level availability overrides
- Custom vendor staff roles (PBAC)

---

## 3. Priority Tiers

| Tier | Meaning | When to do |
|---|---|---|
| **P0** | Blocks real production launch | First |
| **P1** | Core UX gaps vs Uber Eats | After P0 or in parallel if no infra |
| **P2** | Operational maturity | After P1 |
| **P3** | Premium / scale features | Later |

---

## 4. P0 — Production Blockers

These are placeholders in code today. Each item includes **where to change** and **acceptance criteria**.

### P0-1: Payment gateway integration

**Current state:** `PLACEHOLDER_MANUAL` in `payQuotationAction` and `createInstantOrderAction` marks payments SUCCESS immediately.

**Files:**
- `src/server/actions/quotations.ts` — `payQuotationAction`
- `src/server/actions/instant-order.ts` — `createInstantOrderAction`
- New: `src/lib/payments/` — gateway adapter interface
- New: `src/app/api/webhooks/payments/route.ts` — webhook handler (if gateway requires it)
- `.env.example` — add `PAYMENT_PROVIDER`, gateway keys

**Implementation guidance:**
1. Create `PaymentGateway` interface: `createCheckoutSession()`, `verifyWebhook()`, `refund()`.
2. Start with one SA-friendly provider (PayFast or Yoco) — keep placeholder as fallback when env vars missing.
3. Flow: create Payment as PENDING → redirect/confirm → webhook sets SUCCESS → advance order/quotation status.
4. Never mark SUCCESS before gateway confirmation.
5. Update buyer UI copy in `quotation-actions.tsx` and `instant-order-cart.tsx` — remove "placeholder gateway" toasts.

**Acceptance criteria:**
- [ ] Payment fails gracefully when gateway unreachable
- [ ] Webhook idempotent (duplicate events don't double-charge)
- [ ] Quotation still requires ACCEPTED → PAYMENT_PENDING before pay
- [ ] Receipt shows real provider reference

---

### P0-2: Outbound notifications (email at minimum)

**Current state:** `prisma.notification.create()` everywhere; nothing is sent outside the app.

**Files:**
- New: `src/lib/notify.ts` — `sendNotification(userId, { channel, title, body, linkUrl })`
- Hook into existing notification creation sites (grep for `notification.create`)
- `.env.example` — `EMAIL_PROVIDER`, SMTP or Resend/SendGrid keys

**Priority events to wire first:**
1. Quotation created → vendor
2. Quotation revised → buyer
3. Order status changed → buyer
4. Driver assigned → driver + buyer
5. Contact form → admin email (currently in-app only via `support.ts`)

**Acceptance criteria:**
- [ ] In-app notification still created (don't replace, augment)
- [ ] Email send failure doesn't break the primary action
- [ ] User can still use app if email fails

---

### P0-3: Production file storage (S3-compatible)

**Current state:** `src/lib/storage.ts` throws if `STORAGE_DRIVER=s3`.

**Files:**
- `src/lib/storage.ts` — implement S3 branch using `@aws-sdk/client-s3` or similar
- `.env.example` — `STORAGE_DRIVER`, `S3_BUCKET`, `S3_REGION`, keys

**Acceptance criteria:**
- [ ] Menu item upload works with `STORAGE_DRIVER=s3`
- [ ] Local driver still works for dev
- [ ] MIME + size validation unchanged

---

## 5. P1 — Core UX (Uber Eats Parity)

Work in small batches. Each batch should be independently shippable.

### P1-A: Vendor page & checkout polish (HIGH IMPACT)

**Problem:** Cart is in-memory only (`useState` in `InstantOrderCart`). Options exist in DB but aren't selectable. Mobile checkout is sidebar-based, not sticky bar. `BottomNav` receives `cartCount={0}` always (`layout.tsx` line 74).

| Task | Files | Details |
|---|---|---|
| **Cart persistence** | `src/lib/cart-store.tsx` (new), `instant-order-cart.tsx`, `quotation-builder.tsx` | Persist cart per `businessId+branchId` in localStorage; restore on mount; clear after successful order |
| **Menu item options picker** | New `src/components/menu-item-modal.tsx`, update `vendors/[slug]/page.tsx` | Modal with option groups from `MenuItemOption`; pass `optionsSnapshot` to order/quotation actions |
| **Sticky mobile checkout bar** | New `src/components/mobile-cart-bar.tsx`, `vendor-order-panel.tsx` | Fixed bottom bar on `<lg` showing item count + subtotal; opens full cart drawer |
| **Wire cart count to bottom nav** | `layout.tsx`, `cart-store.tsx`, `bottom-nav.tsx` | Replace hardcoded `cartCount={0}` |
| **Enforce min order amount** | `instant-order-cart.tsx`, `createInstantOrderAction` | Block checkout if subtotal < `business.minOrderAmount`; show clear message |
| **Item detail modal** | Same modal as options | Full description, dietary tags, image gallery, add-to-cart from modal |

**Acceptance criteria:**
- [ ] Refresh vendor page — cart quantities preserved
- [ ] Item with options — selected option reflected in line total and `optionsSnapshot`
- [ ] Mobile: sticky bar visible when cart non-empty
- [ ] Checkout blocked below min order with visible reason

---

### P1-B: Discovery & search improvements

| Task | Files | Details |
|---|---|---|
| **Recent searches** | `src/lib/recent-searches.ts`, `search-bar.tsx` | localStorage, max 8, show in dropdown |
| **Distance sort on search** | `search/page.tsx`, `discovery.ts` | When address set, sort by haversine distance via `rankBranchesByDistance` |
| **Search filters** | `search/page.tsx` | Dietary tags, price range, rating min, delivery vs pickup |
| **Category landing pages** | New `src/app/categories/[slug]/page.tsx` | Dedicated page per business category with vendors + popular items |
| **Homepage address-first** | `page.tsx`, `nearby-vendors-section.tsx` | Prompt location early; hide "near you" until address set; stronger empty state |
| **Map/list parity** | `map-page-client.tsx`, `vendor-map.tsx` | Same filters as search; sync query param `q` |

**Acceptance criteria:**
- [ ] Search with location sorts nearest branch first
- [ ] `/categories/kota-sphatlo` (or slugified) lists relevant vendors
- [ ] Recent search appears after navigating away and back

---

### P1-C: Order tracking UX

| Task | Files | Details |
|---|---|---|
| **Rich status timeline** | `dashboard/buyer/orders/[id]/page.tsx` | Visual stepper: Paid → Preparing → Ready → Out for delivery → Delivered |
| **Driver card on order** | Same page | Show assigned driver name, vehicle, status from `DriverAssignment` |
| **Delivery ETA display** | `src/lib/geo.ts` (new helper), order pages | `estimateDeliveryMinutes(distanceKm)` — simple formula, show range |
| **Live driver map (phase 1)** | New component on buyer order page | Poll driver `currentLat/Lng` every 30s (no WebSocket yet); show on Leaflet mini-map |
| **Notification on status change** | `updateOrderStatusAction`, `updateDriverAssignmentStatusAction` | Ensure notification + email (after P0-2) on each transition |

**Acceptance criteria:**
- [ ] Buyer sees timeline with completed steps highlighted
- [ ] When driver assigned and location set, map pin updates on refresh
- [ ] ETA shown for delivery orders

---

### P1-D: Quotation flow polish (differentiator — improve, don't replace)

| Task | Files | Details |
|---|---|---|
| **Revision comparison UI** | `buyer/quotations/[id]/page.tsx`, `vendor/quotations/[id]/page.tsx` | Side-by-side or diff view of `QuotationRevision` snapshots |
| **Quote expiry handling** | `quotations.ts`, buyer/vendor UI | Cron or check-on-load: PENDING/VIEWED past `expiresAt` → EXPIRED; badge + message |
| **Event/date guardrails** | `quotation-builder.tsx`, `createQuotationAction` | Warn if requested date < lead time; block if in past |
| **Attachment support** | Schema may need `Media` on Quotation; `quotation-builder.tsx` | Allow buyer to attach reference image (event layout, etc.) |
| **Vendor revision UX** | `vendor-quotation-tools.tsx` | Inline item edit, not just message; show running total |

**Acceptance criteria:**
- [ ] Buyer sees what changed between revisions (price/qty diff)
- [ ] Expired quotations can't be paid
- [ ] Requested date before `leadTimeHours` shows warning

---

### P1-E: Vendor operations (menu & branches)

| Task | Files | Details |
|---|---|---|
| **Edit menu item** | New `edit-item-form.tsx`, `menu.ts` action `updateMenuItemAction` | Edit name, price, flags, dietary tags — not just create/delete |
| **Reorder categories/items** | `menu/page.tsx`, new actions | `sortOrder` drag-and-drop or up/down buttons |
| **Delete/replace image** | `menu-item-row.tsx`, `deleteMediaAction` | UI button to remove media (action exists) |
| **Bulk availability toggle** | `branch-availability-panel.tsx` | Toggle all items available/unavailable for a branch |
| **Stock alerts** | Vendor dashboard overview | Surface items below `lowStockThreshold` |

**Acceptance criteria:**
- [ ] Vendor can edit item price without delete/recreate
- [ ] Category order reflects `sortOrder` changes on vendor page
- [ ] Image delete removes from menu row

**Immediate carry-over from HANDOVER.md:**
- [ ] Verify `/dashboard/vendor/menu` create-item submit end-to-end (multipart + image upload)

---

### P1-F: Dashboard UX pass

| Area | Improvements |
|---|---|
| **Buyer** | Empty states with CTAs; active order banner at top; pull-to-refresh pattern |
| **Vendor** | Order/quotation filters (status, branch, date); sound/badge for new pending quotations |
| **Driver** | Active delivery card pinned; one-tap status advance; navigate to pickup/dropoff (maps link) |
| **Admin** | Audit log viewer (`AuditLog` model exists, no UI); bulk actions on verification queue |
| **All** | Mobile table → card layout; loading skeletons match page shape (`dashboard/loading.tsx` exists — extend) |

---

## 6. P2 — Operational Maturity

### P2-1: Real-time infrastructure

- WebSocket or Pusher for: driver location stream, order status push, new quotation alert
- Files: new `src/lib/realtime.ts`, buyer order page, driver dashboard
- Replace 30s polling from P1-C when ready

### P2-2: Address autocomplete

- Integrate Google Places or Mapbox in `address-form.tsx`, `address-selector.tsx`, `vendors/join/onboarding-form.tsx`
- Auto-fill lat/lng; keep manual override
- Env: `NEXT_PUBLIC_MAPS_API_KEY`

### P2-3: Rate limiting & security

- Rate limit auth actions and contact form (`src/server/actions/auth.ts`, `support.ts`)
- CSRF already handled by Server Actions; add upload content scanning if needed
- File upload: validate magic bytes, not just MIME header

### P2-4: Refund automation

- `cancelOrderAction` marks REFUNDED — wire to payment gateway `refund()` when P0-1 done
- Partial refunds for partial cancellations (future)

### P2-5: Driver auto-dispatch

- New: `src/lib/dispatch.ts` — find nearest available driver by haversine
- `assignDriverToOrderAction` — optional auto mode vs manual
- Driver must have `isAvailable: true` and no active DELIVERED-incomplete assignment

### P2-6: Scheduled ordering UX

- `InstantOrderCart` has `isAsap` / `scheduledFor` — improve UI: date/time picker, store closed → force schedule
- Show scheduled time on vendor order list

### P2-7: Automated tests

- Add Playwright e2e: login, browse vendor, add to cart, place instant order (placeholder payment)
- Add unit tests for `quotation.ts` transitions, `geo.ts` distance, `promotions.ts` validation
- CI: GitHub Actions running typecheck + lint + build + e2e

### P2-8: Image optimization

- Remove `unoptimized` from Next.js `Image` where local uploads allow
- Configure `images.remotePatterns` for S3 domain after P0-3

---

## 7. P3 — Premium / Scale (defer until P0–P2 stable)

| Feature | Notes |
|---|---|
| Multi-vendor cart | Complex — separate carts per vendor, single checkout unlikely; consider "order from multiple" as separate orders |
| Group ordering | Shared cart link, split payment — large scope |
| Loyalty / subscription | New models: `LoyaltyAccount`, `Subscription` |
| Surge pricing | Dynamic `DeliveryZone.deliveryFee` by demand |
| PWA / offline | `next-pwa`, service worker for cached vendor menus |
| Native apps | Expo/React Native consuming same Server Actions or thin API |
| AI recommendations | "Popular near you" enhancement using order history |
| i18n | `next-intl` for Afrikaans, Zulu, etc. |

---

## 8. Improvements to Existing Features (bug-adjacent / polish)

These exist but need refinement — good quick wins between larger batches.

| Item | Location | Issue | Fix |
|---|---|---|---|
| Bottom nav cart badge | `layout.tsx:74` | Always 0 | Wire to cart store (P1-A) |
| Quotation builder options | `quotation-builder.tsx` | Options passed but not selectable in UI | Same modal as instant cart |
| `deleteMediaAction` | `menu.ts` | No UI exposure | Add to `menu-item-row.tsx` |
| Driver earnings | `driver/earnings/page.tsx` | Placeholder copy | Compute from completed assignments + tips |
| Admin audit logs | `AuditLog` model | No viewer | P1-F admin section |
| Search sort by distance | `search/page.tsx` | Rating only unless extended | P1-B |
| Vendor page `unoptimized` images | Multiple files | Performance | P2-8 |
| Cookie banner | `cookie-banner.tsx` | No preference storage | Store dismiss in localStorage (may already — verify) |
| Message attachments | `Message.attachmentUrl` | Field exists, UI unclear | Add file upload to `message-thread.tsx` |
| Platform settings | `admin/settings` | JSON editor basic | Validate schema per setting key |
| Error pages | `not-found.tsx`, `global-error.tsx` | Minimal | Add navigation home, search, help links |
| Sitemap | `sitemap.ts` | May miss dynamic vendor slugs | Generate from approved businesses |

---

## 9. Suggested Work Order (for AI agents)

Execute **one batch at a time**, verify, update `HANDOVER.md`, then proceed.

```
Batch 1  → P1-A cart persistence + min order enforcement + cart count in bottom nav
Batch 2  → P1-A menu item modal with options picker
Batch 3  → P1-A sticky mobile checkout bar
Batch 4  → P1-E edit menu item + verify create-item upload
Batch 5  → P1-C order tracking timeline + driver card
Batch 6  → P1-D quotation revision diff + expiry
Batch 7  → P1-B search distance sort + recent searches
Batch 8  → P1-B category landing pages
Batch 9  → P1-F dashboard empty states + mobile layouts
Batch 10 → P0-1 payment gateway (needs env credentials from user)
Batch 11 → P0-2 email notifications
Batch 12 → P0-3 S3 storage
Batch 13 → P2-7 automated tests + CI
... then P2/P3 as needed
```

Adjust order if user provides payment keys early (move P0-1 up).

---

## 10. File Touch Map (quick reference)

When working on a feature, start here:

| Feature area | Primary files |
|---|---|
| Instant checkout | `instant-order-cart.tsx`, `instant-order.ts`, `promotions.ts` |
| Quotations | `quotation-builder.tsx`, `quotations.ts`, `quotation.ts` |
| Vendor menu | `dashboard/vendor/menu/*`, `menu.ts` |
| Branches | `dashboard/vendor/branches/*`, `branch.ts` |
| Discovery | `page.tsx`, `search/page.tsx`, `discovery.ts`, `geo.ts`, `branch-listings.ts` |
| Address/location | `address-store.tsx`, `address-bar.tsx`, `address-selector.tsx`, `geo.ts` |
| Auth/RBAC | `auth.ts`, `auth-token.ts`, `proxy.ts`, `rbac.ts` |
| Orders | `orders.ts`, `dashboard/buyer/orders/*`, `dashboard/vendor/orders/*` |
| Drivers | `driver.ts`, `dashboard/driver/*` |
| Admin | `quotations.ts` (verify/suspend), `dashboard/admin/*` |
| Notifications | grep `notification.create`, new `notify.ts` |
| Payments | `quotations.ts`, `instant-order.ts`, new `payments/*` |
| Storage/uploads | `storage.ts`, any form with `FormData` + file input |

---

## 11. Schema Changes — When Needed

Prefer **no migration** when possible. If required:

| Feature | Likely schema change |
|---|---|
| Quote attachments | `Media` already supports `QUOTATION` owner type — wire UI first |
| Cart (server-side) | New `Cart` / `CartItem` models — only if localStorage insufficient |
| Webhook idempotency | `Payment.providerRef` + unique index on webhook event ID |
| Driver location history | New `DriverLocationPing` model for analytics |
| Push subscriptions | New `PushSubscription` model on `User` |

Always: `npm run db:migrate`, update seed if needed, regenerate client.

---

## 12. What NOT to Do

- ❌ Remove quotation flow or merge it entirely into instant checkout
- ❌ Allow payment before quotation ACCEPTED
- ❌ Add a separate Express/Fastify API without user request
- ❌ Disable branch-level availability checks
- ❌ Hardcode vendor/business IDs (use seed slugs: `tr-matsipa-market`)
- ❌ Commit `.env` or secrets
- ❌ Large bang-refactor of `schema.prisma`
- ❌ Replace Leaflet with Google Maps unless user provides API key and asks for it
- ❌ Remove RBAC checks to "speed up" development
- ❌ Trust client-supplied financial values or permissions
- ❌ Mark work complete without verification evidence
- ❌ Weaken tests or validation to make a check pass
- ❌ Ask the user to choose between safe implementation details that can be resolved from the repository
- ❌ Run destructive database resets or production data operations without explicit authorization

---

## 13. Environment Variables Checklist

Ensure `.env.example` documents all of these as they're wired:

```env
# Existing
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=

# P0 — Payments
PAYMENT_PROVIDER=placeholder   # payfast | yoco | stripe | placeholder
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=

# P0 — Email
EMAIL_PROVIDER=none              # smtp | resend | none
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# P0 — Storage
STORAGE_DRIVER=local             # local | s3
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# P2 — Maps
NEXT_PUBLIC_MAPS_API_KEY=

# P2 — Realtime (optional)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
```

---

## 14. Success Metrics (how to know you're done)

| Milestone | Definition of done |
|---|---|
| **MVP launch** | P0 complete + P1-A through P1-C |
| **Vendor-ready** | P1-E complete; vendor can fully manage menu/branches without workarounds |
| **Uber Eats UX parity** | P1 all complete; a buyer can discover → order → track without confusion |
| **Production hardening** | P0 + P2-3, P2-7 (tests + CI) |
| **Scale-ready** | P2 realtime + caching + S3 + payment reconciliation |

---

*Last updated: August 13, 2026. Sync with `HANDOVER.md` for live session state.*

---

## 15. Autonomous Agent Loop

When the environment allows continued work, agents should operate according to this loop:

```text
READ HANDOVER
  ↓
READ relevant ROADMAP sections
  ↓
READ relevant PLATFORM_DOCUMENTATION sections
  ↓
INSPECT actual repository state
  ↓
RECONCILE stale documentation or assumptions
  ↓
SELECT highest-priority eligible task
  ↓
CHECK prerequisites, dependencies, security, invariants, regression risk
  ↓
IMPLEMENT smallest safe complete change
  ↓
VERIFY typecheck + lint + build + relevant tests + affected flow
  ↓
IF FAILURE → diagnose → fix → verify again
  ↓
UPDATE PLATFORM_DOCUMENTATION when required
  ↓
UPDATE HANDOVER with evidence, blockers, assumptions, next task
  ↓
GIT ADD → COMMIT → PUSH (§1.3)
  ↓
SELECT next task
```

The agent should continue through independent eligible tasks without waiting for the user to restate the queue.
A user request or an approval gate takes precedence over the autonomous queue.

---

## 16. Continuous improvement — keeping work alive forever

Uber Eats–level robustness is not a finite checklist. When P0–P3 batches are done, agents must **keep generating quality work**:

| Category | Example ongoing tasks |
|---|---|
| **Reliability** | Retry logic, idempotency, graceful degradation, offline handling |
| **Performance** | Query optimization, image CDN, caching hot vendor lists, Core Web Vitals |
| **Security** | OWASP pass, dependency audits, penetration fixes, POPIA compliance review |
| **Accessibility** | WCAG 2.1 AA audit, keyboard nav, screen reader labels, focus management |
| **Observability** | Structured logging, error tracking (Sentry), admin health dashboard |
| **Edge cases** | Timezone handling, closed-store scheduling, partial refunds, network failures |
| **UX refinement** | Micro-animations, haptics (PWA), skeleton loaders, optimistic UI |
| **Vendor tools** | Bulk import/export, menu templates, holiday hours, printer integration |
| **Driver tools** | Route optimization, proof-of-delivery photo, earnings statements |
| **Admin tools** | Fraud detection, content moderation queue, platform analytics |

**When adding these:** put them in `HANDOVER.md` Backlog and optionally extend this file's P2/P3 sections. The platform should never become unmanaged or undocumented, but AI agents must continue only with evidence-backed engineering work.

