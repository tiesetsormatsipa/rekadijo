/**
 * Geo + delivery-availability logic
 * ──────────────────────────────────
 * Pure functions, no DB access, so they're easy to unit test and reuse
 * both server-side (page data loading, quotation validation) and in
 * lightweight client-side previews.
 */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

export type BranchLike = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number | null;
  fulfillmentType: "PICKUP" | "DELIVERY" | "EITHER";
  isActive: boolean;
};

export type DeliveryAvailability =
  | { mode: "DELIVERY_AVAILABLE"; distanceKm: number | null; message: string }
  | { mode: "PICKUP_ONLY"; distanceKm: number | null; message: string }
  | { mode: "QUOTATION_ONLY"; distanceKm: number | null; message: string }
  | { mode: "NOT_AVAILABLE"; distanceKm: number | null; message: string };

/**
 * Determines what a specific buyer can do at a specific branch, given
 * buyer location (optional — buyer may not have shared location yet).
 */
export function resolveDeliveryAvailability(
  branch: BranchLike,
  buyerLocation: LatLng | null
): DeliveryAvailability {
  if (!branch.isActive) {
    return { mode: "NOT_AVAILABLE", distanceKm: null, message: "This branch is currently closed." };
  }

  const distanceKm = buyerLocation
    ? haversineDistanceKm(buyerLocation, { lat: branch.latitude, lng: branch.longitude })
    : null;

  const supportsDelivery = branch.fulfillmentType !== "PICKUP";
  const supportsPickup = branch.fulfillmentType !== "DELIVERY";

  if (!supportsDelivery) {
    return supportsPickup
      ? { mode: "PICKUP_ONLY", distanceKm, message: "This branch offers pickup only." }
      : { mode: "QUOTATION_ONLY", distanceKm, message: "Contact this branch via a quotation request." };
  }

  if (distanceKm === null) {
    // Unknown buyer location — allow the buyer to proceed, fee is computed later.
    return {
      mode: "DELIVERY_AVAILABLE",
      distanceKm: null,
      message: "Share your location to confirm delivery availability and fee."
    };
  }

  const radius = branch.deliveryRadiusKm ?? 0;
  if (radius > 0 && distanceKm > radius) {
    return supportsPickup
      ? {
          mode: "PICKUP_ONLY",
          distanceKm,
          message: `Not available for delivery to your location (${distanceKm.toFixed(
            1
          )} km away, branch delivers within ${radius} km). Pickup is available.`
        }
      : {
          mode: "NOT_AVAILABLE",
          distanceKm,
          message: `Not available for delivery to your location (${distanceKm.toFixed(1)} km away).`
        };
  }

  return {
    mode: "DELIVERY_AVAILABLE",
    distanceKm,
    message: `Delivery available — approximately ${distanceKm.toFixed(1)} km away.`
  };
}

/** Ranks branches of a business by distance to the buyer (nearest first). Unknown location keeps input order. */
export function rankBranchesByDistance<T extends BranchLike>(
  branches: T[],
  buyerLocation: LatLng | null
): Array<T & { distanceKm: number | null }> {
  const withDistance = branches.map((branch) => ({
    ...branch,
    distanceKm: buyerLocation
      ? haversineDistanceKm(buyerLocation, { lat: branch.latitude, lng: branch.longitude })
      : null
  }));

  if (!buyerLocation) return withDistance;
  return withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

/** Simple linear delivery fee model: base fee + per-km rate, capped. Real pricing can be swapped in later. */
export function estimateDeliveryFee(distanceKm: number, opts?: { baseFee?: number; perKm?: number; cap?: number }) {
  const baseFee = opts?.baseFee ?? 25;
  const perKm = opts?.perKm ?? 6;
  const cap = opts?.cap ?? 250;
  return Math.min(cap, Math.round(baseFee + distanceKm * perKm));
}

// ─────────────────────────────────────────────────────────────────────────
// Order size / bulk-order guidance
// ─────────────────────────────────────────────────────────────────────────

export type OrderSizeCategory = "SMALL" | "MEDIUM" | "LARGE" | "BULK";

export function classifyOrderSize(totalUnits: number): {
  category: OrderSizeCategory;
  label: string;
  guidance: string;
} {
  if (totalUnits <= 10) {
    return {
      category: "SMALL",
      label: "Small order",
      guidance: "Easy to hand-carry on pickup."
    };
  }
  if (totalUnits <= 30) {
    return {
      category: "MEDIUM",
      label: "Medium order",
      guidance: "Consider a shopping bag or box for pickup."
    };
  }
  if (totalUnits <= 80) {
    return {
      category: "LARGE",
      label: "Large order",
      guidance: "A car boot or large containers are recommended for pickup."
    };
  }
  return {
    category: "BULK",
    label: "Bulk / event order",
    guidance:
      "This is a bulk order. We recommend a vehicle with load space, and confirming a collection window with the vendor. Delivery may be more convenient."
  };
}
