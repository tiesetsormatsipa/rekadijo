import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuotationBuilder } from "@/components/quotation-builder";
import { InstantOrderCart } from "@/components/instant-order-cart";
import { VendorOrderPanel } from "@/components/vendor-order-panel";
import { MobileCartBar } from "@/components/mobile-cart-bar";
import { VendorMenuItems } from "@/components/vendor-menu-items";
import { SaveVendorButton } from "@/components/save-vendor-button";
import { ReviewsList } from "@/components/reviews-list";
import { getCurrentUser } from "@/lib/auth";
import { resolveOpenStatus, formatOpenStatus } from "@/lib/store-hours";

const MENU_FALLBACK_IMAGES = [
  "/uploads/00ff777a-46a0-4757-99d9-cd977e789ac6.jfif",
  "/uploads/0016d500-167a-4ad2-86db-c2d4efa57c4c.jfif",
  "/uploads/1fdcc778-2cb9-4f1c-a9e2-b0e43f3cd58c.jfif",
  "/uploads/c1baedf7-f841-421a-8fdb-5d4e14782dc7.jfif",
  "/uploads/dce150d7-c5aa-463e-b75e-ace5386524a1.jfif"
];

function fallbackImageFor(seed: string) {
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % MENU_FALLBACK_IMAGES.length;
  return MENU_FALLBACK_IMAGES[index];
}

