"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { QuotationActionResult } from "@/server/actions/quotations";

/** Statuses a buyer may still cancel from — once preparation starts, only the vendor can cancel. */
const BUYER_CANCELABLE_STATUSES = ["PAYMENT_PENDING", "PAID", "SCHEDULED"];

export async function cancelOrderAction(orderId: string, reason?: string): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order || order.buyerId !== user.id) return { ok: false, error: "Order not found." };

  if (!BUYER_CANCELABLE_STATUSES.includes(order.status)) {
    return {
      ok: false,
      error: "This order can no longer be cancelled — the vendor has already started preparing it. Contact them directly if needed."
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELED", canceledAt: new Date(), cancelReason: reason, cancelledBy: "BUYER" }
    });

    const successfulPayment = order.payments.find((p) => p.status === "SUCCESS");
    if (successfulPayment) {
      await tx.payment.update({ where: { id: successfulPayment.id }, data: { status: "REFUNDED" } });
    }
  });

  const business = await prisma.business.findUnique({ where: { id: order.businessId } });
  if (business) {
    await prisma.notification.create({
      data: {
        userId: business.ownerId,
        type: "ORDER_STATUS_CHANGED",
        title: "Order cancelled",
        body: `${user.firstName} cancelled order ${order.reference}.`,
        linkUrl: `/dashboard/vendor/orders/${order.id}`
      }
    });
  }

  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  revalidatePath("/dashboard/buyer");
  return { ok: true, quotationId: orderId };
}

export type ReorderCartLine = { menuItemId: string; name: string; quantity: number };

/**
 * Returns the previous order's line items (filtered to ones still active and
 * instant-orderable at the same branch today) so the UI can prefill a new
 * instant-order cart — this is a "reorder", not a re-charge, so the buyer
 * still confirms and pays again.
 */
export async function getReorderItemsAction(orderId: string): Promise<
  { ok: true; branchId: string; businessSlug: string; items: ReorderCartLine[] } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, business: true, branch: { include: { itemAvailability: true } } }
  });
  if (!order || order.buyerId !== user.id) return { ok: false, error: "Order not found." };

  const items: ReorderCartLine[] = [];
  for (const item of order.items) {
    const availability = order.branch.itemAvailability.find((a) => a.menuItemId === item.menuItemId);
    if (availability?.isAvailable !== false && availability?.isInstantOrderable) {
      items.push({ menuItemId: item.menuItemId, name: item.nameSnapshot, quantity: item.quantity });
    }
  }

  if (items.length === 0) {
    return { ok: false, error: "None of the items from this order are currently available for instant reorder." };
  }

  return { ok: true, branchId: order.branchId, businessSlug: order.business.slug, items };
}
