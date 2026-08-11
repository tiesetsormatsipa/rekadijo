import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuotationBuilder } from "@/components/quotation-builder";
import { InstantOrderCart } from "@/components/instant-order-cart";
import { SaveVendorButton } from "@/components/save-vendor-button";
import { ReviewsList } from "@/components/reviews-list";
import { FavoriteItemButton } from "@/components/favorite-item-button";
import { getCurrentUser } from "@/lib/auth";
import { resolveOpenStatus, formatOpenStatus } from "@/lib/store-hours";

export default async function VendorDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { branch?: string };
}) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
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
            include: { options: true, branchAvailability: true }
          }
        }
      }
    }
  });

  if (!business || business.status !== "APPROVED") notFound();

  const activeBranch =
    business.branches.find((b) => b.id === searchParams.branch) ?? business.branches[0] ?? null;

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
    ? new Set(
        (
          await prisma.favoriteMenuItem.findMany({
            where: { userId: user.id, menuItem: { businessId: business.id } },
            select: { menuItemId: true }
          })
        ).map((f) => f.menuItemId)
      )
    : new Set<string>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
            {business.menuCategories.map((category) => (
              <div key={category.id} className="mb-8">
                <h3 className="font-display text-xl font-semibold text-charcoal-900">{category.name}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {category.items.map((item) => {
                    const availability = item.branchAvailability.find((a) => a.branchId === activeBranch.id);
                    const isAvailable = availability?.isAvailable ?? true;
                    const isInstant = availability?.isInstantOrderable ?? item.allowInstantOrder;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 ${
                          isAvailable ? "border-charcoal-100 bg-white" : "border-charcoal-100 bg-charcoal-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-charcoal-900">{item.name}</p>
                            {item.description && <p className="mt-0.5 text-xs text-charcoal-500">{item.description}</p>}
                          </div>
                          <div className="flex flex-none items-start gap-1">
                            <p className="whitespace-nowrap font-semibold text-charcoal-900">
                              R{Number(item.basePrice).toFixed(0)}
                              {item.unitLabel && <span className="text-xs font-normal text-charcoal-400"> /{item.unitLabel}</span>}
                            </p>
                            {user && <FavoriteItemButton menuItemId={item.id} initiallyFavorited={favoriteIds.has(item.id)} />}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {!isAvailable && <Badge tone="danger">Unavailable at this branch</Badge>}
                          {isAvailable && isInstant && <Badge tone="success">Instant order</Badge>}
                          {isAvailable && item.allowQuotation && <Badge tone="info">Quotation</Badge>}
                          {availability?.stockQuantity != null &&
                            item.showStockToBuyer &&
                            availability.stockQuantity <= (availability.lowStockThreshold ?? 5) && (
                              <Badge tone="warning">Low stock</Badge>
                            )}
                          {item.dietaryTags.map((tag) => (
                            <Badge key={tag} tone="neutral">
                              {tag.replaceAll("_", " ").toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {activeBranch.acceptsInstantOrders && (
              <InstantOrderCart
                businessId={business.id}
                branchId={activeBranch.id}
                branchLat={Number(activeBranch.latitude)}
                branchLng={Number(activeBranch.longitude)}
                deliveryRadiusKm={activeBranch.deliveryRadiusKm != null ? Number(activeBranch.deliveryRadiusKm) : null}
                fulfillmentType={activeBranch.fulfillmentType}
                isOpen={resolveOpenStatus(activeBranch.operatingHours).isOpen}
                items={business.menuCategories.flatMap((cat) =>
                  cat.items
                    .filter((item) => {
                      const availability = item.branchAvailability.find((a) => a.branchId === activeBranch.id);
                      const isAvailable = availability?.isAvailable ?? true;
                      const isInstant = availability?.isInstantOrderable ?? item.allowInstantOrder;
                      return isAvailable && isInstant;
                    })
                    .map((item) => ({
                      id: item.id,
                      name: item.name,
                      basePrice: Number(item.basePrice),
                      unitLabel: item.unitLabel,
                      options: item.options.map((o) => ({ choiceLabel: o.choiceLabel, priceDelta: Number(o.priceDelta) }))
                    }))
                )}
              />
            )}

            <QuotationBuilder
              businessId={business.id}
              branchId={activeBranch.id}
              branchLat={Number(activeBranch.latitude)}
              branchLng={Number(activeBranch.longitude)}
              deliveryRadiusKm={activeBranch.deliveryRadiusKm != null ? Number(activeBranch.deliveryRadiusKm) : null}
              fulfillmentType={activeBranch.fulfillmentType}
              menuCategories={business.menuCategories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                items: cat.items
                  .filter((item) => {
                    const availability = item.branchAvailability.find((a) => a.branchId === activeBranch.id);
                    return availability?.isAvailable ?? true;
                  })
                  .map((item) => ({
                    id: item.id,
                    name: item.name,
                    basePrice: Number(item.basePrice),
                    unitLabel: item.unitLabel,
                    minQuantity: item.minQuantity,
                    maxQuantity: item.maxQuantity,
                    options: item.options.map((o) => ({ choiceLabel: o.choiceLabel, priceDelta: Number(o.priceDelta) }))
                  }))
              }))}
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
