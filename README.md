# RekaDijo (BuyFood)

A quotation-first food ordering platform by **TechTur Solutions**.

Support: techtursolutions@gmail.com · WhatsApp +27 67 171 4777

---

## 1. Architecture overview

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL, deployed as a single Node.js
process on an Ubuntu VPS (no Docker), developed on Windows 10.

- **Frontend & backend in one codebase.** Next.js Server Components fetch data directly from Prisma on the server
  (no separate REST/GraphQL layer to maintain). Mutations go through **Server Actions** in `src/server/actions/`,
  which run only on the server, are type-checked end-to-end, and are the only way the UI writes to the database.
- **Auth** is a lightweight, dependency-light session system (`src/lib/auth.ts`): passwords hashed with bcrypt,
  sessions are signed JWTs in an HttpOnly cookie (via `jose`), verified in `src/middleware.ts` for fast route
  protection without a DB round-trip, and re-verified against the DB (`getCurrentUser`) wherever fresh state matters.
- **Database**: one Prisma schema (`prisma/schema.prisma`) modeling every entity described in the product brief —
  users/roles/permissions, businesses/branches/staff, menu + branch-level availability, quotations + revisions,
  orders + payments, reviews, messaging, notifications, and admin/audit tables.

### Why this stack
Next.js + Prisma + PostgreSQL is a boring, well-documented, production-proven combination that a single developer
or small team can run on one Ubuntu VPS without container orchestration, while still scaling vertically (bigger
VPS) or horizontally (multiple app instances behind a load balancer, one shared Postgres) later without a rewrite.
Server Actions remove an entire API layer that would otherwise need separate validation, routing, and typing.

### Quotation-first ordering
`src/lib/quotation.ts` defines an explicit state machine (`QUOTATION_TRANSITIONS`) covering every status in the
brief: `DRAFT → PENDING → VIEWED → REVISED → ACCEPTED → PAYMENT_PENDING → PAID → SCHEDULED → IN_PREPARATION → READY
→ COMPLETED`, plus `DECLINED`/`EXPIRED`/`CANCELED` branches. Server actions call `assertTransition()` before every
status change, so **payment is structurally unreachable before `ACCEPTED`** — this isn't just a UI rule, it's
enforced in the action that would create the payment record.

### Optional instant ordering
`Business.orderingMode` (`QUOTATION_ONLY` / `INSTANT_ONLY` / `BOTH`) is the business-wide default; `Branch
.acceptsInstantOrders` and `BranchItemAvailability.isInstantOrderable` let a vendor turn instant ordering on/off
per branch and per item. Quotation mode is always available regardless of instant-order settings — it can't be
disabled, per the product brief.

### Branches & location-based availability
- `Business` has many `Branch` records (see TR. Matsipa Market seed data: Warrenton, Kimberley, Jan Kempdorp).
- Menu is shared at the `Business` level (`MenuItem`), but `BranchItemAvailability` is a per-branch override table
  holding `isAvailable`, `isInstantOrderable`, `stockQuantity`, and an optional `priceOverride` — this is how
  "homemade bread is off in Warrenton" or "Jan Kempdorp is pickup-only with lower stock" is modeled.
- `src/lib/geo.ts` has pure, testable functions: `haversineDistanceKm`, `resolveDeliveryAvailability` (returns
  `DELIVERY_AVAILABLE` / `PICKUP_ONLY` / `QUOTATION_ONLY` / `NOT_AVAILABLE` with a human-readable message),
  `rankBranchesByDistance`, and `estimateDeliveryFee`. No external maps API is called — distance is computed from
  stored lat/lng using the haversine formula. Swap in a real geocoding/maps provider later without touching the
  call sites, only the coordinate-lookup step.
- `classifyOrderSize()` turns total item quantity into `SMALL/MEDIUM/LARGE/BULK` with buyer-facing guidance
  (pickup vehicle recommendations etc.), used live in the quotation builder.

### Permissions (RBAC/PBAC)
Two layers, documented in full in `src/lib/rbac.ts`:
1. **`GlobalRole`** (`SUPERADMIN`, `ADMIN`, `VENDOR_OWNER`, `VENDOR_STAFF`, `BUYER`, `DRIVER`) — coarse-grained,
   checked first in `middleware.ts` to gate entire dashboard sections without hitting the database.
2. **`Role` / `Permission` / `RolePermission` / `UserRole`** — fine-grained, custom, and business-scoped. A vendor
   owner can (once the staff-management UI is extended) create custom roles like "Weekend Manager" and attach
   specific permissions (`quotation.respond`, `menu.edit`, `branch.availability.edit`, ...), optionally scoped to
   one business via `UserRole.businessId`. `hasPermission()` checks both layers and always grants business owners
   full control of their own business without needing explicit rows.

