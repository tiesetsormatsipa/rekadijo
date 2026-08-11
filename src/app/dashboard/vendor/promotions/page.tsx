import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { NewPromotionForm } from "./new-promotion-form";
import { TogglePromotionButton } from "./toggle-promotion-button";

export default async function VendorPromotionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  const promotions = await prisma.promotion.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { redemptions: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Promotions</h1>
      <p className="mt-1 text-charcoal-500">Create discount codes for {business.name}&apos;s instant orders.</p>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {promotions.length === 0 && <p className="p-6 text-sm text-charcoal-500">No promo codes yet.</p>}
        {promotions.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-charcoal-900">{p.code}</p>
              <p className="text-xs text-charcoal-500">
                {p.type === "PERCENTAGE_OFF"
                  ? `${Number(p.value)}% off`
                  : p.type === "FREE_DELIVERY"
                  ? "Free delivery"
                  : `R${Number(p.value)} off`}
                {p.minOrderAmount ? ` · min order R${Number(p.minOrderAmount)}` : ""} · {p._count.redemptions} used
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={p.isActive ? "success" : "neutral"}>{p.isActive ? "Active" : "Paused"}</Badge>
              <TogglePromotionButton promotionId={p.id} isActive={p.isActive} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Create a promo code</h2>
        <div className="mt-4">
          <NewPromotionForm businessId={business.id} />
        </div>
      </div>
    </div>
  );
}
