"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateBranchSettingsAction } from "@/server/actions/branch";
import type { FulfillmentType } from "@prisma/client";

export function BranchSettingsPanel({
  branchId,
  fulfillmentType,
  deliveryRadiusKm,
  acceptsInstantOrders,
  isActive
}: {
  branchId: string;
  fulfillmentType: FulfillmentType;
  deliveryRadiusKm: number | null;
  acceptsInstantOrders: boolean;
  isActive: boolean;
}) {
  const [form, setForm] = useState({ fulfillmentType, deliveryRadiusKm: deliveryRadiusKm ?? 0, acceptsInstantOrders, isActive });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(next: typeof form) {
    setForm(next);
    startTransition(async () => {
      const res = await updateBranchSettingsAction({ branchId, ...next });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Branch settings updated.");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 grid gap-3 rounded-xl bg-charcoal-50 p-4 text-sm sm:grid-cols-4">
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Fulfillment</label>
        <select
          disabled={pending}
          value={form.fulfillmentType}
          onChange={(e) => save({ ...form, fulfillmentType: e.target.value as FulfillmentType })}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-2 py-1.5 text-sm focus-ring"
        >
          <option value="PICKUP">Pickup only</option>
          <option value="DELIVERY">Delivery only</option>
          <option value="EITHER">Pickup or delivery</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Delivery radius (km)</label>
        <input
          disabled={pending}
          type="number"
          min={0}
          value={form.deliveryRadiusKm}
          onChange={(e) => setForm({ ...form, deliveryRadiusKm: Number(e.target.value) })}
          onBlur={() => save(form)}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-2 py-1.5 text-sm focus-ring"
        />
      </div>
      <label className="flex items-end gap-2 pb-1.5">
        <input
          disabled={pending}
          type="checkbox"
          checked={form.acceptsInstantOrders}
          onChange={(e) => save({ ...form, acceptsInstantOrders: e.target.checked })}
          className="h-4 w-4 rounded border-charcoal-300 text-amber-600"
        />
        <span className="text-charcoal-700">Instant ordering on</span>
      </label>
      <label className="flex items-end gap-2 pb-1.5">
        <input
          disabled={pending}
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => save({ ...form, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-charcoal-300 text-amber-600"
        />
        <span className="text-charcoal-700">Branch active</span>
      </label>
    </div>
  );
}
