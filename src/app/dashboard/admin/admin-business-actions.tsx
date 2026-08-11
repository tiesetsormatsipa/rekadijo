"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { verifyBusinessAction } from "@/server/actions/quotations";

export function AdminBusinessActions({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function decide(decision: "APPROVE" | "REJECT") {
    startTransition(async () => {
      const res = await verifyBusinessAction(businessId, decision);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(decision === "APPROVE" ? "Business approved." : "Business rejected.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => decide("APPROVE")} disabled={pending}>
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => decide("REJECT")} disabled={pending}>
        Reject
      </Button>
    </div>
  );
}
