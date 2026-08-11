"use server";

import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";

export type NearbyVendorResult = {
  id: string; 
  slug: string;
  name: string; 
  category: string;
  avgRating: number;
  reviewCount: number;
  orderingMode: "QUOTATION_ONLY" | "INSTANT_ONLY" | "BOTH";
  branches: Array<{ city: string; suburb: string | null }>;
  distanceKm: number;
};

export async function getNearbyVendorsAction(lat: number, lng: number, limit = 8): Promise<NearbyVendorResult[]> {
  const businesses = await prisma.business.findMany({
    where: { status: "APPROVED", deletedAt: null },
    include: { 
      branches: { 
        where: { isActive: true } 
      } 
    }
  });

  const allBranchListings: NearbyVendorResult[] = [];

  for (const b of businesses) {
    for (const branch of b.branches) {
      const distance = haversineDistanceKm(
        { lat, lng }, 
        { lat: Number(branch.latitude), lng: Number(branch.longitude) }
      );
      const allowedRadius = branch.deliveryRadiusKm ? Number(branch.deliveryRadiusKm) : 15;

      if (distance > allowedRadius) {
        continue;
      }

      allBranchListings.push({
        id: branch.id, 
        slug: `${b.slug}?branch=${branch.id}`, 
        name: branch.suburb ? `${b.name} (${branch.suburb})` : `${b.name} (${branch.city})`,
        category: b.category,
        avgRating: Number(b.avgRating),
        reviewCount: b.reviewCount,
        orderingMode: b.orderingMode,
        branches: [{ city: branch.city, suburb: branch.suburb }],
        distanceKm: distance
      });
    }
  }

  const sortedAndFiltered = allBranchListings
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return sortedAndFiltered;
}
