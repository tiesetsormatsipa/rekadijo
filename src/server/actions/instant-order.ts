"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateReference } from "@/lib/quotation";
import { calculateDiscount } from "@/lib/promotions";
import { haversineDistanceKm, estimateDeliveryFee } from "@/lib/geo";
import type { QuotationActionResult } from "@/server/actions/quotations";

const cartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1),
  optionLabel: z.string().optional()
});

const instantOrderSchema = z.object({
  businessId: z.string(),
  branchId: z.string(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  items: z.array(cartItemSchema).min(1),
  promoCode: z.string().optional(),
  tipAmount: z.number().min(0).optional(),
  isAsap: z.boolean().default(true),
  scheduledFor: z.string().optional()
});

/**
 * Instant order — for vendors/branches/items where instant ordering is
 * enabled. Unlike quotation orders, there is no vendor-approval step:
 * payment happens immediately (placeholder gateway) and the order is
 * scheduled for the vendor's default lead time straight away.
 */
export async function createInstantOrderAction(input: unknown): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to order." };

  const parsed = instantOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order." };
  const data = parsed.data;

  const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
  if (!branch || !branch.acceptsInstantOrders) {
    return { ok: false, error: "Instant ordering isn't available at this branch." };
  }

  // Real delivery validation — recomputed server-side, never trusting a
  // client-sent fee or distance, using the branch's actual configured radius.
  let deliveryFee = 0;
  if (data.fulfillmentType === "DELIVERY") {
    if (data.deliveryLat == null || data.deliveryLng == null) {
      return { ok: false, error: "Please choose a delivery address." };
    }
    const distanceKm = haversineDistanceKm(
      { lat: Number(branch.latitude), lng: Number(branch.longitude) },
      { lat: data.deliveryLat, lng: data.deliveryLng }
    );
    const radius = branch.deliveryRadiusKm ? Number(branch.deliveryRadiusKm) : Infinity;
    if (distanceKm > radius) {
      return {
        ok: false,
        error: `That address is ${distanceKm.toFixed(1)} km away — outside this branch's ${radius}km delivery range. Try pickup instead.`
      };
    }
    deliveryFee = estimateDeliveryFee(distanceKm);
  }

  const availabilities = await prisma.branchItemAvailability.findMany({
    where: { branchId: data.branchId, menuItemId: { in: data.items.map((i) => i.menuItemId) } }
  });
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: data.items.map((i) => i.menuItemId) } },
    include: { options: true }
  });

  for (const cartItem of data.items) {
    const availability = availabilities.find((a) => a.menuItemId === cartItem.menuItemId);
    const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
    const isInstant = availability?.isInstantOrderable ?? menuItem?.allowInstantOrder ?? false;
    const isAvailable = availability?.isAvailable ?? true;
    if (!menuItem || !isInstant || !isAvailable) {
      return { ok: false, error: `${menuItem?.name ?? "An item"} isn't available for instant order at this branch.` };
    }
    if (availability?.stockQuantity != null && availability.stockQuantity < cartItem.quantity) {
      return { ok: false, error: `Not enough stock for ${menuItem.name}.` };
    }
  }

  let subtotal = 0;
  const itemsToCreate = data.items.map((cartItem) => {
    const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId)!;
    const option = menuItem.options.find((o) => o.choiceLabel === cartItem.optionLabel);
    const unitPrice = Number(menuItem.basePrice) + Number(option?.priceDelta ?? 0);
    const lineTotal = unitPrice * cartItem.quantity;
    subtotal += lineTotal;
    return {
      menuItemId: menuItem.id,
      nameSnapshot: option ? `${menuItem.name} (${option.choiceLabel})` : menuItem.name,
      quantity: cartItem.quantity,
      unitPrice,
      lineTotal,
      optionsSnapshot: option ? { choiceLabel: option.choiceLabel } : undefined
    };
  });

  const business = await prisma.business.findUniqueOrThrow({ where: { id: data.businessId } });
  const asapScheduledFor = new Date(Date.now() + business.leadTimeHours * 60 * 60 * 1000);
  const scheduledFor = data.isAsap ? asapScheduledFor : data.scheduledFor ? new Date(data.scheduledFor) : asapScheduledFor;

  let discountAmount = 0;
  let promotionId: string | null = null;
  let freeDelivery = false;
  if (data.promoCode) {
    const promotion = await prisma.promotion.findUnique({ where: { code: data.promoCode.trim().toUpperCase() } });
    if (promotion && promotion.isActive && (promotion.scope === "PLATFORM" || promotion.businessId === data.businessId)) {
      const result = calculateDiscount(
        {
          type: promotion.type,
          value: Number(promotion.value),
          minOrderAmount: promotion.minOrderAmount ? Number(promotion.minOrderAmount) : null,
          maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : null
        },
        subtotal
      );
      discountAmount = result.discountAmount;
      freeDelivery = result.freeDelivery;
      promotionId = promotion.id;
    }
  }

  if (freeDelivery) deliveryFee = 0;
  const tipAmount = data.tipAmount ?? 0;
  const total = Math.max(0, subtotal - discountAmount) + deliveryFee + tipAmount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference: generateReference("RO"),
        type: "INSTANT",
        businessId: data.businessId,
        branchId: data.branchId,
        buyerId: user.id,
        status: "PAID",
        fulfillmentType: data.fulfillmentType,
        isAsap: data.isAsap,
        scheduledFor,
        deliveryAddress: data.fulfillmentType === "DELIVERY" ? data.deliveryAddress : undefined,
        deliveryLat: data.fulfillmentType === "DELIVERY" ? data.deliveryLat : undefined,
        deliveryLng: data.fulfillmentType === "DELIVERY" ? data.deliveryLng : undefined,
        deliveryFee: data.fulfillmentType === "DELIVERY" ? deliveryFee : undefined,
        subtotal,
        discountAmount,
        tipAmount,
        total,
        sizeCategory: "SMALL",
        items: { create: itemsToCreate }
      }
    });

    await tx.payment.create({
      data: { orderId: created.id, provider: "PLACEHOLDER_MANUAL", status: "SUCCESS", amount: total, paidAt: new Date() }
    });

    if (promotionId && (discountAmount > 0 || freeDelivery)) {
      await tx.promotionRedemption.create({
        data: { promotionId, userId: user.id, orderId: created.id, amountOff: discountAmount }
      });
    }

    // Decrement branch stock where tracked
    for (const cartItem of data.items) {
      const availability = availabilities.find((a) => a.menuItemId === cartItem.menuItemId);
      if (availability?.stockQuantity != null) {
        await tx.branchItemAvailability.update({
          where: { id: availability.id },
          data: { stockQuantity: availability.stockQuantity - cartItem.quantity }
        });
      }
    }

    await tx.order.update({ where: { id: created.id }, data: { status: "SCHEDULED" } });
    return created;
  });

  await prisma.notification.create({
    data: {
      userId: business.ownerId,
      type: "ORDER_STATUS_CHANGED",
      title: "New instant order",
      body: `${user.firstName} placed an instant order (${order.reference}).`,
      linkUrl: `/dashboard/vendor/orders`
    }
  });

  revalidatePath("/dashboard/buyer");
  return { ok: true, quotationId: order.id };
}
