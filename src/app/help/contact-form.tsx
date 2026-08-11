"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitContactRequestAction } from "@/server/actions/support";
import type { ActionResult } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send message"}
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactRequestAction, initialState);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (state?.ok) setSent(true);
  }, [state]);

  if (sent) {
    return (
      <p className="text-sm text-olive-700">
        Thanks — your message has been sent to our team. We&apos;ll get back to you by email as soon as possible.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Your name</label>
          <input name="name" required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-600">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Topic</label>
        <select name="topic" className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring">
          <option>Order issue</option>
          <option>Vendor account</option>
          <option>Driver account</option>
          <option>Billing / payments</option>
          <option>Something else</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Message</label>
        <textarea name="message" required rows={4} className="mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring" />
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
