import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/utils";
import { ReviewForm } from "./review-form";
import { OrderActions } from "./order-actions";

const ORDER_STEPS = ["PAID", "SCHEDULED", "IN_PREPARATION", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"] as const;
const BUYER_CANCELABLE_STATUSES = ["PAYMENT_PENDING", "PAID", "SCHEDULED"];

export default async function BuyerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { business: true, branch: true, items: true, driverAssignment: { include: { driver: { include: { user: true } } } } }
  });
  if (!order || order.buyerId !== user.id) notFound();

  const existingReview = await prisma.review.findFirst({
    where: { orderId: order.id, authorId: user.id, targetType: "BUSINESS" }
  });

  const currentStepIndex = ORDER_STEPS.indexOf(order.status as (typeof ORDER_STEPS)[number]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal-900">{order.business.name}</h1>
          <p className="text-sm text-charcoal-500">
            {order.reference} · {order.branch.name}
          </p>
        </div>
        <Link href={`/dashboard/buyer/orders/${order.id}/receipt`} className="text-xs font-semibold text-amber-700 hover:text-amber-800">
          View receipt
        </Link>
      </div>

      {order.status !== "CANCELED" && order.status !== "REFUNDED" && currentStepIndex >= 0 && (
        <div className="mt-6 flex items-center gap-1">
          {ORDER_STEPS.map((step, i) => (
            <div key={step} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= currentStepIndex ? "bg-amber-600" : "bg-charcoal-100"}`} />
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-sm font-medium text-charcoal-700">
        Status: <Badge tone={order.status === "CANCELED" ? "danger" : "info"}>{order.status.replaceAll("_", " ")}</Badge>
      </p>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Items</h2>
        <div className="mt-3 divide-y divide-charcoal-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-charcoal-700">
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span className="font-medium text-charcoal-900">{formatZAR(Number(item.lineTotal))}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-charcoal-100 pt-3 text-sm">
          <div className="flex justify-between text-charcoal-500">
            <span>Subtotal</span>
            <span>{formatZAR(Number(order.subtotal))}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-charcoal-500">
              <span>Discount</span>
              <span>-{formatZAR(Number(order.discountAmount))}</span>
            </div>
          )}
          {order.deliveryFee != null && (
            <div className="flex justify-between text-charcoal-500">
              <span>Delivery fee</span>
              <span>{formatZAR(Number(order.deliveryFee))}</span>
            </div>
          )}
          {Number(order.tipAmount) > 0 && (
            <div className="flex justify-between text-charcoal-500">
              <span>Tip</span>
              <span>{formatZAR(Number(order.tipAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-charcoal-900">
            <span>Total</span>
            <span>{formatZAR(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {order.driverAssignment && (
        <div className="mt-4 rounded-xl border border-charcoal-100 bg-white p-4 text-sm">
          <p className="text-charcoal-400">Driver</p>
          <p className="mt-1 font-medium text-charcoal-800">
            {order.driverAssignment.driver.user.firstName} {order.driverAssignment.driver.user.lastName} ·{" "}
            {order.driverAssignment.status.replaceAll("_", " ")}
          </p>
        </div>
      )}

      {order.cancelReason && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Cancelled by {order.cancelledBy?.toLowerCase()}: {order.cancelReason}
        </div>
      )}

      <OrderActions
        orderId={order.id}
        canCancel={BUYER_CANCELABLE_STATUSES.includes(order.status)}
        canReorder={order.type === "INSTANT" && ["COMPLETED", "DELIVERED"].includes(order.status)}
      />

      {order.status === "COMPLETED" && !existingReview && (
        <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
          <h2 className="font-semibold text-charcoal-800">Rate your order</h2>
          <ReviewForm orderId={order.id} hasDriver={Boolean(order.driverAssignment)} />
        </div>
      )}
      {existingReview && (
        <div className="mt-6 rounded-xl bg-olive-50 p-4 text-sm text-olive-800">Thanks — you&apos;ve already reviewed this order.</div>
      )}
    </div>
  );
}
