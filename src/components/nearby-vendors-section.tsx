"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation, Star, MapPin } from "lucide-react";
import { useAddressStore } from "@/lib/address-store";
import { getNearbyVendorsAction, type NearbyVendorResult } from "@/server/actions/discovery";

export function NearbyVendorsSection() {
  const { selected, useCurrentLocation: requestCurrentLocation, locating } = useAddressStore();
  const [vendors, setVendors] = useState<NearbyVendorResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected || selected.lat == null || selected.lng == null) {
      setVendors(null);
      return;
    }
    setLoading(true);
    getNearbyVendorsAction(selected.lat, selected.lng)
      .then(setVendors)
      .finally(() => setLoading(false));
  }, [selected]);

  if (!selected || selected.lat == null) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <button
          onClick={() => requestCurrentLocation().catch(() => {})}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-charcoal-200 bg-white p-6 text-sm font-medium text-charcoal-600 hover:border-amber-400 hover:text-amber-700 disabled:opacity-50"
        >
          <Navigation className="h-4 w-4" />
          {locating ? "Finding your location..." : "Share your location to see vendors near you"}
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-charcoal-900">Near you</h2>
        <Link href="/map" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
          View on map
        </Link>
      </div>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {loading && <p className="text-sm text-charcoal-400">Finding nearby vendors...</p>}
        {!loading && vendors?.length === 0 && <p className="text-sm text-charcoal-400">No vendors found nearby yet.</p>}
        {vendors?.map((v) => (
          <Link
            key={v.id}
            href={`/vendors/${v.slug}`}
            className="w-64 flex-none rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <p className="font-semibold text-charcoal-900">{v.name}</p>
            <p className="mt-0.5 text-xs text-charcoal-500">{v.category}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-charcoal-500">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {v.avgRating > 0 ? v.avgRating.toFixed(1) : "New"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {v.distanceKm.toFixed(1)} km
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
