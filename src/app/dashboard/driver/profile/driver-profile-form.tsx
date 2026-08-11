"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateDriverProfileAction } from "@/server/actions/driver";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

export function DriverProfileForm({ vehicleType, licensePlate }: { vehicleType: string; licensePlate: string }) {
  const [state, formAction] = useActionState(updateDriverProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <h2 className="font-semibold text-charcoal-800">Vehicle details</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Vehicle type</label>
          <select name="vehicleType" defaultValue={vehicleType} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring">
            <option value="">Select...</option>
            <option value="Motorbike">Motorbike</option>
            <option value="Sedan">Sedan</option>
            <option value="Bakkie">Bakkie</option>
            <option value="Van">Van</option>
            <option value="Bicycle">Bicycle</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">License plate</label>
          <input name="licensePlate" defaultValue={licensePlate} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
