"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updatePlatformSettingAction } from "@/server/actions/platform-settings";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-charcoal-800 px-3 py-2 text-xs font-semibold text-cream-100 hover:bg-charcoal-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export function SettingRow({ settingKey, label, value }: { settingKey: string; label: string; value: string }) {
  const [state, formAction] = useFormState(updatePlatformSettingAction, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-xl border border-charcoal-100 bg-white p-4 shadow-card">
      <input type="hidden" name="key" value={settingKey} />
      <div className="flex-1">
        <label className="block text-xs font-medium text-charcoal-600">{label}</label>
        <input
          name="value"
          defaultValue={value}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
        />
      </div>
      <SaveButton />
      {state && !state.ok && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
