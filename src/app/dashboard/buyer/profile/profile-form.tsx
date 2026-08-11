"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfileAction } from "@/server/actions/buyer";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function ProfileForm({ firstName, lastName, phone }: { firstName: string; lastName: string; phone: string }) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">First name</label>
          <input
            name="firstName"
            defaultValue={firstName}
            required
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Last name</label>
          <input
            name="lastName"
            defaultValue={lastName}
            required
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Phone / WhatsApp</label>
        <input
          name="phone"
          defaultValue={phone}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
        />
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
