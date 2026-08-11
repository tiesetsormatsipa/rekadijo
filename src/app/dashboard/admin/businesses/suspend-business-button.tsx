"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { suspendBusinessAction } from "@/server/actions/quotations";

export function SuspendBusinessButton({ businessId, isSuspended }: { businessId: string; isSuspended: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant={isSuspended ? "outline" : "danger"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await suspendBusinessAction(businessId, !isSuspended);
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(isSuspended ? "Business restored." : "Business suspended.");
            router.refresh();
          }
        })
      }
    >
      {isSuspended ? "Restore" : "Suspend"}
    </Button>
  );
}
