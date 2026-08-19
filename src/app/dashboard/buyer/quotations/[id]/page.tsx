import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONE } from "@/lib/quotation";
import { formatZAR } from "@/lib/utils";
import { QuotationActions } from "./quotation-actions";
import { MessageButton } from "@/components/message-button";
import { QuotationRevisionComparison } from "@/components/quotation-revision-comparison";
import { mapQuotationRevisionsForComparison } from "@/lib/quotation-revisions";
import { expireQuotationIfNeeded } from "@/server/actions/quotations";

export default async function BuyerQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      business: true,
      branch: true,
      items: true,
      revisions: { orderBy: { revisionNo: "desc" } }
    }
  });

  if (!quotation || quotation.buyerId !== user.id) notFound();

  await expireQuotationIfNeeded(id);

  const refreshed =
    (await prisma.quotation.findUnique({
      where: { id },
      include: {
        business: true,
        branch: true,
        items: true,
        revisions: { orderBy: { revisionNo: "desc" } }
      }
    })) ?? quotation;

  const revisionViews = mapQuotationRevisionsForComparison(refreshed.revisions);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">{refreshed.business.name}</h1>
          <p className="text-sm text-charcoal-500">
            {refreshed.reference} · {refreshed.branch.name}
          </p>
        </div>
        <Badge tone={QUOTATION_STATUS_TONE[refreshed.status]}>{QUOTATION_STATUS_LABELS[refreshed.status]}</Badge>
      </div>

      {refreshed.status === "EXPIRED" && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          This quotation has expired
          {refreshed.expiresAt ? ` on ${new Date(refreshed.expiresAt).toLocaleString("en-ZA")}` : ""}. It can no longer
          be accepted or paid.
        </div>
      )}

      {refreshed.expiresAt &&
        refreshed.status !== "EXPIRED" &&
        ["PENDING", "VIEWED", "REVISED"].includes(refreshed.status) && (
          <p className="mt-2 text-sm text-charcoal-500">
            Valid until {new Date(refreshed.expiresAt).toLocaleString("en-ZA")}
          </p>
        )}

      <div className="mt-3">
        <MessageButton quotationId={refreshed.id} label="Message vendor" />
      </div>

      {refreshed.vendorMessage && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Message from vendor</p>
          <p className="mt-1">{refreshed.vendorMessage}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Items</h2>
        <div className="mt-3 divide-y divide-charcoal-50">
          {refreshed.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-charcoal-700">
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span className="font-medium text-charcoal-900">{formatZAR(Number(item.lineTotal))}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-charcoal-100 pt-4 text-sm">
          <div className="flex justify-between text-charcoal-500">
            <span>Subtotal</span>
            <span>{formatZAR(Number(refreshed.subtotal))}</span>
          </div>
          {refreshed.deliveryFee != null && (
            <div className="flex justify-between text-charcoal-500">
              <span>Delivery fee</span>
              <span>{formatZAR(Number(refreshed.deliveryFee))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-charcoal-900">
            <span>Total</span>
            <span>{formatZAR(Number(refreshed.total))}</span>
          </div>
        </div>
      </div>

      {revisionViews.length > 0 && <QuotationRevisionComparison revisions={revisionViews} />}

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Fulfillment</p>
          <p className="mt-1 font-medium text-charcoal-800">{refreshed.fulfillmentType}</p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Requested date</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {new Date(refreshed.requestedDate).toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <QuotationActions
        quotationId={refreshed.id}
        status={refreshed.status}
        total={Number(refreshed.total)}
        fulfillmentType={refreshed.fulfillmentType}
      />
    </div>
  );
}
