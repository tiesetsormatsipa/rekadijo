import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONE } from "@/lib/quotation";
import { formatZAR } from "@/lib/utils";
import { QuotationActions } from "./quotation-actions";
import { MessageButton } from "@/components/message-button";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">{quotation.business.name}</h1>
          <p className="text-sm text-charcoal-500">
            {quotation.reference} · {quotation.branch.name}
          </p>
        </div>
        <Badge tone={QUOTATION_STATUS_TONE[quotation.status]}>{QUOTATION_STATUS_LABELS[quotation.status]}</Badge>
      </div>

      <div className="mt-3">
        <MessageButton quotationId={quotation.id} label="Message vendor" />
      </div>

      {quotation.vendorMessage && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Message from vendor</p>
          <p className="mt-1">{quotation.vendorMessage}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Items</h2>
        <div className="mt-3 divide-y divide-charcoal-50">
          {quotation.items.map((item) => (
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
            <span>{formatZAR(Number(quotation.subtotal))}</span>
          </div>
          {quotation.deliveryFee != null && (
            <div className="flex justify-between text-charcoal-500">
              <span>Delivery fee</span>
              <span>{formatZAR(Number(quotation.deliveryFee))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-charcoal-900">
            <span>Total</span>
            <span>{formatZAR(Number(quotation.total))}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Fulfillment</p>
          <p className="mt-1 font-medium text-charcoal-800">{quotation.fulfillmentType}</p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Requested date</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {new Date(quotation.requestedDate).toLocaleString("en-ZA")}
          </p>
        </div>
      </div>

      <QuotationActions
        quotationId={quotation.id}
        status={quotation.status}
        total={Number(quotation.total)}
        fulfillmentType={quotation.fulfillmentType}
      />
    </div>
  );
}
