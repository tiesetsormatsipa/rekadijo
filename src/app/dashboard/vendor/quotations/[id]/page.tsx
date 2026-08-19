import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONE } from "@/lib/quotation";
import { haversineDistanceKm } from "@/lib/geo";
import { VendorQuotationTools } from "./vendor-quotation-tools";
import { markQuotationViewedAction, expireQuotationIfNeeded } from "@/server/actions/quotations";
import { MessageButton } from "@/components/message-button";
import { QuotationRevisionComparison } from "@/components/quotation-revision-comparison";
import { mapQuotationRevisionsForComparison } from "@/lib/quotation-revisions";

export default async function VendorQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { business: true, branch: true, buyer: true, items: true, revisions: { orderBy: { revisionNo: "desc" } } }
  });
  if (!quotation) notFound();

  const isStaffOrOwner =
    quotation.business.ownerId === user.id ||
    (await prisma.businessStaff.findFirst({ where: { businessId: quotation.businessId, userId: user.id } }));
  if (!isStaffOrOwner) notFound();

  if (quotation.status === "PENDING") {
    await markQuotationViewedAction(quotation.id);
  }

  await expireQuotationIfNeeded(id);

  const refreshed =
    (await prisma.quotation.findUnique({
      where: { id },
      include: { business: true, branch: true, buyer: true, items: true, revisions: { orderBy: { revisionNo: "desc" } } }
    })) ?? quotation;

  const revisionViews = mapQuotationRevisionsForComparison(refreshed.revisions);

  const distanceKm =
    refreshed.fulfillmentType === "DELIVERY" && refreshed.deliveryLat != null && refreshed.deliveryLng != null
      ? haversineDistanceKm(
          { lat: Number(refreshed.branch.latitude), lng: Number(refreshed.branch.longitude) },
          { lat: Number(refreshed.deliveryLat), lng: Number(refreshed.deliveryLng) }
        )
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">
            {refreshed.buyer.firstName} {refreshed.buyer.lastName}
          </h1>
          <p className="text-sm text-charcoal-500">
            {refreshed.reference} · {refreshed.branch.name}
          </p>
        </div>
        <Badge tone={QUOTATION_STATUS_TONE[refreshed.status]}>{QUOTATION_STATUS_LABELS[refreshed.status]}</Badge>
      </div>

      {refreshed.status === "EXPIRED" && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          This quotation expired
          {refreshed.expiresAt ? ` on ${new Date(refreshed.expiresAt).toLocaleString("en-ZA")}` : ""}.
        </div>
      )}

      <div className="mt-3">
        <MessageButton quotationId={refreshed.id} label="Message buyer" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Event type</p>
          <p className="mt-1 font-medium text-charcoal-800">{refreshed.eventType ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Requested date</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {new Date(refreshed.requestedDate).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Fulfillment</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {refreshed.fulfillmentType}
            {distanceKm != null && <span className="ml-1 text-charcoal-500">· {distanceKm.toFixed(1)} km away</span>}
          </p>
          {refreshed.deliveryAddress && <p className="mt-0.5 text-xs text-charcoal-400">{refreshed.deliveryAddress}</p>}
        </div>
        <div className="rounded-xl border border-charcoal-100 bg-white p-4">
          <p className="text-charcoal-400">Order size</p>
          <p className="mt-1 font-medium text-charcoal-800">{refreshed.sizeCategory}</p>
        </div>
      </div>

      {refreshed.notes && (
        <div className="mt-4 rounded-lg bg-charcoal-50 p-4 text-sm text-charcoal-700">
          <p className="font-semibold text-charcoal-800">Buyer notes</p>
          <p className="mt-1">{refreshed.notes}</p>
        </div>
      )}

      {revisionViews.length > 0 && <QuotationRevisionComparison revisions={revisionViews} />}

      <VendorQuotationTools
        quotationId={refreshed.id}
        status={refreshed.status}
        items={refreshed.items.map((i) => ({
          menuItemId: i.menuItemId,
          nameSnapshot: i.nameSnapshot,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice)
        }))}
        currentTotal={Number(refreshed.total)}
      />
    </div>
  );
}
