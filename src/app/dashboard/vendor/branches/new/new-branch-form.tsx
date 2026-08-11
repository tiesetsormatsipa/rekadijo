"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createBranchAction } from "@/server/actions/branch";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;
const inputClass = "mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring";
const labelClass = "block text-sm font-medium text-charcoal-700";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Adding..." : "Add branch"}
    </Button>
  );
}

export function NewBranchForm({ businessId }: { businessId: string }) {
  const [state, formAction] = useActionState(createBranchAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/dashboard/vendor/branches");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <div>
        <label className={labelClass}>Branch name</label>
        <input name="name" required className={inputClass} placeholder="e.g. TR. Matsipa Market — Douglas" />
      </div>
      <div>
        <label className={labelClass}>Address</label>
        <input name="addressLine" required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City / Town</label>
          <input name="city" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Postal code</label>
          <input name="postalCode" className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Latitude</label>
          <input name="latitude" type="number" step="any" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Longitude</label>
          <input name="longitude" type="number" step="any" required className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Fulfillment</label>
        <select name="fulfillmentType" defaultValue="EITHER" className={inputClass}>
          <option value="PICKUP">Pickup only</option>
          <option value="DELIVERY">Delivery only</option>
          <option value="EITHER">Pickup or delivery</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Delivery radius (km)</label>
        <input name="deliveryRadiusKm" type="number" step="0.1" className={inputClass} />
      </div>
      <label className="flex items-center gap-2 text-sm text-charcoal-700">
        <input type="checkbox" name="acceptsInstantOrders" className="h-4 w-4 rounded border-charcoal-300 text-amber-600" />
        Enable instant ordering at this branch
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
