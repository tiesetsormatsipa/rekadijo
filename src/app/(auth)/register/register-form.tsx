"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registerAction, type ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initialState);
  const [role, setRole] = useState<"BUYER" | "VENDOR_OWNER" | "DRIVER">("BUYER");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-charcoal-700">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-charcoal-700">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-charcoal-700">
          Phone / WhatsApp (optional)
        </label>
        <input
          id="phone"
          name="phone"
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring"
          placeholder="+27..."
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-charcoal-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-charcoal-700">I am signing up as a</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["BUYER", "Buyer"],
              ["VENDOR_OWNER", "Vendor"],
              ["DRIVER", "Driver"]
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setRole(value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                role === value
                  ? "border-amber-600 bg-amber-50 text-amber-800"
                  : "border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
