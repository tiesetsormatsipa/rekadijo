import Link from "next/link";
import { Star, MapPin, Zap, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type BusinessCardData = {
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
  const branch = business.branches[0];
  const rating = Number(business.avgRating ?? 0);

  return (
    <Link
      href={`/vendors/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-charcoal-100 to-cream-300 text-charcoal-300">
        <span className="font-display text-3xl">{business.name.charAt(0)}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-charcoal-900 group-hover:text-amber-700">{business.name}</h3>
          <span className="flex items-center gap-1 text-sm font-medium text-charcoal-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {rating > 0 ? rating.toFixed(1) : "New"}
          </span>
        </div>
        <p className="mt-1 text-sm text-charcoal-500">{business.category}</p>
        {branch && (
          <p className="mt-1 flex items-center gap-1 text-xs text-charcoal-400">
            <MapPin className="h-3 w-3" /> {branch.suburb ? `${branch.suburb}, ` : ""}
            {branch.city}
          </p>
        )}
        <div className="mt-3 flex gap-2">
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
        </div>
      </div>
    </Link>
  );
}
