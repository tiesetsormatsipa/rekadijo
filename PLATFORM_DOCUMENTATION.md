# RekaDijo — Platform Code Documentation

> **RekaDijo** (also referred to as BuyFood) is a **quotation-first food delivery platform** by TechTur Solutions. It supports bulk orders, catering, events, and everyday instant ordering where vendors enable it.
>
> This document covers the **code side only**: architecture, file tree, routes, data model, server actions, components, and gaps vs a full Uber Eats–scale platform.
>
> Last documented: August 17, 2026
>
> **For AI agents:**
> - [`AI_ROADMAP.md`](./AI_ROADMAP.md) — what to build next (prioritized batches, acceptance criteria)
> - [`HANDOVER.md`](./HANDOVER.md) — live queue and session status
>
> **Maintenance rule:** You MUST update this file whenever code changes — same session, not later. See `AI_ROADMAP.md` §1.2 for the full protocol (routes, actions, components, schema, §18 gap analysis).

---

## Table of Contents


1. [Architecture Overview](#1-architecture-overview)
2. [Project Tree Structure](#2-project-tree-structure)
3. [Data Model (Prisma)](#3-data-model-prisma)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Route Map — All Pages](#5-route-map--all-pages)
6. [Public Pages (Detailed)](#6-public-pages-detailed)
7. [Auth Pages](#7-auth-pages)
8. [Buyer Dashboard](#8-buyer-dashboard)
9. [Vendor Dashboard](#9-vendor-dashboard)
10. [Driver Dashboard](#10-driver-dashboard)
11. [Admin Dashboard](#11-admin-dashboard)
12. [Shared Dashboard Pages](#12-shared-dashboard-pages)
13. [Server Actions Reference](#13-server-actions-reference)
14. [Shared Components](#14-shared-components)
15. [Lib Modules](#15-lib-modules)
16. [Core Business Flows](#16-core-business-flows)
17. [Placeholders & External Integrations](#17-placeholders--external-integrations)
18. [Gap Analysis — Uber Eats Parity](#18-gap-analysis--uber-eats-parity)

---

## AI Operating Interpretation

This document describes the verified current state of the codebase. It is not the future-work queue.

For AI agents:

- `AI_ROADMAP.md` defines autonomous operating rules and intended future work.
- `HANDOVER.md` defines current session state, queue, blockers, assumptions, and verification evidence.
- This document defines what is verified to exist in the codebase.

### Current-state accuracy rules

1. Never document a route, file, action, model, dependency, environment variable, or integration unless it was verified in the repository.
2. When documentation and code disagree, current executable code/schema wins for current-state facts; correct this document in the same session.
3. Do not mark an incomplete feature as implemented merely because some code exists.
4. Distinguish implemented, partial, placeholder, blocked, and missing behavior.
5. Keep financial, authorization, state-machine, and ownership behavior explicit because these are high-risk areas for autonomous modification.
6. Record material architecture changes, migrations, external integrations, and business-flow changes with their actual implementation locations.

### Verification terminology

Use `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`, and `PARTIALLY VERIFIED` consistently when recording verification evidence in `HANDOVER.md`.

---

## 1. Architecture Overview

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Single codebase, Server Components + Server Actions |
| Language | TypeScript | Strict typing end-to-end |
| Styling | Tailwind CSS 3 | Custom design tokens (`charcoal`, `cream`, `amber`) |
| Database | PostgreSQL + Prisma 5 | Single schema, migrations in `prisma/migrations/` |
| Auth | Custom JWT sessions (`jose`) | HttpOnly cookie, bcrypt password hashing |
| Maps | Leaflet + OpenStreetMap | No API key required |
| Forms | react-hook-form + zod | Validation in server actions |
| Toasts | sonner | Global in root layout |
| Animations | framer-motion | Used selectively in UI |
| Dev port | **3400** | `npm run dev` |

### Architectural Patterns

- **No separate REST/GraphQL API.** Pages fetch data directly via Prisma in Server Components. All app-initiated mutations go through **Server Actions** in `src/server/actions/`. External provider webhooks are a controlled exception and must use signature verification, validation, idempotency, and server-side authorization before changing state.
- **Route protection** via `src/proxy.ts` (Next.js 16 proxy/middleware equivalent) — checks JWT cookie and `GlobalRole` for `/dashboard/*` routes.
- **Quotation state machine** in `src/lib/quotation.ts` — payment is structurally gated behind buyer acceptance.
- **Branch-aware availability** — menu is business-level; per-branch overrides via `BranchItemAvailability`.
- **Location math** — haversine distance in `src/lib/geo.ts`; no external geocoding API.

---

## 2. Project Tree Structure

```
rekadijo/
├── prisma/
│   ├── schema.prisma          # Full data model (40+ models)
│   ├── seed.ts                # Dev seed data (TR. Matsipa Market, roles, promo codes)
│   └── migrations/            # SQL migration history
├── public/
│   └── uploads/               # Local file storage (menu images, etc.)
├── src/
│   ├── app/                   # Next.js App Router — all pages
│   │   ├── layout.tsx         # Root layout (header, footer, bottom nav, address provider)
│   │   ├── page.tsx           # Homepage
│   │   ├── globals.css
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   ├── (auth)/            # Login & register (route group, no URL segment)
│   │   ├── vendors/           # Vendor discovery & detail
│   │   ├── search/            # Food/menu search
│   │   ├── map/               # Interactive vendor map
│   │   ├── how-it-works/      # Quotation explainer
│   │   ├── about/             # About page
│   │   ├── help/              # FAQ + contact form
│   │   ├── legal/             # Legal document suite
│   │   └── dashboard/         # Role-based dashboards
│   │       ├── buyer/
│   │       ├── vendor/
│   │       ├── driver/
│   │       ├── admin/
│   │       ├── messages/
│   │       └── notifications/
│   ├── components/            # Shared UI components (24 files)
│   │   └── ui/                # Primitive UI (button, badge)
│   ├── lib/                   # Core utilities (13 files)
│   ├── server/actions/        # All database mutations (17 files)
│   ├── types/                 # TypeScript declarations
│   └── proxy.ts               # Dashboard route protection
├── next.config.js
├── tailwind.config.ts
├── package.json
├── README.md                  # Developer setup & deployment guide
├── HANDOVER.md                # AI handover / work-in-progress notes
└── PLATFORM_DOCUMENTATION.md  # This file
```

---

## 3. Data Model (Prisma)

**File:** `prisma/schema.prisma`

### Enums (key ones)

| Enum | Values | Purpose |
|---|---|---|
| `GlobalRole` | SUPERADMIN, ADMIN, VENDOR_OWNER, VENDOR_STAFF, BUYER, DRIVER | Coarse route/dashboard access |
| `QuotationStatus` | DRAFT → PENDING → VIEWED → REVISED → ACCEPTED → PAYMENT_PENDING → PAID → SCHEDULED → IN_PREPARATION → READY → COMPLETED (+ DECLINED, EXPIRED, CANCELED) | Quotation lifecycle |
| `OrderStatus` | PAYMENT_PENDING → PAID → SCHEDULED → IN_PREPARATION → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED (+ CANCELED, REFUNDED) | Order fulfillment |
| `OrderingMode` | QUOTATION_ONLY, INSTANT_ONLY, BOTH | Business-wide ordering default |
| `FulfillmentType` | PICKUP, DELIVERY, EITHER | Branch fulfillment |
| `DriverAssignmentStatus` | ASSIGNED → ACCEPTED → EN_ROUTE_PICKUP → PICKED_UP → EN_ROUTE_DROPOFF → DELIVERED | Driver delivery flow |
| `PromotionType` | PERCENTAGE_OFF, AMOUNT_OFF, FREE_DELIVERY | Promo codes |
| `DietaryTag` | VEGETARIAN, VEGAN, HALAL, KOSHER, CONTAINS_NUTS, SPICY, GLUTEN_FREE | Menu item tags |

### Model Groups

| Group | Models |
|---|---|
| **Users & RBAC** | `User`, `Role`, `Permission`, `RolePermission`, `UserRole` |
| **Business** | `Business`, `Branch`, `OperatingHour`, `DeliveryZone`, `BusinessStaff`, `VerificationDocument` |
| **Menu** | `MenuCategory`, `MenuItem`, `MenuItemOption`, `BranchItemAvailability`, `FavoriteMenuItem` |
| **Media** | `Media` (polymorphic: business, branch, menu item, etc.) |
| **Quotations** | `Quotation`, `QuotationItem`, `QuotationRevision` |
| **Orders & Payments** | `Order`, `OrderItem`, `Payment`, `BuyerAddress` |
| **Drivers** | `DriverProfile`, `DriverAssignment` |
| **Reviews** | `Review` (business, driver, buyer targets) |
| **Social** | `SavedVendor`, `Conversation`, `ConversationMember`, `Message` |
| **Notifications** | `Notification` |
| **Admin** | `AuditLog`, `AdminAction`, `PlatformSetting` |
| **Promotions** | `Promotion`, `PromotionRedemption` |

### Key Relationships

- `Business` → many `Branch` → many `OperatingHour`, `BranchItemAvailability`
- `Business` → many `MenuCategory` → many `MenuItem` → many `MenuItemOption`, `Media`
- `Quotation` → many `QuotationItem`, `QuotationRevision` → optional `Order`
- `Order` → many `OrderItem`, `Payment` → optional `DriverAssignment`
- `User.globalRole` drives dashboard access; fine-grained `UserRole` + `Permission` for actions

---

## 4. Authentication & Authorization

### Auth Flow

| File | Role |
|---|---|
| `src/lib/auth-token.ts` | JWT sign/verify, cookie name |
| `src/lib/auth.ts` | `getCurrentUser()`, password hashing, session create/destroy |
| `src/proxy.ts` | Protects `/dashboard/*` — redirects unauthenticated to `/login?next=...` |
| `src/server/actions/auth.ts` | `loginAction`, `registerAction`, `logoutAction` |

**Session:** Signed JWT in HttpOnly cookie. Verified in proxy without DB round-trip; re-verified via `getCurrentUser()` in pages/actions where fresh user state matters.

### RBAC (Two Layers)

**File:** `src/lib/rbac.ts`

1. **GlobalRole** — gates entire dashboard sections (checked in `proxy.ts` via `canAccessDashboard()`)
2. **Role + Permission + UserRole** — fine-grained, business-scoped (e.g. `quotation.respond`, `menu.edit`)

| GlobalRole | Dashboard Access |
|---|---|
| BUYER | `/dashboard/buyer/*` |
| VENDOR_OWNER, VENDOR_STAFF | `/dashboard/vendor/*` |
| DRIVER | `/dashboard/driver/*` |
| ADMIN, SUPERADMIN | `/dashboard/admin/*` |
| SUPERADMIN | All dashboards |

**Permission keys:** `quotation.view`, `quotation.respond`, `menu.edit`, `branch.edit`, `branch.availability.edit`, `order.manage`, `staff.manage`, `business.settings.edit`, `business.verify`, `business.suspend`, `user.suspend`, `platform.settings.edit`

### 4.1 Non-Negotiable Business and Security Invariants

These invariants define boundaries that autonomous implementation must preserve:

1. Quotation orders remain quotation-first.
2. Quotation payment remains gated behind buyer acceptance.
3. Critical order, quotation, payment, and driver status changes use valid state transitions.
4. Server-side validation remains authoritative for prices, totals, discounts, availability, ownership, and payment status.
5. RBAC and ownership checks are enforced server-side, not only in UI components.
6. A buyer can access only their own private buyer records.
7. A vendor/staff member can mutate only records within the business scope permitted by their role.
8. A driver can mutate only assignments they are authorized to operate.
9. Financial effects must be idempotent where retries or webhooks are possible.
10. Payment success must never be inferred solely from client state.
11. Branch-level availability remains authoritative for branch-specific ordering.
12. Security, privacy, and data-integrity protections take precedence over feature velocity.

When changing code related to these invariants, the agent should add or update automated tests where the repository supports them.

---

---

## 5. Route Map — All Pages

### Public Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Homepage — marketplace discovery |
| `/vendors` | `src/app/vendors/page.tsx` | Vendor listing with search/filter |
| `/vendors/[slug]` | `src/app/vendors/[slug]/page.tsx` | Vendor detail — menu, ordering |
| `/vendors/join` | `src/app/vendors/join/page.tsx` | Vendor onboarding |
| `/search` | `src/app/search/page.tsx` | Food/menu item search |
| `/map` | `src/app/map/page.tsx` | Interactive vendor map |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | Quotation flow explainer |
| `/about` | `src/app/about/page.tsx` | About RekaDijo |
| `/help` | `src/app/help/page.tsx` | FAQ + contact form |
| `/legal` | `src/app/legal/page.tsx` | Legal hub |
| `/legal/terms` | `src/app/legal/terms/page.tsx` | Terms of Service |
| `/legal/privacy` | `src/app/legal/privacy/page.tsx` | Privacy Policy (POPIA-aware) |
| `/legal/cookies` | `src/app/legal/cookies/page.tsx` | Cookie Policy |
| `/legal/refund-policy` | `src/app/legal/refund-policy/page.tsx` | Refund & Cancellation |
| `/legal/vendor-agreement` | `src/app/legal/vendor-agreement/page.tsx` | Vendor Agreement |
| `/legal/driver-agreement` | `src/app/legal/driver-agreement/page.tsx` | Driver Agreement |
| `/legal/community-guidelines` | `src/app/legal/community-guidelines/page.tsx` | Community Guidelines |
| `/legal/accessibility` | `src/app/legal/accessibility/page.tsx` | Accessibility Statement |

### Auth Routes

| Route | File |
|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/register` | `src/app/(auth)/register/page.tsx` |

### Buyer Dashboard

| Route | File | Purpose |
|---|---|---|
| `/dashboard/buyer` | `src/app/dashboard/buyer/page.tsx` | Quotations & orders overview |
| `/dashboard/buyer/quotations/[id]` | `src/app/dashboard/buyer/quotations/[id]/page.tsx` | Quotation detail + accept/decline/pay |
| `/dashboard/buyer/orders/[id]` | `src/app/dashboard/buyer/orders/[id]/page.tsx` | Order tracking + review + cancel |
| `/dashboard/buyer/orders/[id]/receipt` | `src/app/dashboard/buyer/orders/[id]/receipt/page.tsx` | Printable receipt |
| `/dashboard/buyer/saved` | `src/app/dashboard/buyer/saved/page.tsx` | Saved vendors |
| `/dashboard/buyer/favorites` | `src/app/dashboard/buyer/favorites/page.tsx` | Favorite menu items |
| `/dashboard/buyer/profile` | `src/app/dashboard/buyer/profile/page.tsx` | Profile + address book |

### Vendor Dashboard

| Route | File | Purpose |
|---|---|---|
| `/dashboard/vendor` | `src/app/dashboard/vendor/page.tsx` | Overview stats |
| `/dashboard/vendor/quotations` | `src/app/dashboard/vendor/quotations/page.tsx` | Quotation inbox |
| `/dashboard/vendor/quotations/[id]` | `src/app/dashboard/vendor/quotations/[id]/page.tsx` | Quotation tools (revise/decline) |
| `/dashboard/vendor/orders` | `src/app/dashboard/vendor/orders/page.tsx` | Order list |
| `/dashboard/vendor/orders/[id]` | `src/app/dashboard/vendor/orders/[id]/page.tsx` | Order detail + status + driver dispatch |
| `/dashboard/vendor/menu` | `src/app/dashboard/vendor/menu/page.tsx` | Menu CRUD |
| `/dashboard/vendor/branches` | `src/app/dashboard/vendor/branches/page.tsx` | Branch management |
| `/dashboard/vendor/branches/new` | `src/app/dashboard/vendor/branches/new/page.tsx` | Add new branch |
| `/dashboard/vendor/staff` | `src/app/dashboard/vendor/staff/page.tsx` | Staff invites + custom roles |
| `/dashboard/vendor/promotions` | `src/app/dashboard/vendor/promotions/page.tsx` | Promo code management |
| `/dashboard/vendor/analytics` | `src/app/dashboard/vendor/analytics/page.tsx` | Revenue & stats |
| `/dashboard/vendor/settings` | `src/app/dashboard/vendor/settings/page.tsx` | Business settings |

### Driver Dashboard

| Route | File | Purpose |
|---|---|---|
| `/dashboard/driver` | `src/app/dashboard/driver/page.tsx` | Assignments list |
| `/dashboard/driver/earnings` | `src/app/dashboard/driver/earnings/page.tsx` | Earnings summary |
| `/dashboard/driver/profile` | `src/app/dashboard/driver/profile/page.tsx` | Vehicle & profile |

### Admin Dashboard

| Route | File | Purpose |
|---|---|---|
| `/dashboard/admin` | `src/app/dashboard/admin/page.tsx` | Platform overview + verification queue |
| `/dashboard/admin/businesses` | `src/app/dashboard/admin/businesses/page.tsx` | All businesses + suspend |
| `/dashboard/admin/users` | `src/app/dashboard/admin/users/page.tsx` | User management + suspend |
| `/dashboard/admin/settings` | `src/app/dashboard/admin/settings/page.tsx` | Platform settings |

### Shared Dashboard

| Route | File | Purpose |
|---|---|---|
| `/dashboard/messages` | `src/app/dashboard/messages/page.tsx` | Conversation list |
| `/dashboard/messages/[id]` | `src/app/dashboard/messages/[id]/page.tsx` | Message thread |
| `/dashboard/notifications` | `src/app/dashboard/notifications/page.tsx` | Full notification inbox |

### Navigation Config

**File:** `src/lib/nav-config.ts`

- `PUBLIC_NAV` — header links for all users
- `BUYER_TABS` — mobile bottom nav (Home, Map, Search, Orders, Profile)
- `VENDOR_NAV` / `VENDOR_TABS` — vendor sidebar + mobile tabs
- `DRIVER_NAV` / `DRIVER_TABS` — driver navigation
- `ADMIN_NAV` / `ADMIN_TABS` — admin navigation
- `DASHBOARD_PATH` — default dashboard redirect per role

---

## 6. Public Pages (Detailed)

### 6.1 Homepage (`/`)

**File:** `src/app/page.tsx`  
**Type:** Server Component

**Data fetched:**
- Top 8 approved businesses (by rating) with active branches
- Top 12 active menu items with media, category, business info

**Sections:**
1. **Hero** — full-width image, tagline, `SearchBar` with live typeahead suggestions (items, vendors, categories), quick-search chips
2. **Marketplace promises** — Fast ordering, Clean quotations, Saved addresses
3. **Category row** — `CategoryRow` component (food type icons)
4. **Popular nearby picks** — horizontal scroll of menu item cards with images/prices
5. **Nearby vendors** — `NearbyVendorsSection` (client component, uses geolocation + `getNearbyVendorsAction`)
6. **Top-rated branches** — `VendorCard` grid via `createBranchListings()`
7. **Event/catering CTA** — links to `/vendors` and `/how-it-works`
8. **Browse by business type** — category pill links

**Key dependencies:** `SearchBar`, `VendorCard`, `CategoryRow`, `NearbyVendorsSection`, `createBranchListings`, `formatZAR`

---

### 6.2 Vendor Listing (`/vendors`)

**File:** `src/app/vendors/page.tsx`  
**Type:** Server Component

**Query params:** `q` (search), `category`, `mode` (instant | quotation)

**Features:**
- Search vendors by name or menu item name
- Filter by category and ordering mode
- Results rendered as branch-level `VendorCard` listings

---

### 6.3 Vendor Detail (`/vendors/[slug]`)

**File:** `src/app/vendors/[slug]/page.tsx`  
**Type:** Server Component  
**Query params:** `branch` (branch ID selector)

**Data fetched:**
- Business with branches (operating hours), menu categories/items (options, branch availability, media)
- User's saved vendor status, favorite menu items, reviews

**Layout:**
1. **Header** — name, rating, category, description, ordering mode badges, save vendor button
2. **Branch selector** — pill tabs when multiple branches
3. **Branch info bar** — address, lead time, fulfillment type, open/closed status (`resolveOpenStatus`)
4. **Menu (2/3 width)** — sticky category anchor chips; `VendorMenuItems` with photo-rich rows, dietary tags, availability badges, favorite button, and `MenuItemModal` for options/detail
5. **Order panel (1/3 width, sticky)** — `VendorOrderPanel` with tabs:
   - **Order now** → `InstantOrderCart` (if branch accepts instant orders) — shows persisted cart lines added from the menu
   - **Quote** → `QuotationBuilder` — shows persisted quotation lines added from the menu
6. **Reviews** — `ReviewsList`

**Key client components:**
- `VendorMenuItems` — menu list + add-to-cart/quote via modal
- `MenuItemModal` — item detail, option groups, quantity, add to instant or quotation cart
- `VendorOrderPanel` — tab switcher
- `InstantOrderCart` — cart lines, promo code, tip, checkout
- `QuotationBuilder` — cart lines, event type, date, delivery address, order size guidance
- `SaveVendorButton`, `FavoriteItemButton`

---

### 6.4 Search (`/search`)

**File:** `src/app/search/page.tsx`  
**Type:** Server Component  
**Query params:** `q`, `mode`, `sort` (rating | name)

**Features:**
- `SearchBar` with typeahead suggestions (items, vendors, categories)
- `CategoryRow` for one-tap browsing
- Menu-item-name search — shows every vendor branch selling a match
- Filter by ordering mode, sort by rating or name
- Shows matched item names per vendor card

---

### 6.5 Map (`/map`)

**File:** `src/app/map/page.tsx` → `MapPageClient`  
**Type:** Server Component (data) + Client Component (map UI)  
**Query params:** `q`

**Features:**
- Fetches all active branches from approved businesses with menu items
- Leaflet + OpenStreetMap (no API key)
- Plots vendor pins, centers on buyer's selected location
- Search bar + delivery/pickup toggle synced with address store
- Vendor list beside map with distance

**Key component:** `src/components/map-page-client.tsx`, `src/components/vendor-map.tsx`

---

### 6.6 Vendor Onboarding (`/vendors/join`)

**File:** `src/app/vendors/join/page.tsx` + `onboarding-form.tsx`  
**Action:** `registerBusinessAction` in `src/server/actions/business.ts`

Creates a new business (status: `PENDING_VERIFICATION`) with owner account.

---

### 6.7 How It Works (`/how-it-works`)

**File:** `src/app/how-it-works/page.tsx`  
Static 6-step explainer of the quotation flow.

---

### 6.8 Help (`/help`)

**File:** `src/app/help/page.tsx` + `faq-accordion.tsx`, `contact-form.tsx`  
**Action:** `submitContactRequestAction` — notifies all Admin/SuperAdmin in-app.

---

### 6.9 About (`/about`)

**File:** `src/app/about/page.tsx`  
Static about page for RekaDijo / TechTur Solutions.

---

### 6.10 Legal Suite (`/legal/*`)

**Layout:** `src/components/legal-layout.tsx`  
Static legal documents: Terms, Privacy (POPIA), Cookies, Refund Policy, Vendor Agreement, Driver Agreement, Community Guidelines, Accessibility.

---

## 7. Auth Pages

### Login (`/login`)

**Files:** `page.tsx`, `login-form.tsx`  
**Action:** `loginAction`  
Redirects to `next` param or role-appropriate dashboard.

### Register (`/register`)

**Files:** `page.tsx`, `register-form.tsx`  
**Action:** `registerAction`  
Creates buyer account by default.

---

## 8. Buyer Dashboard

### Overview (`/dashboard/buyer`)

Lists recent quotations (with status badges) and orders. Quick links to saved vendors, favorites, profile, messages.

### Quotation Detail (`/dashboard/buyer/quotations/[id]`)

**Component:** `quotation-actions.tsx`  
**Actions:** Accept, decline, pay (`respondToQuotationAction`, `payQuotationAction`)

Shows quotation items, revisions, vendor messages, status timeline.

### Order Detail (`/dashboard/buyer/orders/[id]`)

**Components:** `order-timeline.tsx`, `driver-card.tsx`, `order-actions.tsx`, `review-form.tsx`  
**Actions:** Cancel order (`cancelOrderAction`), reorder (`getReorderItemsAction`), submit review (`submitOrderReviewAction`)  
**API:** `GET /api/orders/[id]/driver-location` — returns current driver location for polling (30s interval)

Rich status timeline with visual stepper, driver info with vehicle details, location map (if delivering), delivery ETA, and review form after completion.

### Receipt (`/dashboard/buyer/orders/[id]/receipt`)

Printable receipt with subtotal, discount, delivery fee, tip, total.  
**Component:** `print-button.tsx`

### Saved Vendors (`/dashboard/buyer/saved`)

List of hearted/saved businesses.  
**Action:** `toggleSavedVendorAction`

### Favorites (`/dashboard/buyer/favorites`)

List of favorited menu items across vendors.  
**Action:** `toggleFavoriteMenuItemAction`

### Profile (`/dashboard/buyer/profile`)

**Components:** `profile-form.tsx`, `address-form.tsx`, `delete-address-button.tsx`  
**Actions:** `updateProfileAction`, `addAddressAction`, `deleteAddressAction`

---

## 9. Vendor Dashboard

**Layout:** `src/app/dashboard/vendor/layout.tsx` — sidebar via `DashboardSidebar` + `VENDOR_NAV`

### Overview (`/dashboard/vendor`)

Stats: pending quotations, active orders, menu items, branches. Recent quotation inbox preview.

### Quotations (`/dashboard/vendor/quotations`, `/[id]`)

Inbox list + detail with vendor tools.  
**Component:** `vendor-quotation-tools.tsx`  
**Actions:** `markQuotationViewedAction`, `reviseQuotationAction`, respond (accept/decline)

### Orders (`/dashboard/vendor/orders`, `/[id]`)

Order list + detail with status control and driver dispatch.  
**Components:** `order-status-control.tsx`, `driver-dispatch-panel.tsx`  
**Actions:** `updateOrderStatusAction`, `assignDriverToOrderAction`

### Menu (`/dashboard/vendor/menu`)

Full menu CRUD — categories, items, pricing, flags, image upload & edit.  
**Components:** `new-category-form.tsx`, `new-item-form.tsx`, `edit-item-form.tsx`, `menu-item-row.tsx`  
**Actions:** `createCategoryAction`, `createMenuItemAction`, `updateMenuItemAction`, `toggleMenuItemActiveAction`, `deleteMenuItemAction`, `uploadMenuItemMediaAction`, `deleteMediaAction`

### Branches (`/dashboard/vendor/branches`, `/new`)

Branch management with settings, hours, availability.  
**Components:** `branch-settings-panel.tsx`, `branch-availability-panel.tsx`, `hours-editor.tsx`, `new-branch-form.tsx`  
**Actions:** `createBranchAction`, `updateBranchSettingsAction`, `updateOperatingHourAction`, `updateBranchItemAvailabilityAction`

### Staff (`/dashboard/vendor/staff`)

Staff invitations + custom role builder.  
**Components:** `invite-staff-form.tsx`, `custom-role-builder.tsx`, `remove-staff-button.tsx`  
**Actions:** `inviteStaffAction`, `removeStaffAction`, `createCustomRoleAction`, `assignRoleToStaffAction`

### Promotions (`/dashboard/vendor/promotions`)

Create and toggle promo codes.  
**Components:** `new-promotion-form.tsx`, `toggle-promotion-button.tsx`  
**Actions:** `createPromotionAction`, `togglePromotionAction`, `validatePromoCodeAction`

### Analytics (`/dashboard/vendor/analytics`)

Revenue, quotation acceptance rate, top items, orders by branch.

### Settings (`/dashboard/vendor/settings`)

Business description, category, contact, min order, lead time, ordering mode.  
**Component:** `settings-form.tsx`  
**Action:** `updateBusinessSettingsAction`

---

## 10. Driver Dashboard

**Layout:** `src/app/dashboard/driver/layout.tsx`

### Assignments (`/dashboard/driver`)

List of delivery assignments with status progression.  
**Components:** `availability-toggle.tsx`, `assignment-status-control.tsx`  
**Actions:** `setDriverAvailabilityAction`, `updateDriverAssignmentStatusAction`

Status flow: ASSIGNED → ACCEPTED → EN_ROUTE_PICKUP → PICKED_UP → EN_ROUTE_DROPOFF → DELIVERED

### Earnings (`/dashboard/driver/earnings`)

Earnings summary page.

### Profile (`/dashboard/driver/profile`)

Vehicle type, license plate.  
**Component:** `driver-profile-form.tsx`  
**Action:** `updateDriverProfileAction`

---

## 11. Admin Dashboard

**Layout:** `src/app/dashboard/admin/layout.tsx`

### Overview (`/dashboard/admin`)

Platform stats (users, businesses, quotations, orders) + vendor verification queue.  
**Component:** `admin-business-actions.tsx`  
**Action:** `verifyBusinessAction`

### Businesses (`/dashboard/admin/businesses`)

All businesses list with suspend/restore.  
**Component:** `suspend-business-button.tsx`  
**Action:** `suspendBusinessAction`

### Users (`/dashboard/admin/users`)

User search + suspend/restore.  
**Component:** `suspend-user-button.tsx`  
**Action:** `suspendUserAction`

### Settings (`/dashboard/admin/settings`)

Platform-wide settings (delivery fee model, support contact).  
**Component:** `setting-row.tsx`  
**Actions:** `getPlatformSetting`, `updatePlatformSettingAction`

---

## 12. Shared Dashboard Pages

### Messages (`/dashboard/messages`, `/[id]`)

In-app messaging between buyers, vendors, drivers.  
**Component:** `message-thread.tsx`  
**Actions:** `getOrCreateQuotationConversation`, `sendMessageAction`, `markConversationReadAction`

### Notifications (`/dashboard/notifications`)

Full notification inbox.  
**Actions:** `markNotificationReadAction`, `markAllNotificationsReadAction`

Also surfaced in header via `NotificationBell` component (last 8 notifications).

---

## 13. Server Actions Reference

All mutations live in `src/server/actions/`. No REST endpoints.

| File | Actions |
|---|---|
| `auth.ts` | `loginAction`, `registerAction`, `logoutAction` |
| `business.ts` | `registerBusinessAction` |
| `buyer.ts` | `updateProfileAction`, `addAddressAction`, `deleteAddressAction`, `toggleFavoriteMenuItemAction`, `toggleSavedVendorAction` |
| `branch.ts` | `updateBusinessSettingsAction`, `createBranchAction`, `updateBranchSettingsAction`, `updateOperatingHourAction` |
| `discovery.ts` | `getNearbyVendorsAction` |
| `driver.ts` | `updateDriverProfileAction`, `assignDriverToOrderAction`, `updateDriverAssignmentStatusAction`, `setDriverAvailabilityAction` |
| `instant-order.ts` | `createInstantOrderAction` |
| `menu.ts` | `createCategoryAction`, `deleteCategoryAction`, `createMenuItemAction`, `updateMenuItemAction`, `toggleMenuItemActiveAction`, `deleteMenuItemAction`, `uploadMenuItemMediaAction`, `deleteMediaAction` |
| `messaging.ts` | `getOrCreateQuotationConversation`, `sendMessageAction`, `markConversationReadAction` |
| `notifications.ts` | `markNotificationReadAction`, `markAllNotificationsReadAction` |
| `orders.ts` | `cancelOrderAction`, `getReorderItemsAction` |
| `platform-settings.ts` | `getPlatformSetting`, `updatePlatformSettingAction` |
| `promotions.ts` | `validatePromoCodeAction`, `createPromotionAction`, `togglePromotionAction` |
| `quotations.ts` | `createQuotationAction`, `markQuotationViewedAction`, `reviseQuotationAction`, `expireQuotationIfNeeded`, `respondToQuotationAction`, `payQuotationAction`, `updateBranchItemAvailabilityAction`, `verifyBusinessAction`, `suspendBusinessAction`, `suspendUserAction`, `updateOrderStatusAction` |
| `reviews.ts` | `submitOrderReviewAction` |
| `staff.ts` | `inviteStaffAction`, `removeStaffAction`, `createCustomRoleAction`, `assignRoleToStaffAction` |
| `support.ts` | `submitContactRequestAction` |

---

## 14. Shared Components

| Component | File | Purpose |
|---|---|---|
| `SiteHeader` | `site-header.tsx` | Top nav, auth links, notification bell, address bar, mobile menu |
| `SiteFooter` | `site-footer.tsx` | Footer links (legal, help, about) |
| `BottomNav` | `bottom-nav.tsx` | Mobile tab bar (role-aware, hidden on dashboards/desktop) |
| `AddressBar` | `address-bar.tsx` | Selected address display + dropdown |
| `AddressSelector` | `address-selector.tsx` | Delivery address picker in checkout flows |
| `SearchBar` | `search-bar.tsx` | Search input with typeahead suggestions |
| `VendorCard` | `vendor-card.tsx` | Vendor/branch listing card with image |
| `CategoryRow` | `category-row.tsx` | Food category icon row |
| `NearbyVendorsSection` | `nearby-vendors-section.tsx` | Geolocation-based nearby vendors |
| `VendorOrderPanel` | `vendor-order-panel.tsx` | Instant vs Quote tab switcher |
| `VendorMenuItems` | `vendor-menu-items.tsx` | Vendor menu list with modal add-to-cart/quote |
| `MenuItemModal` | `menu-item-modal.tsx` | Item detail modal with option groups and quantity |
| `InstantOrderCart` | `instant-order-cart.tsx` | Instant order cart lines + checkout |
| `MobileCartBar` | `mobile-cart-bar.tsx` | Mobile-only sticky bottom bar showing item count + subtotal; opens full cart in modal |
| `QuotationBuilder` | `quotation-builder.tsx` | Quotation request builder (cart lines + form) |
| `VendorMap` | `vendor-map.tsx` | Leaflet map component |
| `MapPageClient` | `map-page-client.tsx` | Map page client wrapper |
| `OrderTimeline` | `order-timeline.tsx` | Buyer order status timeline with visual stepper |
| `DriverCard` | `driver-card.tsx` | Driver info card with live location polling (30s) |
| `DriverTrackingMap` | `driver-tracking-map.tsx` | Leaflet mini-map for driver + delivery pins on buyer order page |
| `QuotationRevisionComparison` | `quotation-revision-comparison.tsx` | Expandable revision history with side-by-side diff on buyer/vendor quotation pages |
| `DashboardSidebar` | `dashboard-sidebar.tsx` | Desktop sidebar for dashboards |
| `NotificationBell` | `notification-bell.tsx` | Header notification dropdown |
| `MessageButton` | `message-button.tsx` | Start/view conversation |
| `SaveVendorButton` | `save-vendor-button.tsx` | Toggle saved vendor |
| `FavoriteItemButton` | `favorite-item-button.tsx` | Toggle favorite menu item |
| `ReviewsList` | `reviews-list.tsx` | Review display |
| `CookieBanner` | `cookie-banner.tsx` | Cookie consent notice |
| `LegalLayout` | `legal-layout.tsx` | Legal page wrapper |
| `LogoutButton` | `logout-button.tsx` | Logout action trigger |
| `MobileMenu` | `mobile-menu.tsx` | Mobile navigation drawer |

**UI primitives:** `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`

---

## 15. Lib Modules

| Module | File | Purpose |
|---|---|---|
| Auth | `auth.ts`, `auth-token.ts` | Session management, JWT, password hashing |
| RBAC | `rbac.ts` | Permission checks, dashboard access, default staff roles |
| Quotation | `quotation.ts` | State machine, transitions, status labels, reference generation |
| Quotation Revisions | `quotation-revisions.ts` | Map `QuotationRevision` rows for comparison UI; expiry-eligible status helpers |
| Geo | `geo.ts` | Haversine distance, delivery availability resolution, fee estimation, delivery ETA calculation, branch ranking |
| Store Hours | `store-hours.ts` | Open/closed status from `OperatingHour` rows |
| Promotions | `promotions.ts` | Promo code validation logic |
| Branch Listings | `branch-listings.ts` | Transform businesses into branch-level card data |
| Address Store | `address-store.tsx` | Client context for selected address + delivery/pickup preference (localStorage) |
| Cart Store | `cart-store.tsx` | Client context for instant + quotation carts per `businessId:branchId` (localStorage); line keys include option labels; exposes total item count for bottom nav badge |
| Menu Options | `menu-options.ts` | Shared option grouping/resolution for client modal and server pricing |
| Storage | `storage.ts` | File upload driver (local disk; swappable for S3) |
| Nav Config | `nav-config.ts` | Navigation items per role |
| Prisma | `prisma.ts` | Prisma client singleton |
| Utils | `utils.ts` | `formatZAR`, `cn` (classnames), helpers |

---

## 16. Core Business Flows

### 16.1 Quotation Flow

```
Buyer builds quotation on vendor page
  → createQuotationAction (status: PENDING)
  → Vendor views → markQuotationViewedAction (VIEWED)
  → Vendor revises → reviseQuotationAction (REVISED)
  → Buyer accepts → respondToQuotationAction (ACCEPTED → PAYMENT_PENDING)
  → Buyer pays → payQuotationAction (PAID → creates Order)
  → Vendor fulfills → updateOrderStatusAction (SCHEDULED → IN_PREPARATION → READY → COMPLETED)
```

Payment is **structurally blocked** until status reaches `PAYMENT_PENDING` (only after buyer acceptance).

### 16.2 Instant Order Flow

```
Buyer adds items to InstantOrderCart on vendor page
  → Validates branch availability, open status, delivery range
  → Optional promo code (validatePromoCodeAction)
  → Optional tip
  → createInstantOrderAction (creates Order + Payment, placeholder success)
  → Vendor manages via order dashboard
  → Optional driver dispatch (assignDriverToOrderAction)
```

### 16.3 Vendor Onboarding Flow

```
Vendor registers at /vendors/join
  → registerBusinessAction (status: PENDING_VERIFICATION)
  → Admin reviews at /dashboard/admin
  → verifyBusinessAction (APPROVE → APPROVED, or REJECT)
  → Vendor can manage menu, branches, staff
```

### 16.4 Driver Delivery Flow

```
Vendor assigns driver to order (assignDriverToOrderAction)
  → Driver sees assignment on dashboard
  → Driver accepts → EN_ROUTE_PICKUP → PICKED_UP → EN_ROUTE_DROPOFF → DELIVERED
  → Buyer can review driver on completed delivery orders
```

---

## 17. Placeholders & External Integrations

These are intentionally not wired to real services. Code paths around them are real and ready for integration.

| Service | Current State | Integration Point |
|---|---|---|
| **Payments** | `PLACEHOLDER_MANUAL` — instant success | `payQuotationAction`, `createInstantOrderAction` |
| **Maps/Geocoding** | Manual lat/lng entry; haversine math is real | `src/lib/geo.ts`, vendor onboarding, address forms |
| **Email/SMS** | In-app `Notification` rows created; no outbound send | New `src/lib/notify.ts` hooking into notification creation |
| **File Storage** | Local disk (`/public/uploads`) | `src/lib/storage.ts` — swap for S3/Spaces |
| **Push Notifications** | Not implemented | Would need web push or native wrapper |

---

## 17.1 Verification and evidence expectations

`PLATFORM_DOCUMENTATION.md` records current-state facts; verification evidence is maintained in `HANDOVER.md`.

For major business flows, the AI should prefer evidence from:

- typecheck;
- lint;
- production build;
- unit/integration tests when present;
- Playwright/browser smoke tests when present;
- direct inspection of the affected Server Action and authorization path;
- migration and schema verification when Prisma changes occur.

Do not upgrade a feature from partial/placeholder to implemented without corresponding evidence.

---

## 18. Gap Analysis — Uber Eats Parity

### ✅ Implemented (Uber Eats–like features present in code)

| Feature | Status | Location |
|---|---|---|
| Homepage discovery | ✅ | `/`, nearby vendors, popular picks, categories |
| Search with typeahead | ✅ | `/`, `/search`, `SearchBar` |
| Interactive map | ✅ | `/map`, Leaflet + OSM |
| Vendor detail with menu | ✅ | `/vendors/[slug]` |
| Branch switching | ✅ | Query param `?branch=` |
| Instant ordering + cart | ✅ | `InstantOrderCart` — persisted via `cart-store.tsx`; min order enforced client + server |
| Quotation ordering | ✅ | `QuotationBuilder` (differentiator) |
| Delivery/pickup toggle | ✅ | `AddressBar`, address store |
| Saved addresses | ✅ | Buyer profile + address store |
| Promo codes | ✅ | Vendor promotions + checkout validation |
| Tipping | ✅ | Instant checkout + quotation payment |
| Order tracking | ✅ | Buyer order detail with status timeline |
| Order cancellation | ✅ | Before IN_PREPARATION |
| Reorder | ✅ | `getReorderItemsAction` |
| Reviews (vendor + driver) | ✅ | Post-order review form |
| Favorites (items + vendors) | ✅ | Heart buttons, saved/favorites pages |
| Dietary tags | ✅ | Menu item badges |
| Receipts | ✅ | Printable receipt page |
| Store open/closed | ✅ | `store-hours.ts`, badges on vendor page |
| In-app messaging | ✅ | `/dashboard/messages` |
| Notifications | ✅ | Bell + inbox (in-app only) |
| Mobile bottom nav | ✅ | `BottomNav` — cart badge wired via `cart-store.tsx` |
| Vendor onboarding | ✅ | `/vendors/join` |
| Admin verification | ✅ | Verification queue |
| Driver assignments | ✅ | Status progression |
| Analytics | ✅ | Vendor analytics page |
| Staff RBAC | ✅ | Custom roles + permissions |
| Legal pages | ✅ | Full suite |
| Cookie consent | ✅ | `CookieBanner` |
| SEO | ✅ | sitemap.xml, robots.txt, metadata |

### ❌ Missing or Incomplete (needed for full Uber Eats parity)

#### Critical (core delivery app expectations)

| Gap | Description | Suggested Approach |
|---|---|---|
| **Real payment gateway** | All payments simulate instant success | Integrate PayFast, Yoco, Stripe, or Peach Payments + webhook handler |
| **Real-time GPS tracking** | Driver location stored but not streamed live | WebSockets/Pusher + live map on buyer order page |
| **Push notifications** | In-app only; no mobile/web push | Firebase Cloud Messaging or web push API |
| **Address autocomplete/geocoding** | Manual address entry + browser geolocation | Google Places API or Mapbox Geocoding |
| **Native mobile apps** | Web-only (responsive) | React Native / Flutter wrapper or PWA |
| **Cart persistence** | ✅ Implemented | `src/lib/cart-store.tsx`, `instant-order-cart.tsx`, `quotation-builder.tsx` |
| **Menu item options UI** | ✅ Implemented | `menu-item-modal.tsx`, `vendor-menu-items.tsx`, `menu-options.ts`; server validates via `optionLabels` in `createInstantOrderAction` / `createQuotationAction` |
| **Item detail modal** | ✅ Implemented | `MenuItemModal` — description, dietary tags, options, quantity |
| **Sticky mobile checkout bar** | Order panel is sidebar (desktop-first) | Fixed bottom bar on mobile with cart summary |
| **Order minimum enforcement UI** | ✅ Implemented | `instant-order-cart.tsx`, `createInstantOrderAction` — blocks checkout below `minOrderAmount` |

#### Important (operational maturity)

| Gap | Description |
|---|---|
| **Email/SMS notifications** | Notification records created but never sent outbound |
| **Production file storage** | Local disk only; needs S3/Spaces for prod |
| **Rate limiting** | No API rate limits on server actions |
| **Webhook reconciliation** | No payment webhook handler for async payment confirmation |
| **Multi-cart / multi-vendor** | Can only order from one vendor at a time |
| **Scheduled ordering UX** | `isAsap` / `scheduledFor` exist but limited UI for "order for later" |
| **Delivery time estimates** | Distance calculated but no ETA display |
| **Driver auto-dispatch** | Manual assignment only; no nearest-driver matching |
| **Refund automation** | Cancel marks payment refunded; no gateway refund call |
| **Content moderation** | No review/message moderation pipeline |
| **Search filters** | Basic mode/sort; missing price range, dietary, distance, rating filters |
| **Category landing pages** | Categories link to query params, not dedicated pages |
| **Recent/trending searches** | Not persisted |
| **Vendor menu editing** | Create items supported; limited edit/reorder/category drag |
| **Image optimization** | `unoptimized` on many Next.js Image components |
| **Audit log UI** | `AuditLog` model exists; no admin viewer |
| **Multi-language/i18n** | English only |
| **Accessibility audit** | Statement exists; no systematic a11y testing |
| **Automated tests** | No test suite (unit, integration, e2e) |
| **CI/CD pipeline** | No GitHub Actions or similar |
| **Caching layer** | No Redis/CDN caching for hot reads |
| **Database read replicas** | Single Postgres instance |
| **Soft delete recovery UI** | `deletedAt` on models but no admin restore UI |
| **Systematic mutation idempotency** | Payment/webhook idempotency is not yet a platform-wide pattern |
| **Critical-flow automated regression coverage** | No comprehensive automated coverage across quotation, payment, RBAC, ownership, and driver state transitions |
| **Operational observability** | No documented end-to-end structured logging/error tracking/health workflow |

#### Nice-to-have (Uber Eats premium features)

| Gap | Description |
|---|---|
| **Subscription/pass** | No Uber One–style membership |
| **Group ordering** | No shared cart / split bill |
| **Live chat support** | Contact form only; no real-time support chat |
| **Order batching** | No multi-stop delivery optimization |
| **Surge pricing** | No dynamic delivery fees |
| **Loyalty points** | No rewards program beyond promo codes |
| **Gift cards** | Not implemented |
| **Alcohol ID verification** | Not applicable yet but common in delivery apps |
| **Order insurance** | Not implemented |
| **AI recommendations** | No personalized suggestions engine |
| **Social sharing** | No share order/vendor links with OG previews beyond basic metadata |

### RekaDijo Differentiators (keep, don't copy Uber Eats blindly)

These are **intentional strengths** that Uber Eats doesn't emphasize:

1. **Quotation-first ordering** — bulk, events, catering with vendor revision workflow
2. **Order size classification** — SMALL/MEDIUM/LARGE/BULK with buyer guidance
3. **Quotation revision history** — full audit trail of price/quantity changes
4. **Event type tagging** — birthday, church, office lunch, wedding, etc.
5. **Branch-level menu availability** — shared menu with per-branch overrides
6. **Custom vendor staff roles** — granular PBAC beyond Uber Eats merchant portal
7. **Payment gated behind approval** — structural, not just UI

---

## Appendix: Seed Data

Run `npm run db:seed` to load:

| Role | Email | Password |
|---|---|---|
| SuperAdmin | superadmin@rekadijo.co.za | Password@123 |
| Admin | admin@rekadijo.co.za | Password@123 |
| Vendor | vendor@rekadijo.co.za | Password@123 |
| Vendor Staff | staff@rekadijo.co.za | Password@123 |
| Buyer | buyer@rekadijo.co.za | Password@123 |
| Driver | driver@rekadijo.co.za | Password@123 |

Sample business: **TR. Matsipa Market** (3 branches: Warrenton, Kimberley, Jan Kempdorp)  
Sample promo: `WELCOME20` (20% off, min R50, cap R60)

---

*This document must stay in sync with the codebase. Update after every code change — see `AI_ROADMAP.md` §1.2 and the autonomous operating protocol in §1.0.*