### Payment separated from quotation approval
There is no payment code path that doesn't originate from `payQuotationAction`, which itself refuses to run unless
`quotation.status === "PAYMENT_PENDING"` — a state only reachable after the buyer has explicitly accepted a
quotation (`respondToQuotationAction` with `action: "ACCEPT"`). The actual gateway call is a placeholder
(`PLACEHOLDER_MANUAL` provider, marked `SUCCESS` immediately) so the rest of the flow — order creation, scheduling,
notifications — can be exercised end-to-end before a real gateway is wired.

---

## 2. Location-aware UX layer (address book, map, search, bottom nav)

On top of the quotation/ordering core, the app now has the discovery UX people expect from Uber Eats-style apps —
built without any paid mapping API key:

- **Address book** (`src/lib/address-store.tsx`) — a client-side context that holds the buyer's selected
  address/location and their delivery-vs-pickup preference, persisted to `localStorage` so it survives reloads.
  Buyers can save multiple named addresses (`BuyerAddress`) by typing them manually, or by tapping "Use current
  location" (browser Geolocation API) to auto-fill coordinates — no reverse-geocoding API needed since the street
  address is always typed by the person, only the lat/lng is captured automatically.
- **Address bar** (top-left of the header, `src/components/address-bar.tsx`) — shows the shortened selected
  address (house number + street only, via `shortenAddress()`), with a dropdown to switch addresses, use current
  location, or toggle delivery/pickup — the same toggle is reused on the map page and syncs the default
  fulfillment choice in both the quotation builder and instant-order cart.
- **Bottom navigation** (`src/components/bottom-nav.tsx`) — a fixed mobile tab bar (Home, Map, Search, Cart,
  Profile), hidden on vendor/admin/driver dashboards and desktop widths, matching the mobile-app navigation
  pattern.
- **Map page** (`/map`) — a real interactive map using **Leaflet + OpenStreetMap tiles**, which require no API key
  or billing account (unlike Google Maps). It plots every active vendor branch, centers on the buyer's selected
  location, and includes the same search bar and delivery/pickup toggle as the rest of the app, with a synced
  vendor list beside the map. The Leaflet map is dynamically imported with `ssr: false` since it depends on
  `window`, and uses CSS-drawn pin icons instead of image assets to avoid the usual Leaflet-in-Next.js broken-icon
  issue.
- **Search page** (`/search`) — searches menu item names (not just vendor names) and returns every vendor selling
  a match, with a result count and a food-category icon row (kota, biscuits, pizza, braai, etc. — `lucide-react`
  icons rather than stock photography, since no image-generation step is part of this build) for one-tap browsing.
- **Nearby vendors** on the homepage — once a location is set, a horizontally-scrolling "Near you" section fetches
  real distance-ranked vendors via `getNearbyVendorsAction`, using the same haversine math as branch-level delivery
  checks.

## 3. Uber-Eats-parity features and legal pages

To close the gap with a mature food-delivery app while keeping the quotation-first differentiator, this layer
was added on top of everything in Section 2:

- **Store open/closed status** (`src/lib/store-hours.ts`) — computed live from each branch's `OperatingHour` rows
  against the current time. Shown as a badge on the vendor page; instant ordering defaults to "schedule for
  later" when a store is currently closed (quotations remain requestable regardless, since a vendor can respond
  once they reopen).
- **Order cancellation** (`src/server/actions/orders.ts`) — buyers can self-cancel an order (with an optional
  reason) any time before the vendor marks it "in preparation"; the associated payment is marked refunded. Past
  that point, cancellation requires contacting the vendor, per the Refund & Cancellation Policy.
- **Reorder ("order again")** — pulls the previous order's line items, filters to what's still instant-orderable
  at that branch today, and drops the buyer back onto the vendor page to rebuild and pay for a fresh cart (not a
  silent re-charge).
- **Promo codes** (`src/lib/promotions.ts`, `src/server/actions/promotions.ts`) — percentage-off, amount-off, or
  free-delivery codes, scoped platform-wide or per-business, with minimum order, usage limits, and per-buyer
  limits. Vendors create and pause their own codes from `/dashboard/vendor/promotions`.
- **Tipping** — a tip (percentage preset or custom amount) can be added at instant-order checkout or at
  quotation-payment time, tracked separately from the order subtotal on `Order.tipAmount`.
- **Favorites** — buyers can heart individual menu items (not just whole vendors), visible under
  `/dashboard/buyer/favorites`.
- **Dietary tags** — vendors can flag menu items as vegetarian, vegan, halal, kosher, contains-nuts, spicy, or
  gluten-free; shown as badges to buyers.
