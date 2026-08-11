"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setDriverAvailabilityAction } from "@/server/actions/driver";
import { Badge } from "@/components/ui/badge";

export function DriverAvailabilityToggle({ isAvailable }: { isAvailable: boolean }) {
  const [available, setAvailable] = useState(isAvailable);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const next = !available;
          const res = await setDriverAvailabilityAction(next);
          if (!res.ok) toast.error(res.error);
          else {
            setAvailable(next);
            toast.success(next ? "You're now available." : "You're now offline.");
            router.refresh();
          }
        })
      }
    >
      <Badge tone={available ? "success" : "neutral"}>{available ? "Available — tap to go offline" : "Offline — tap to go online"}</Badge>
    </button>
  );
}
