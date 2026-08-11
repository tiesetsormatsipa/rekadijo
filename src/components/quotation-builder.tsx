"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createQuotationAction } from "@/server/actions/quotations";
import { classifyOrderSize } from "@/lib/geo";
import { formatZAR } from "@/lib/utils";
import { useAddressStore } from "@/lib/address-store";
import { AddressSelector, type ResolvedDelivery } from "@/components/address-selector";

type MenuItemLite = {
  id: string;
  name: string;
  basePrice: number;
  unitLabel: string | null;
  minQuantity: number;
  maxQuantity: number | null;
  options: Array<{ choiceLabel: string; priceDelta: number }>;
};

type CategoryLite = { id: string; name: string; items: MenuItemLite[] };

type CartLine = { menuItemId: string; name: string; unitPrice: number; quantity: number; optionLabel?: string };

export function QuotationBuilder({
  businessId,
  branchId,
  branchLat,
  branchLng,
  deliveryRadiusKm,
  fulfillmentType,
  menuCategories
}: {
  businessId: string;
  branchId: string;
  branchLat: number;
  branchLng: number;
  deliveryRadiusKm: number | null;
  fulfillmentType: "PICKUP" | "DELIVERY" | "EITHER";
  menuCategories: CategoryLite[];
}) {
  const router = useRouter();
  const { mode } = useAddressStore();
  const [cart, setCart] = useState<Record<string, CartLine>>({});
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

  const allItems = useMemo(() => menuCategories.flatMap((c) => c.items), [menuCategories]);

  function updateQuantity(item: MenuItemLite, delta: number) {
    setCart((prev) => {
      const key = item.id;
      const existing = prev[key];
      const nextQty = existing ? existing.quantity + delta : delta > 0 ? item.minQuantity : 0;
      const qty = Math.max(0, Math.min(nextQty, item.maxQuantity ?? Infinity));
      if (qty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { menuItemId: item.id, name: item.name, unitPrice: item.basePrice, quantity: qty } };
    });
  }

  const lines = Object.values(cart);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);
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
      items: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, optionLabel: l.optionLabel }))
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Quotation request sent! The vendor will respond soon.");
    router.push(`/dashboard/buyer/quotations/${result.quotationId}`);
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-charcoal-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-lg font-semibold text-charcoal-900">Build your quotation request</h3>
      <p className="mt-1 text-xs text-charcoal-500">
        Choose items and quantities, then tell us about your event. The vendor will send back a real quotation.
      </p>

      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {allItems.map((item) => {
          const qty = cart[item.id]?.quantity ?? 0;
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 border-b border-charcoal-50 pb-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-charcoal-800">{item.name}</p>
                <p className="text-xs text-charcoal-400">
                  {formatZAR(item.basePrice)}
                  {item.unitLabel ? ` / ${item.unitLabel}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50 focus-ring"
                  aria-label={`Decrease ${item.name}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50 focus-ring"
                  aria-label={`Increase ${item.name}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
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
        disabled={submitting || (fulfillment === "DELIVERY" && resolvedDelivery !== null && !resolvedDelivery.inRange)}
        className="mt-4 w-full"
      >
        <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Request quotation"}
      </Button>
    </div>
  );
}