- **Receipts** — a printable/PDF-via-browser-print receipt at `/dashboard/buyer/orders/[id]/receipt` showing the
  full price breakdown (subtotal, discount, delivery fee, tip, total).
- **Help Center** (`/help`) — FAQ accordion plus a contact form that notifies every Admin/SuperAdmin in-app
  (email delivery hooks in once a provider is wired, per Section 5).
- **About page** (`/about`).
- **Legal document suite** (`/legal`) — Terms of Service, Privacy Policy (written with POPIA — South Africa's
  Protection of Personal Information Act — specifically in mind), Cookie Policy, Refund & Cancellation Policy,
  Vendor/Merchant Agreement, Driver Agreement, Community Guidelines, and an Accessibility Statement, all linked
  from the footer. **These are TechTur Solutions' drafted templates, not legal advice** — have them reviewed by a
  qualified attorney before relying on them in production.
- **Cookie consent banner** — a lightweight, dismissible notice (no ad/tracking cookies exist to consent to;
  it plainly explains the login cookie and the local-storage address preference).

## 4. Feature coverage

Everything below is real, working code wired end-to-end (server actions → Prisma → UI), not mockups.

**Buyer:** homepage with nearby-vendor discovery, dedicated map view and food/menu search, food-category
browsing, vendor discovery (search/filter/category), vendor detail with branch switching, live branch-level menu
availability, quotation builder with order-size guidance, instant-order cart + checkout (placeholder payment),
delivery/pickup toggle and saved-address book (manual entry or geolocation), quotation review/accept/decline,
order tracking with a status timeline, order history, saved vendors, profile settings, reviews (vendor + driver),
in-app messaging with vendors, notification bell + full notification inbox, mobile bottom navigation
(Home/Map/Search/Cart/Profile).

**Vendor:** business onboarding, dashboard overview, quotation inbox with revise/accept/decline tools, order
management with fulfillment status updates, driver dispatch, full menu CRUD (categories, items, pricing,
quotation/instant-order/stock-visibility flags) with image/video upload, branch management (add branches,
per-branch fulfillment/delivery-radius/instant-order/active toggles, operating-hours editor, per-branch/per-item
availability + stock), business settings (description, category, contact, min order, lead time, ordering mode),
staff invitations, a custom role/permission builder, analytics (revenue, quotation acceptance rate, top items,
orders by branch), and messaging with buyers.

**Driver:** assignment list, availability toggle, per-assignment status progression (accepted → en route → picked
up → en route → delivered).

**Admin/SuperAdmin:** platform-wide stats, vendor verification queue (approve/reject), all-businesses list with
suspend/restore, user management with search and suspend/restore, platform settings (delivery-fee model, support
contact).

**Platform-wide:** RBAC/PBAC enforced in every mutating server action, quotation state machine with payment
structurally gated behind approval, branch-aware delivery/pickup/quotation-only resolution via haversine distance,
order-size classification, sitemap.xml + robots.txt, custom 404/error pages, loading skeletons, and baseline
security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

## 5. What's still a placeholder, on purpose

Per the brief, these are intentionally not wired to real external services, but every code path around them is
real:
- **Payments** simulate success immediately (`PLACEHOLDER_MANUAL` provider) — swap in a real gateway in
  `payQuotationAction` / `createInstantOrderAction`.
- **Maps/geocoding** — branch and address coordinates are entered manually; distance math is a real haversine
  calculation, not a mock. Add a geocoding API for address autocomplete later.
- **Email/SMS** — every notification-worthy event already creates a `Notification` row; only the outbound
  send (email/SMS provider call) is missing.
- **File storage** — local disk (`/public/uploads`) in dev; swap `src/lib/storage.ts` for S3/Spaces in production.

