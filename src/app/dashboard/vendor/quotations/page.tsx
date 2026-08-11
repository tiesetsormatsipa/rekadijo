import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONE } from "@/lib/quotation";
import { formatZAR } from "@/lib/utils";

export default async function VendorQuotationInboxPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  const quotations = await prisma.quotation.findMany({
    where: { businessId: business.id },
    include: { buyer: true, branch: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Quotation inbox</h1>
      <p className="mt-1 text-charcoal-500">Respond to buyer requests, revise pricing, and track approvals.</p>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {quotations.length === 0 && <p className="p-6 text-sm text-charcoal-500">No quotation requests yet.</p>}
        {quotations.map((q) => (
          <Link
            key={q.id}
            href={`/dashboard/vendor/quotations/${q.id}`}
            className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-charcoal-50"
          >
            <div>
              <p className="text-sm font-semibold text-charcoal-900">
                {q.buyer.firstName} {q.buyer.lastName} · {q.reference}
              </p>
              <p className="text-xs text-charcoal-500">
                {q.branch.name} · {q.eventType ?? "General order"} ·{" "}
                {new Date(q.requestedDate).toLocaleDateString("en-ZA")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-charcoal-800">{formatZAR(Number(q.total))}</span>
              <Badge tone={QUOTATION_STATUS_TONE[q.status]}>{QUOTATION_STATUS_LABELS[q.status]}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
