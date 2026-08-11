import { Star } from "lucide-react";

type ReviewLite = { id: string; rating: number; comment: string | null; createdAt: string; authorName: string };

export function ReviewsList({ reviews }: { reviews: ReviewLite[] }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-charcoal-900">Reviews</h2>
      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal-500">No reviews yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-charcoal-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-charcoal-800">{r.authorName}</p>
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-500 text-amber-500" : "text-charcoal-200"}`} />
                  ))}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-charcoal-600">{r.comment}</p>}
              <p className="mt-1 text-xs text-charcoal-400">{new Date(r.createdAt).toLocaleDateString("en-ZA")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
