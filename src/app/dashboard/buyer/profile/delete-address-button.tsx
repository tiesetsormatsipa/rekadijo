"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { deleteAddressAction } from "@/server/actions/buyer";

export function DeleteAddressButton({ addressId }: { addressId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteAddressAction(addressId);
          if (!res.ok) toast.error(res.error);
          else router.refresh();
        })
      }
      className="rounded-lg p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600 focus-ring"
      aria-label="Delete address"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
