"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-800 focus-ring disabled:opacity-50"
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
