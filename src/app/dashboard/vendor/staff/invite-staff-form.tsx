"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteStaffAction } from "@/server/actions/staff";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Inviting..." : "Invite"}
    </Button>
  );
}

export function InviteStaffForm({ businessId }: { businessId: string }) {
  const [state, formAction] = useFormState(inviteStaffAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="flex-1">
        <label className="block text-xs font-medium text-charcoal-600">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Role</label>
        <select name="role" className="mt-1 rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring">
          <option value="MANAGER">Manager</option>
          <option value="KITCHEN">Kitchen</option>
          <option value="FRONT_OF_HOUSE">Front of house</option>
          <option value="DRIVER_COORDINATOR">Driver coordinator</option>
        </select>
      </div>
      <SubmitButton />
      {state && !state.ok && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
