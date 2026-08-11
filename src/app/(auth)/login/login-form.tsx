"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Logging in..." : "Log in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
          placeholder="you@example.com"
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
          className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2.5 text-sm focus-ring"
          placeholder="••••••••"
        />
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
