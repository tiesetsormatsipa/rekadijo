"use client";

import { Check, Clock, Truck, MapPin } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

type TimelineStep = {
  key: OrderStatus;
  label: string;
  icon: React.ReactNode;
  description?: string;
};

const DELIVERY_TIMELINE: TimelineStep[] = [
  { key: "PAID", label: "Payment Confirmed", icon: <Check className="h-5 w-5" />, description: "Your payment has been received" },
  { key: "IN_PREPARATION", label: "Preparing", icon: <Clock className="h-5 w-5" />, description: "Your order is being prepared" },
  { key: "READY", label: "Ready for Pickup", icon: <Clock className="h-5 w-5" />, description: "Your order is ready" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: <Truck className="h-5 w-5" />, description: "Driver is on the way" },
  { key: "DELIVERED", label: "Delivered", icon: <MapPin className="h-5 w-5" />, description: "Order delivered" }
];

const QUOTATION_TIMELINE: TimelineStep[] = [
  { key: "PAID", label: "Payment Confirmed", icon: <Check className="h-5 w-5" />, description: "Your payment has been received" },
  { key: "SCHEDULED", label: "Scheduled", icon: <Clock className="h-5 w-5" />, description: "Scheduled for the requested date" },
  { key: "IN_PREPARATION", label: "Preparing", icon: <Clock className="h-5 w-5" />, description: "Being prepared" },
  { key: "READY", label: "Ready", icon: <Clock className="h-5 w-5" />, description: "Ready for delivery/pickup" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: <Truck className="h-5 w-5" />, description: "On the way" },
  { key: "DELIVERED", label: "Delivered", icon: <MapPin className="h-5 w-5" />, description: "Successfully delivered" }
];

export function OrderTimeline({ 
  status, 
  orderType = "INSTANT"
}: { 
  status: OrderStatus;
  orderType?: "INSTANT" | "QUOTATION";
}) {
  const timeline = orderType === "QUOTATION" ? QUOTATION_TIMELINE : DELIVERY_TIMELINE;

  // Find current step index
  const currentIndex = timeline.findIndex((step) => step.key === status);

  return (
    <div className="space-y-1">
      {timeline.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isUpcoming = i > currentIndex;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? "border-amber-600 bg-amber-600 text-white"
                    : isCurrent
                      ? "border-amber-600 bg-white text-amber-600"
                      : "border-charcoal-200 bg-charcoal-50 text-charcoal-300"
                }`}
              >
                {step.icon}
              </div>
              {i < timeline.length - 1 && (
                <div
                  className={`mt-1 h-12 w-1 ${
                    isCompleted ? "bg-amber-600" : "bg-charcoal-100"
                  }`}
                />
              )}
            </div>

            {/* Step content */}
            <div className="pb-8 pt-1">
              <p
                className={`font-semibold ${
                  isCompleted || isCurrent ? "text-charcoal-900" : "text-charcoal-400"
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p
                  className={`mt-0.5 text-sm ${
                    isCompleted || isCurrent ? "text-charcoal-600" : "text-charcoal-400"
                  }`}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
