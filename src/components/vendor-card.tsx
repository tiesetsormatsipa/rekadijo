import Link from "next/link";
import { Bike, FileText, MapPin, Navigation, ShoppingBag, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BranchListing } from "@/lib/branch-listings";

type BusinessCardData = Omit<Partial<BranchListing>, "avgRating" | "branches" | "orderingMode"> & {
  id: string;
  slug: string;
  name: string;
  category: string;
  avgRating: unknown;
  reviewCount: number;
  orderingMode: "QUOTATION_ONLY" | "INSTANT_ONLY" | "BOTH";
  branches: Array<{ city: string; suburb: string | null }>;
};

export function VendorCard({ business }: { business: BusinessCardData }) {
  const branch = business.branch ?? business.branches[0];
  const rating = Number(business.avgRating ?? 0);
  const href = business.branchId ? `/vendors/${business.slug}?branch=${business.branchId}` : `/vendors/${business.slug}`;
  const locationLabel = branch ? [branch.suburb, branch.city].filter(Boolean).join(", ") : null;
  const branchName = business.branch?.name ?? locationLabel;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-amber-100 via-cream-200 to-olive-100 text-charcoal-300">
        <span className="font-display text-3xl text-charcoal-500">{business.name.charAt(0)}</span>
        {business.distanceKm != null && (
          <span className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-charcoal-700 shadow-sm">
            {business.distanceKm.toFixed(1)} km
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-charcoal-900 group-hover:text-amber-700">{business.name}</h3>
            {branchName && <p className="mt-0.5 text-xs font-medium text-charcoal-500">{branchName}</p>}
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-charcoal-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {rating > 0 ? rating.toFixed(1) : "New"}
          </span>
        </div>
        <p className="mt-1 text-sm text-charcoal-500">{business.category}</p>
        {locationLabel && (
          <p className="mt-1 flex items-center gap-1 text-xs text-charcoal-400">
            <MapPin className="h-3 w-3" /> {locationLabel}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {(business.orderingMode === "BOTH" || business.orderingMode === "INSTANT_ONLY") && (
            <Badge tone="success">
              <Zap className="mr-1 h-3 w-3" /> Instant order
            </Badge>
          )}
          {(business.orderingMode === "BOTH" || business.orderingMode === "QUOTATION_ONLY") && (
            <Badge tone="info">
              <FileText className="mr-1 h-3 w-3" /> Quotation
            </Badge>
          )}
          {business.branch?.fulfillmentType === "PICKUP" && (
            <Badge tone="warning">
              <ShoppingBag className="mr-1 h-3 w-3" /> Pickup
            </Badge>
          )}
          {business.branch?.fulfillmentType === "DELIVERY" && (
            <Badge tone="success">
              <Bike className="mr-1 h-3 w-3" /> Delivery
            </Badge>
          )}
          {business.branch?.fulfillmentType === "EITHER" && (
            <Badge tone="neutral">
              <Navigation className="mr-1 h-3 w-3" /> Pickup or delivery
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