export default async function VendorDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { slug } = await params;
  const { branch } = await searchParams;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      branches: {
        where: { isActive: true },
        include: { operatingHours: true }
      },
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isActive: true, deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: { options: true, branchAvailability: true, media: { orderBy: { sortOrder: "asc" }, take: 1 } }
          }
        }
      }
    }
  });

  if (!business || business.status !== "APPROVED") notFound();

  const activeBranch =
    business.branches.find((b) => b.id === branch) ?? business.branches[0] ?? null;

  const user = await getCurrentUser();
  const savedVendor = user
    ? await prisma.savedVendor.findUnique({ where: { userId_businessId: { userId: user.id, businessId: business.id } } })
    : null;

  const reviews = await prisma.review.findMany({
    where: { businessId: business.id },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const favoriteIds = user
    ? (
        await prisma.favoriteMenuItem.findMany({
          where: { userId: user.id, menuItem: { businessId: business.id } },
          select: { menuItemId: true }
        })
      ).map((f) => f.menuItemId)
    : [];

  const menuCategories = business.menuCategories.map((category) => ({
    id: category.id,
    name: category.name,
    items: category.items.map((item) => {
      const availability = item.branchAvailability.find((a) => a.branchId === activeBranch?.id);
      const isAvailable = availability?.isAvailable ?? true;
      const isInstant = availability?.isInstantOrderable ?? item.allowInstantOrder;
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        basePrice: Number(item.basePrice),
        unitLabel: item.unitLabel,
        minQuantity: item.minQuantity,
        imageUrl: item.media[0]?.url ?? fallbackImageFor(item.name),
        dietaryTags: item.dietaryTags,
        isAvailable,
        isInstant,
        allowQuotation: item.allowQuotation,
        showLowStock:
          availability?.stockQuantity != null &&
          item.showStockToBuyer &&
          availability.stockQuantity <= (availability.lowStockThreshold ?? 5),
        options: item.options.map((o) => ({
          name: o.name,
          choiceLabel: o.choiceLabel,
          priceDelta: Number(o.priceDelta),
          isDefault: o.isDefault
        }))
      };
    })
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 pb-20 lg:pb-10">
      {activeBranch && activeBranch.acceptsInstantOrders && (
        <MobileCartBar businessId={business.id} branchId={activeBranch.id}>
          <InstantOrderCart
            businessId={business.id}
            branchId={activeBranch.id}
            minOrderAmount={business.minOrderAmount ? Number(business.minOrderAmount) : null}
            branchLat={Number(activeBranch.latitude)}
            branchLng={Number(activeBranch.longitude)}
            deliveryRadiusKm={activeBranch.deliveryRadiusKm != null ? Number(activeBranch.deliveryRadiusKm) : null}
            fulfillmentType={activeBranch.fulfillmentType}
            isOpen={resolveOpenStatus(activeBranch.operatingHours).isOpen}
          />
        </MobileCartBar>
      )}

      <div className="flex flex-col gap-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-charcoal-900">{business.name}</h1>
            <span className="flex items-center gap-1 text-sm font-medium text-charcoal-700">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              {Number(business.avgRating).toFixed(1)} ({business.reviewCount})
            </span>
          </div>
          <p className="mt-1 text-charcoal-500">{business.category}</p>
          {business.description && <p className="mt-3 max-w-2xl text-sm text-charcoal-600">{business.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(business.orderingMode === "BOTH" || business.orderingMode === "INSTANT_ONLY") && (
              <Badge tone="success">Instant ordering available (per branch)</Badge>
            )}
            {(business.orderingMode === "BOTH" || business.orderingMode === "QUOTATION_ONLY") && (
              <Badge tone="info">Quotation-based ordering</Badge>
            )}
            {business.minOrderAmount && <Badge tone="neutral">Min order R{Number(business.minOrderAmount)}</Badge>}
          </div>
        </div>
        {user && <SaveVendorButton businessId={business.id} initiallySaved={Boolean(savedVendor)} />}
      </div>

      {/* Branch selector */}
      {business.branches.length > 1 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-500">
            {business.branches.length} branches — same business, shared menu
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {business.branches.map((branch) => (
              <a
                key={branch.id}
                href={`?branch=${branch.id}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeBranch?.id === branch.id
                    ? "border-amber-600 bg-amber-50 text-amber-800"
                    : "border-charcoal-200 bg-white text-charcoal-600 hover:bg-charcoal-50"
                }`}
              >
                {branch.city}
                {branch.suburb ? ` — ${branch.suburb}` : ""}
              </a>
            ))}
          </div>
        </div>
      )}

      {activeBranch && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-charcoal-50 p-4 text-sm text-charcoal-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {activeBranch.addressLine}, {activeBranch.city}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Lead time: {business.leadTimeHours}h
          </span>
          <Badge tone={activeBranch.fulfillmentType === "PICKUP" ? "warning" : "success"}>
            {activeBranch.fulfillmentType === "PICKUP"
              ? "Pickup only at this branch"
              : activeBranch.fulfillmentType === "DELIVERY"
              ? "Delivery only"
              : `Pickup or delivery (within ${activeBranch.deliveryRadiusKm ?? "—"} km)`}
          </Badge>
          {(() => {
            const status = resolveOpenStatus(activeBranch.operatingHours);
            return <Badge tone={status.isOpen ? "success" : "danger"}>{formatOpenStatus(status)}</Badge>;
          })()}
        </div>
      )}

      {!activeBranch && (
        <p className="mt-6 rounded-xl border border-dashed border-charcoal-200 p-8 text-center text-charcoal-500">
          This vendor has no active branches right now.
        </p>
      )}

      {activeBranch && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="sticky top-16 z-20 -mx-4 mb-6 overflow-x-auto border-y border-charcoal-100 bg-cream-200/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-white">
              <div className="flex gap-2">
                {business.menuCategories.map((category) => (
                  <a
                    key={category.id}
                    href={`#category-${category.id}`}
                    className="flex-none rounded-full border border-charcoal-200 bg-white px-4 py-2 text-sm font-semibold text-charcoal-700 transition hover:border-charcoal-900 hover:text-charcoal-900"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </div>
            <VendorMenuItems
              businessId={business.id}
              branchId={activeBranch.id}
              categories={menuCategories}
              favoriteIds={favoriteIds}
              isLoggedIn={Boolean(user)}
              hasInstant={activeBranch.acceptsInstantOrders}
            />
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <VendorOrderPanel
              hasInstant={activeBranch.acceptsInstantOrders}
              instant={
                activeBranch.acceptsInstantOrders ? (
                  <InstantOrderCart
                    businessId={business.id}
                    branchId={activeBranch.id}
                    minOrderAmount={business.minOrderAmount ? Number(business.minOrderAmount) : null}
                    branchLat={Number(activeBranch.latitude)}
                    branchLng={Number(activeBranch.longitude)}
                    deliveryRadiusKm={activeBranch.deliveryRadiusKm != null ? Number(activeBranch.deliveryRadiusKm) : null}
                    fulfillmentType={activeBranch.fulfillmentType}
                    isOpen={resolveOpenStatus(activeBranch.operatingHours).isOpen}
                  />
                ) : null
              }
              quotation={
                <QuotationBuilder
                  businessId={business.id}
                  branchId={activeBranch.id}
                  branchLat={Number(activeBranch.latitude)}
                  branchLng={Number(activeBranch.longitude)}
                  deliveryRadiusKm={activeBranch.deliveryRadiusKm != null ? Number(activeBranch.deliveryRadiusKm) : null}
                  fulfillmentType={activeBranch.fulfillmentType}
                />
              }
            />
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-12">
        <ReviewsList reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          authorName: r.author.firstName
        }))} />
      </div>
    </div>
  );
}
