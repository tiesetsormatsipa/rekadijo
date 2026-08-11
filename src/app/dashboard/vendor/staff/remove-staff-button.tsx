"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { removeStaffAction } from "@/server/actions/staff";

export function RemoveStaffButton({ businessStaffId }: { businessStaffId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("Remove this staff member's access?")) return;
          const res = await removeStaffAction(businessStaffId);
          if (!res.ok) toast.error(res.error);
          else router.refresh();
        })
      }
      className="text-xs font-medium text-red-600 hover:underline"
    >
      Remove
    </button>
  );
}
