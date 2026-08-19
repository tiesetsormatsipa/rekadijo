"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { assertTransition, generateReference } from "@/lib/quotation";
import { QUOTATION_EXPIRABLE_STATUSES } from "@/lib/quotation-revisions";
import { classifyOrderSize, haversineDistanceKm, estimateDeliveryFee } from "@/lib/geo";
import { resolveServerLinePricing, type MenuOption } from "@/lib/menu-options";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import type { OrderStatus } from "@prisma/client";

const cartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1),
  optionLabel: z.string().optional(),
  optionLabels: z.array(z.string()).optional()
});

const createQuotationSchema = z.object({
  businessId: z.string(),
  branchId: z.string(),
  eventType: z.string().optional(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  requestedDate: z.string(),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  items: z.array(cartItemSchema).min(1, "Add at least one item to request a quotation.")
});

export type QuotationActionResult = { ok: true; quotationId: string } | { ok: false; error: string };

export async function createQuotationAction(input: unknown): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to request a quotation." };

  const parsed = createQuotationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quotation request." };
  }
  const data = parsed.data;

  const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
  if (!branch) return { ok: false, error: "Branch not found." };

  let estimatedDeliveryFee: number | undefined;
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
    estimatedDeliveryFee = estimateDeliveryFee(distanceKm);
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: data.items.map((i) => i.menuItemId) } },
    include: { options: true }
  });

  let subtotal = 0;
  let totalUnits = 0;
  const itemsToCreate = data.items.map((cartItem) => {
    const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
    if (!menuItem) throw new Error("Menu item no longer exists.");
    const dbOptions: MenuOption[] = menuItem.options.map((o) => ({
      name: o.name,
      choiceLabel: o.choiceLabel,
      priceDelta: Number(o.priceDelta),
      isDefault: o.isDefault
    }));
    const optionLabels = cartItem.optionLabels ?? (cartItem.optionLabel ? [cartItem.optionLabel] : undefined);
    const pricing = resolveServerLinePricing(Number(menuItem.basePrice), dbOptions, optionLabels);
    const lineTotal = pricing.unitPrice * cartItem.quantity;
    subtotal += lineTotal;
    totalUnits += cartItem.quantity;
    const suffix = optionLabels?.length ? ` (${optionLabels.join(", ")})` : "";
    return {
      menuItemId: menuItem.id,
      nameSnapshot: `${menuItem.name}${suffix}`,
      quantity: cartItem.quantity,
      unitPrice: pricing.unitPrice,
      lineTotal,
      optionsSnapshot: pricing.optionsSnapshot
    };
  });

  const sizeInfo = classifyOrderSize(totalUnits);

  const quotation = await prisma.quotation.create({
    data: {
      reference: generateReference("RQ"),
      businessId: data.businessId,
      branchId: data.branchId,
      buyerId: user.id,
      source: "BUYER_INITIATED",
      status: "PENDING",
      eventType: data.eventType,
      fulfillmentType: data.fulfillmentType,
      requestedDate: new Date(data.requestedDate),
      notes: data.notes,
      deliveryAddress: data.fulfillmentType === "DELIVERY" ? data.deliveryAddress : undefined,
      deliveryLat: data.fulfillmentType === "DELIVERY" ? data.deliveryLat : undefined,
      deliveryLng: data.fulfillmentType === "DELIVERY" ? data.deliveryLng : undefined,
      deliveryFee: estimatedDeliveryFee,
      subtotal,
      total: subtotal + (estimatedDeliveryFee ?? 0),
      sizeCategory: sizeInfo.category,
      estimatedServings: totalUnits,
      items: { create: itemsToCreate }
    }
  });

  await prisma.notification.create({
    data: {
      userId: (await prisma.business.findUniqueOrThrow({ where: { id: data.businessId } })).ownerId,
      type: "QUOTATION_CREATED",
      title: "New quotation request",
      body: `${user.firstName} requested a quotation (${quotation.reference}).`,
      linkUrl: `/dashboard/vendor/quotations/${quotation.id}`
    }
  });

  revalidatePath("/dashboard/buyer");
  return { ok: true, quotationId: quotation.id };
}