Two things worth knowing about the current implementation as you extend it: the driver-review flow adds a
`Review` for the assigned driver whenever a buyer rates a completed order that had a delivery, and the
`hasPermission()` check treats `SUPERADMIN` and a business's own `ownerId` as always-authorized — every other
permission (including `ADMIN`'s platform-level actions) goes through an explicit `UserRole` row, which is why the
seed script assigns the seeded Admin the `support_admin` role and the seeded vendor staff member the
`vendor_manager` role. If you create new admin or staff accounts outside the seed script, assign them a role the
same way (see `prisma/seed.ts` for the pattern) or they'll be able to log in but won't be able to act.

## 6. What a true Uber-Eats-scale platform still needs beyond this codebase

Being direct about the ceiling of what one codebase (without live infrastructure) can deliver: real-time GPS
tracking (would need WebSockets/Pusher + a live map UI), push notifications (native mobile wrapper or web push),
a production payment gateway with webhook reconciliation, geocoding/address autocomplete, load-tested
infrastructure (CDN, read replicas, caching layer) for national scale, and a review/moderation pipeline for
user-generated content. None of these are hidden — the schema and code structure were built so each one is an
additive integration, not a rewrite.

---

## 7. Local development (Windows 10)

### Prerequisites
- Node.js 20+ (LTS) — https://nodejs.org
- PostgreSQL 15+ — either installed natively for Windows, or via WSL2 (recommended: `wsl --install`, then
  `sudo apt install postgresql`)
- Git

### Setup
```powershell
git clone <your-repo-url> rekadijo
cd rekadijo
npm install
copy .env.example .env
```

Edit `.env`:
- Set `DATABASE_URL` to your local Postgres instance, e.g.
  `postgresql://rekadijo_user:changeme@localhost:5432/rekadijo_dev?schema=public`
- Set `AUTH_SECRET` to a random string (PowerShell: `[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))`)

Create the database and user (in `psql`):
```sql
CREATE USER rekadijo_user WITH PASSWORD 'changeme';
CREATE DATABASE rekadijo_dev OWNER rekadijo_user;
```

Run migrations and seed data:
```powershell
npm run db:migrate
npm run db:seed
```

Start the dev server (runs on port **3400** to avoid clashing with common ports 3000/3001/4000):
```powershell
npm run dev
```

Visit http://localhost:3400. Log in with any of the seed accounts (password `Password@123`):

| Role | Email |
|---|---|
| SuperAdmin | superadmin@rekadijo.co.za |
| Admin | admin@rekadijo.co.za |
| Vendor (TR. Matsipa Market) | vendor@rekadijo.co.za |
| Vendor staff | staff@rekadijo.co.za |
| Buyer | buyer@rekadijo.co.za |
| Driver | driver@rekadijo.co.za |

A sample promo code (`WELCOME20` — 20% off, min order R50, capped at R60 off) is seeded against TR. Matsipa
Market for testing the instant-order checkout flow.

`npm run db:studio` opens Prisma Studio to browse/edit data directly.

---

## 8. Deployment (Ubuntu VPS, `rekadijo.techtursolutions.com`)

```bash
sudo apt update && sudo apt install -y postgresql nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Database
sudo -u postgres psql -c "CREATE USER rekadijo_user WITH PASSWORD 'STRONG_PASSWORD_HERE';"
sudo -u postgres psql -c "CREATE DATABASE rekadijo_prod OWNER rekadijo_user;"

# App
git clone <your-repo-url> /var/www/rekadijo
cd /var/www/rekadijo
npm ci
cp .env.example .env.production
# edit .env.production: DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL=https://rekadijo.techtursolutions.com

npm run db:deploy      # applies migrations without prompting (safe for prod)
npm run db:seed        # optional — only if you want the seed/demo data in prod; skip for a clean launch
npm run build

pm2 start npm --name rekadijo -- start
pm2 save
pm2 startup            # follow the printed instructions to enable boot-start
```

### Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name rekadijo.techtursolutions.com;

    location / {
        proxy_pass http://127.0.0.1:3400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Then add HTTPS with Certbot: `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d rekadijo.techtursolutions.com`.

### Deploying updates
```bash
cd /var/www/rekadijo
git pull
npm ci
npm run db:deploy
npm run build
pm2 restart rekadijo
```

---

## 9. Wiring external services later

Nothing below is required to run the platform end-to-end today (payments simulate success, and delivery
distance/fees are computed locally) — but here's where to plug in real providers when ready:

| Service | File(s) to change | Notes |
|---|---|---|
| Payment gateway | `src/server/actions/quotations.ts` (`payQuotationAction`), `.env` `PAYMENT_*` | Replace the placeholder `Payment` creation with a real gateway call + webhook handler. |
| Maps/geocoding | `src/lib/geo.ts`, vendor onboarding form | Currently uses manually-entered lat/lng + haversine distance. Add address autocomplete and geocoding once a Maps API key is available. |
| Email/SMS | New `src/lib/notify.ts` (not yet created) hooking into every `prisma.notification.create(...)` call | Notification *records* are already created correctly everywhere; only the outbound send is missing. |
| File storage | `src/lib/storage.ts` | Local driver works today; swap the `driver === "local"` branch for S3/Spaces/etc. |

---

## 10. Project structure

```
prisma/
  schema.prisma       # full data model
  seed.ts              # dev seed data incl. TR. Matsipa Market
src/
  app/                 # Next.js App Router pages
    (auth)/login, register
    vendors/            # discovery, detail, join (onboarding)
    dashboard/
      buyer/ vendor/ admin/ driver/
  components/          # shared UI (header, footer, cards, badges, buttons)
  lib/                 # auth, rbac, geo, quotation state machine, storage, utils
  server/actions/      # all database mutations (auth, business, quotations)
  middleware.ts        # route protection by GlobalRole
```
