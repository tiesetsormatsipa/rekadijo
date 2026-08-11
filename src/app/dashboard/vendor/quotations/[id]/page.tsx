import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONE } from "@/lib/quotation";
import { haversineDistanceKm } from "@/lib/geo";
import { VendorQuotationTools } from "./vendor-quotation-tools";
import { markQuotationViewedAction } from "@/server/actions/quotations";
import { MessageButton } from "@/components/message-button";

export default async function VendorQuotationDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: { business: true, branch: true, buyer: true, items: true }
  });
  if (!quotation) notFound();

  const isStaffOrOwner =
    quotation.business.ownerId === user.id ||
    (await prisma.businessStaff.findFirst({ where: { businessId: quotation.businessId, userId: user.id } }));
  if (!isStaffOrOwner) notFound();

  if (quotation.status === "PENDING") {
    await markQuotationViewedAction(quotation.id);
  }

  const distanceKm =
    quotation.fulfillmentType === "DELIVERY" && quotation.deliveryLat != null && quotation.deliveryLng != null
      ? haversineDistanceKm(
          { lat: Number(quotation.branch.latitude), lng: Number(quotation.branch.longitude) },
          { lat: Number(quotation.deliveryLat), lng: Number(quotation.deliveryLng) }
        )
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">
            {quotation.buyer.firstName} {quotation.buyer.lastName}
          </h1>
          <p className="text-sm text-charcoal-500">
            {quotation.reference} · {quotation.branch.name}
          </p>
        </div>
        <Badge tone={QUOTATION_STATUS_TONE[quotation.status]}>{QUOTATION_STATUS_LABELS[quotation.status]}</Badge>
      </div>

      <div className="mt-3">
        <MessageButton quotationId={quotation.id} label="Message buyer" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Event type</p>
          <p className="mt-1 font-medium text-charcoal-800">{quotation.eventType ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Requested date</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {new Date(quotation.requestedDate).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Fulfillment</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {quotation.fulfillmentType}
            {distanceKm != null && <span className="ml-1 text-charcoal-500">· {distanceKm.toFixed(1)} km away</span>}
          </p>
          {quotation.deliveryAddress && <p className="mt-0.5 text-xs text-charcoal-400">{quotation.deliveryAddress}</p>}
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Order size</p>
          <p className="mt-1 font-medium text-charcoal-800">{quotation.sizeCategory}</p>
        </div>
      </div>

      {quotation.notes && (
        <div className="mt-4 rounded-lg bg-charcoal-50 p-4 text-sm text-charcoal-700">
          <p className="font-semibold text-charcoal-800">Buyer notes</p>
          <p className="mt-1">{quotation.notes}</p>
        </div>
      )}

      <VendorQuotationTools
        quotationId={quotation.id}
        status={quotation.status}
        items={quotation.items.map((i) => ({
          menuItemId: i.menuItemId,
          nameSnapshot: i.nameSnapshot,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice)
        }))}
        currentTotal={Number(quotation.total)}
      />
    </div>
  );
}