export async function markQuotationViewedAction(quotationId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation || quotation.status !== "PENDING") return;
  const canRespond = await hasPermission(user.id, PERMISSIONS.QUOTATION_RESPOND, quotation.businessId);
  if (!canRespond) return;
  assertTransition(quotation.status, "VIEWED");
  await prisma.quotation.update({ where: { id: quotationId }, data: { status: "VIEWED", viewedAt: new Date() } });
  revalidatePath(`/dashboard/vendor/quotations/${quotationId}`);
}

const reviseSchema = z.object({
  quotationId: z.string(),
  message: z.string().optional(),
  items: z.array(z.object({ menuItemId: z.string(), nameSnapshot: z.string(), quantity: z.number(), unitPrice: z.number() })),
  deliveryFee: z.number().optional()
});

export async function reviseQuotationAction(input: unknown): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const parsed = reviseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid revision." };
  const data = parsed.data;

  const quotation = await prisma.quotation.findUnique({ where: { id: data.quotationId } });
  if (!quotation) return { ok: false, error: "Quotation not found." };

  const canRespond = await hasPermission(user.id, PERMISSIONS.QUOTATION_RESPOND, quotation.businessId);
  if (!canRespond) return { ok: false, error: "You don't have permission to revise this quotation." };

  assertTransition(quotation.status, "REVISED");

  const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = subtotal + (data.deliveryFee ?? 0);
  const revisionNo = (await prisma.quotationRevision.count({ where: { quotationId: quotation.id } })) + 1;

  await prisma.$transaction([
    prisma.quotationRevision.create({
      data: {
        quotationId: quotation.id,
        revisedById: user.id,
        revisionNo,
        itemsSnapshot: data.items,
        subtotal,
        deliveryFee: data.deliveryFee,
        total,
        message: data.message
      }
    }),
    prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: "REVISED", subtotal, total, deliveryFee: data.deliveryFee, vendorMessage: data.message }
    })
  ]);

  await prisma.notification.create({
    data: {
      userId: quotation.buyerId,
      type: "QUOTATION_REVISED",
      title: "Your quotation was revised",
      body: `The vendor sent a revised quotation for ${quotation.reference}.`,
      linkUrl: `/dashboard/buyer/quotations/${quotation.id}`
    }
  });

  revalidatePath(`/dashboard/vendor/quotations/${quotation.id}`);
  return { ok: true, quotationId: quotation.id };
}

/** Mark quotation EXPIRED when past expiresAt and still in an open status. */
export async function expireQuotationIfNeeded(quotationId: string): Promise<void> {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation?.expiresAt || quotation.expiresAt >= new Date()) return;
  if (!QUOTATION_EXPIRABLE_STATUSES.includes(quotation.status as (typeof QUOTATION_EXPIRABLE_STATUSES)[number])) {
    return;
  }
  assertTransition(quotation.status, "EXPIRED");
  await prisma.quotation.update({ where: { id: quotationId }, data: { status: "EXPIRED" } });
  revalidatePath(`/dashboard/buyer/quotations/${quotationId}`);
  revalidatePath(`/dashboard/vendor/quotations/${quotationId}`);
}

