"use client";

import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import dynamic from "next/dynamic";

const DriverTrackingMap = dynamic(
  () => import("@/components/driver-tracking-map").then((m) => m.DriverTrackingMap),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-charcoal-100" />
  }
);

type DriverCardProps = {
  driverName: string;
  vehicleType?: string | null;
  licensePlate?: string | null;
  status: string;
  currentLat?: number | null;
  currentLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  orderId: string;
  fulfillmentType: "DELIVERY" | "PICKUP" | "EITHER";
};

export function DriverCard({
  driverName,
  vehicleType,
  licensePlate,
  status,
  currentLat,
  currentLng,
  deliveryLat,
  deliveryLng,
  orderId,
  fulfillmentType
}: DriverCardProps) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(
    currentLat && currentLng ? { lat: Number(currentLat), lng: Number(currentLng) } : null
  );

  // Poll driver location every 30s (phase 1 — no WebSocket)
  useEffect(() => {
    if (fulfillmentType === "PICKUP") return;

    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const pollLocation = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/driver-location`);
        if (res.ok && mounted) {
          const data = await res.json();
          if (data.lat && data.lng) {
            setDriverLocation({ lat: data.lat, lng: data.lng });
          }
        }
      } catch (e) {
        console.error("Failed to fetch driver location:", e);
      }
    };

    // Initial check, then poll every 30s
    pollLocation();
    pollInterval = setInterval(pollLocation, 30000);

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId, fulfillmentType]);

  const showMap = fulfillmentType === "DELIVERY" && (driverLocation || deliveryLat);

  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Car className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-charcoal-900">{driverName}</p>
          <p className="text-sm text-charcoal-500">{status.replaceAll("_", " ")}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {vehicleType && (
          <div className="flex gap-2 text-charcoal-700">
            <span className="font-medium">Vehicle:</span>
            <span>{vehicleType}</span>
            {licensePlate && <span className="text-charcoal-500">({licensePlate})</span>}
          </div>
        )}
      </div>

      {showMap && (
        <div className="mt-4 overflow-hidden rounded-lg border border-charcoal-100">
          <DriverTrackingMap
            driverLat={driverLocation?.lat}
            driverLng={driverLocation?.lng}
            deliveryLat={deliveryLat != null ? Number(deliveryLat) : undefined}
            deliveryLng={deliveryLng != null ? Number(deliveryLng) : undefined}
          />
        </div>
      )}

      {fulfillmentType === "DELIVERY" && !driverLocation && (
        <p className="mt-4 text-sm text-charcoal-500">Driver location will appear once en route</p>
      )}
    </div>
  );
}
