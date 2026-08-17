"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuotationCart } from "@/lib/cart-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createQuotationAction } from "@/server/actions/quotations";
import { classifyOrderSize } from "@/lib/geo";
import { formatZAR } from "@/lib/utils";
import { useAddressStore } from "@/lib/address-store";
import { AddressSelector, type ResolvedDelivery } from "@/components/address-selector";

export function QuotationBuilder({
  businessId,
  branchId,
  branchLat,
  branchLng,
  deliveryRadiusKm,
  fulfillmentType
}: {
  businessId: string;
  branchId: string;
  branchLat: number;
  branchLng: number;
  deliveryRadiusKm: number | null;
  fulfillmentType: "PICKUP" | "DELIVERY" | "EITHER";
}) {
  const router = useRouter();
  const { mode } = useAddressStore();
  const { cart, updateLineQty, clearCart } = useQuotationCart(businessId, branchId);
  const [eventType, setEventType] = useState("");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    fulfillmentType === "DELIVERY" ? "DELIVERY" : "PICKUP"
  );
  const [requestedDate, setRequestedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [resolvedDelivery, setResolvedDelivery] = useState<ResolvedDelivery>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (fulfillmentType === "EITHER") setFulfillment(mode);
  }, [mode, fulfillmentType]);

  const lines = useMemo(() => Object.entries(cart).filter(([, line]) => line.quantity > 0), [cart]);
  const subtotal = lines.reduce((sum, [, line]) => sum + line.unitPrice * line.quantity, 0);
  const totalUnits = lines.reduce((sum, [, line]) => sum + line.quantity, 0);
  const sizeInfo = classifyOrderSize(totalUnits);

  async function handleSubmit() {
    if (lines.length === 0) {
      toast.error("Add at least one item to your quotation request.");
      return;
    }
    if (!requestedDate) {
      toast.error("Please choose a preferred date and time.");
      return;
    }
    if (fulfillment === "DELIVERY" && !resolvedDelivery) {
      toast.error("Please choose a delivery address.");
      return;
    }
    if (fulfillment === "DELIVERY" && resolvedDelivery && !resolvedDelivery.inRange) {
      toast.error("That address is outside this branch's delivery range. Switch to pickup or choose a closer address.");
      return;
    }

    setSubmitting(true);
    const result = await createQuotationAction({
      businessId,
      branchId,
      eventType: eventType || undefined,
      fulfillmentType: fulfillment,
      requestedDate: new Date(requestedDate).toISOString(),
      notes: notes || undefined,
      deliveryAddress: fulfillment === "DELIVERY" ? resolvedDelivery?.label : undefined,
      deliveryLat: fulfillment === "DELIVERY" ? resolvedDelivery?.lat : undefined,
      deliveryLng: fulfillment === "DELIVERY" ? resolvedDelivery?.lng : undefined,
      items: lines.map(([, line]) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        optionLabels: line.optionLabels
      }))
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    clearCart();
    toast.success("Quotation request sent! The vendor will respond soon.");
    router.push(`/dashboard/buyer/quotations/${result.quotationId}`);
  }

  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-lg font-semibold text-charcoal-900">Build a quotation</h3>
      <p className="mt-1 text-xs text-charcoal-500">
        Add items from the menu, then set date, notes, and delivery details. The vendor replies with confirmed pricing.
      </p>

      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-charcoal-400">No items yet. Tap Quote on a menu item.</p>
        ) : (
          lines.map(([lineKey, line]) => (
            <div key={lineKey} className="flex items-center justify-between gap-3 border-b border-charcoal-50 pb-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-charcoal-800">{line.name}</p>
                {line.optionLabels && line.optionLabels.length > 0 && (
                  <p className="text-xs text-charcoal-400">{line.optionLabels.join(", ")}</p>
                )}
                <p className="text-xs text-charcoal-400">
                  {formatZAR(line.unitPrice)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateLineQty(lineKey, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50 focus-ring"
                  aria-label={`Decrease ${line.name}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateLineQty(lineKey, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50 focus-ring"
                  aria-label={`Increase ${line.name}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalUnits > 0 && (
        <div className="mt-4 rounded-lg bg-olive-50 p-3 text-xs text-olive-800">
          <p className="font-semibold">
            {sizeInfo.label} · {totalUnits} units
          </p>
          <p className="mt-0.5">{sizeInfo.guidance}</p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Event type (optional)</label>
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Birthday, church order, office lunch..."
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>

        {fulfillmentType === "EITHER" && (
          <div className="flex gap-2">
            {(["PICKUP", "DELIVERY"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFulfillment(f)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  fulfillment === f ? "border-amber-600 bg-amber-50 text-amber-800" : "border-charcoal-200 text-charcoal-600"
                }`}
              >
                {f === "PICKUP" ? "Pickup" : "Delivery"}
              </button>
            ))}
          </div>
        )}

        {fulfillment === "DELIVERY" && (
          <AddressSelector
            branchLat={branchLat}
            branchLng={branchLng}
            deliveryRadiusKm={deliveryRadiusKm}
            onResolved={setResolvedDelivery}
          />
        )}
        {fulfillment === "DELIVERY" && resolvedDelivery?.inRange && (
          <p className="-mt-2 text-xs text-charcoal-400">
            Estimated delivery fee shown is indicative — the vendor confirms the final fee in their quotation.
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-charcoal-600">Preferred date &amp; time</label>
          <input
            type="datetime-local"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-600">Notes for the vendor</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-charcoal-100 pt-4">
        <span className="text-sm text-charcoal-500">Estimated subtotal</span>
        <span className="font-display text-lg font-semibold text-charcoal-900">{formatZAR(subtotal)}</span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={
          submitting ||
          lines.length === 0 ||
          (fulfillment === "DELIVERY" && resolvedDelivery !== null && !resolvedDelivery.inRange)
        }
        className="mt-4 w-full"
      >
        <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Request quotation"}
      </Button>
    </div>
  );
}