export async function respondToQuotationAction(
  quotationId: string,
  action: "ACCEPT" | "DECLINE",
  message?: string
): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) return { ok: false, error: "Quotation not found." };
  if (quotation.status === "EXPIRED") return { ok: false, error: "This quotation has expired." };

  const isVendorSide = await hasPermission(user.id, PERMISSIONS.QUOTATION_RESPOND, quotation.businessId);
  const isBuyer = quotation.buyerId === user.id;

  if (action === "DECLINE") {
    if (!isVendorSide && !isBuyer) return { ok: false, error: "Not authorized." };
    assertTransition(quotation.status, "DECLINED");
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "DECLINED", declinedAt: new Date(), vendorMessage: message }
    });
    return { ok: true, quotationId };
  }

  // ACCEPT: only the buyer accepts a vendor's quotation/revision.
  if (!isBuyer) return { ok: false, error: "Only the buyer can accept a quotation." };
  assertTransition(quotation.status, "ACCEPTED");
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "ACCEPTED", acceptedAt: new Date() }
  });
  assertTransition("ACCEPTED", "PAYMENT_PENDING");
  await prisma.quotation.update({ where: { id: quotationId }, data: { status: "PAYMENT_PENDING" } });

  revalidatePath(`/dashboard/buyer/quotations/${quotationId}`);
  revalidatePath(`/dashboard/vendor/quotations/${quotationId}`);
  return { ok: true, quotationId };
}

/**
 * Placeholder payment step. Real gateway integration (PayFast/Yoco/Stripe/etc.)
 * is intentionally not wired per the project brief — this simulates a
 * successful payment so the rest of the fulfillment flow (scheduling,
 * preparation, completion) can be exercised end-to-end.
 */
export async function payQuotationAction(quotationId: string, tipAmount = 0): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
  if (!quotation || quotation.buyerId !== user.id) return { ok: false, error: "Not authorized." };
  if (quotation.status === "EXPIRED") return { ok: false, error: "This quotation has expired." };
  if (quotation.status !== "PAYMENT_PENDING") return { ok: false, error: "This quotation isn't ready for payment." };

  assertTransition(quotation.status, "PAID");
  const total = Number(quotation.total) + tipAmount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference: generateReference("RO"),
        type: "QUOTATION",
        quotationId: quotation.id,
        businessId: quotation.businessId,
        branchId: quotation.branchId,
        buyerId: quotation.buyerId,
        status: "PAID",
        fulfillmentType: quotation.fulfillmentType,
        isAsap: false,
        scheduledFor: quotation.requestedDate,
        deliveryAddress: quotation.deliveryAddress,
        deliveryFee: quotation.deliveryFee,
        subtotal: quotation.subtotal,
        tipAmount,
        total,
        sizeCategory: quotation.sizeCategory,
        items: {
          create: quotation.items.map((item) => ({
            menuItemId: item.menuItemId,
            nameSnapshot: item.nameSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            optionsSnapshot: item.optionsSnapshot ?? undefined
          }))
        }
      }
    });

    await tx.payment.create({
      data: {
        orderId: created.id,
        provider: "PLACEHOLDER_MANUAL",
        status: "SUCCESS",
        amount: total,
        paidAt: new Date()
      }
    });

    await tx.quotation.update({ where: { id: quotation.id }, data: { status: "PAID", paidAt: new Date() } });
    await tx.quotation.update({ where: { id: quotation.id }, data: { status: "SCHEDULED" } });
    await tx.order.update({ where: { id: created.id }, data: { status: "SCHEDULED" } });

    return created;
  });

  await prisma.notification.create({
    data: {
      userId: (await prisma.business.findUniqueOrThrow({ where: { id: quotation.businessId } })).ownerId,
      type: "PAYMENT_RECEIVED",
      title: "Payment received",
      body: `Payment received for ${quotation.reference}. Order ${order.reference} is scheduled.`,
      linkUrl: `/dashboard/vendor/orders/${order.id}`
    }
  });

  revalidatePath(`/dashboard/buyer/quotations/${quotationId}`);
  return { ok: true, quotationId };
}

