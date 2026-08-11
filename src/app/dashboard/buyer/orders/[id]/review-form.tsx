"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitOrderReviewAction } from "@/server/actions/reviews";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}>
          <Star className={`h-6 w-6 ${n <= value ? "fill-amber-500 text-amber-500" : "text-charcoal-200"}`} />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ orderId, hasDriver }: { orderId: string; hasDriver: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await submitOrderReviewAction({
        orderId,
        rating,
        comment: comment || undefined,
        driverRating: hasDriver ? driverRating : undefined,
        driverComment: hasDriver ? driverComment || undefined : undefined
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Thanks for your review!");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-3 space-y-4">
      <div>
        <label className="block text-xs font-medium text-charcoal-600">Vendor rating</label>
        <div className="mt-1">
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the food and service?"
        rows={2}
        className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
      />

      {hasDriver && (
        <>
          <div>
            <label className="block text-xs font-medium text-charcoal-600">Driver rating</label>
            <div className="mt-1">
              <StarPicker value={driverRating} onChange={setDriverRating} />
            </div>
          </div>
          <textarea
            value={driverComment}
            onChange={(e) => setDriverComment(e.target.value)}
            placeholder="How was the delivery?"
            rows={2}
            className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus-ring"
          />
        </>
      )}

      <Button onClick={submit} disabled={pending}>
        {pending ? "Submitting..." : "Submit review"}
      </Button>
    </div>
  );
}
