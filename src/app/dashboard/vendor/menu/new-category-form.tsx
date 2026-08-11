"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createCategoryAction } from "@/server/actions/menu";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding..." : "Add category"}
    </Button>
  );
}

export function NewCategoryForm({ businessId }: { businessId: string }) {
  const [state, formAction] = useFormState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="flex-1">
        <label className="block text-xs font-medium text-charcoal-600">New category name</label>
        <input
          name="name"
          required
          placeholder="e.g. Ginger Beer"
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
        />
      </div>
      <SubmitButton />
      {state && !state.ok && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