export async function updateBranchItemAvailabilityAction(input: {
  branchId: string;
  menuItemId: string;
  isAvailable: boolean;
  isInstantOrderable: boolean;
  stockQuantity: number | null;
}): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
  if (!branch) return { ok: false, error: "Branch not found." };

  const canEdit = await hasPermission(user.id, PERMISSIONS.BRANCH_AVAILABILITY_EDIT, branch.businessId);
  if (!canEdit) return { ok: false, error: "Not authorized." };

  await prisma.branchItemAvailability.upsert({
    where: { branchId_menuItemId: { branchId: input.branchId, menuItemId: input.menuItemId } },
    update: {
      isAvailable: input.isAvailable,
      isInstantOrderable: input.isInstantOrderable,
      stockQuantity: input.stockQuantity
    },
    create: {
      branchId: input.branchId,
      menuItemId: input.menuItemId,
      isAvailable: input.isAvailable,
      isInstantOrderable: input.isInstantOrderable,
      stockQuantity: input.stockQuantity
    }
  });

  revalidatePath("/dashboard/vendor/branches");
  return { ok: true, quotationId: input.menuItemId };
}

export async function verifyBusinessAction(businessId: string, decision: "APPROVE" | "REJECT", notes?: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canVerify = await hasPermission(user.id, PERMISSIONS.BUSINESS_VERIFY);
  if (!canVerify) return { ok: false, error: "Not authorized." };

  const business = await prisma.business.findUnique({ where: { id: businessId }, include: { branches: true } });
  if (!business) return { ok: false, error: "Business not found." };

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: {
        status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
        verifiedAt: decision === "APPROVE" ? new Date() : null,
        verificationNotes: notes
      }
    });
    if (decision === "APPROVE") {
      await tx.branch.updateMany({ where: { businessId }, data: { isActive: true } });
    }
    await tx.adminAction.create({
      data: {
        actorId: user.id,
        actionType: decision === "APPROVE" ? "business.approve" : "business.reject",
        targetType: "Business",
        targetId: businessId,
        reason: notes
      }
    });
    await tx.notification.create({
      data: {
        userId: business.ownerId,
        type: decision === "APPROVE" ? "BUSINESS_VERIFIED" : "BUSINESS_REJECTED",
        title: decision === "APPROVE" ? "Business approved" : "Business verification rejected",
        body:
          decision === "APPROVE"
            ? `${business.name} is now live on RekaDijo.`
            : `${business.name} was not approved. ${notes ?? ""}`,
        linkUrl: "/dashboard/vendor"
      }
    });
  });

  revalidatePath("/dashboard/admin");
  return { ok: true, quotationId: businessId } as QuotationActionResult;
}

export async function suspendBusinessAction(businessId: string, suspend: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canSuspend = await hasPermission(user.id, PERMISSIONS.BUSINESS_SUSPEND);
  if (!canSuspend) return { ok: false, error: "Not authorized." };

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { ok: false, error: "Business not found." };

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: businessId },
      data: { status: suspend ? "SUSPENDED" : "APPROVED" }
    });
    await tx.branch.updateMany({ where: { businessId }, data: { isActive: !suspend } });
    await tx.adminAction.create({
      data: {
        actorId: user.id,
        actionType: suspend ? "business.suspend" : "business.restore",
        targetType: "Business",
        targetId: businessId
      }
    });
  });

  revalidatePath("/dashboard/admin/businesses");
  return { ok: true, quotationId: businessId } as QuotationActionResult;
}

export async function suspendUserAction(userId: string, suspend: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canSuspend = await hasPermission(user.id, PERMISSIONS.USER_SUSPEND);
  if (!canSuspend) return { ok: false, error: "Not authorized." };

  await prisma.user.update({ where: { id: userId }, data: { status: suspend ? "SUSPENDED" : "ACTIVE" } });
  await prisma.adminAction.create({
    data: {
      actorId: user.id,
      actionType: suspend ? "user.suspend" : "user.restore",
      targetType: "User",
      targetId: userId
    }
  });
  revalidatePath("/dashboard/admin");
  return { ok: true, quotationId: userId } as QuotationActionResult;
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<QuotationActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };

  const canManage = await hasPermission(user.id, PERMISSIONS.ORDER_MANAGE, order.businessId);
  if (!canManage) return { ok: false, error: "Not authorized." };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
      canceledAt: status === "CANCELED" ? new Date() : undefined
    }
  });

  revalidatePath(`/dashboard/vendor/orders/${orderId}`);
  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  return { ok: true, quotationId: orderId };
}
