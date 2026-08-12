import type { FulfillmentType, OrderingMode } from "@prisma/client";

export type BranchListing = {
  id: string;
  businessId: string;
  branchId: string;
  slug: string;
  name: string;
  category: string;
  avgRating: number;
  reviewCount: number;
  orderingMode: OrderingMode;
  imageUrl: string | null;
  branch: {
    name: string;
    city: string;
    suburb: string | null;
    fulfillmentType: FulfillmentType;
    deliveryRadiusKm: number | null;
    acceptsInstantOrders: boolean;
  };
  branches: Array<{ city: string; suburb: string | null }>;
  distanceKm?: number;
};

type BusinessWithBranches = {
  id: string;
  slug: string;
  name: string;
  category: string;
  avgRating: unknown;
  reviewCount: number;
  orderingMode: OrderingMode;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  branches: Array<{
    id: string;
    name: string;
    city: string;
    suburb: string | null;
    fulfillmentType: FulfillmentType;
    deliveryRadiusKm: unknown;
    acceptsInstantOrders: boolean;
  }>;
};

export function createBranchListings<TBusiness extends BusinessWithBranches>(
  businesses: TBusiness[],
  options: { limit?: number; distancesByBranchId?: Map<string, number> } = {}
): BranchListing[] {
  const listings = businesses.flatMap((business) =>
    business.branches.map((branch) => ({
      id: `${business.id}:${branch.id}`,
      businessId: business.id,
      branchId: branch.id,
      slug: business.slug,
      name: business.name,
      category: business.category,
      avgRating: Number(business.avgRating ?? 0),
      reviewCount: business.reviewCount,
      orderingMode: business.orderingMode,
      imageUrl: business.coverImageUrl ?? business.logoUrl ?? null,
      branch: {
        name: branch.name,
        city: branch.city,
        suburb: branch.suburb,
        fulfillmentType: branch.fulfillmentType,
        deliveryRadiusKm: branch.deliveryRadiusKm != null ? Number(branch.deliveryRadiusKm) : null,
        acceptsInstantOrders: branch.acceptsInstantOrders
      },
      branches: [{ city: branch.city, suburb: branch.suburb }],
      distanceKm: options.distancesByBranchId?.get(branch.id)
    }))
  );

  return typeof options.limit === "number" ? listings.slice(0, options.limit) : listings;
}
