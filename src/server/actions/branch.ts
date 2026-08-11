"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/auth";

const settingsSchema = z.object({
  businessId: z.string(),
  description: z.string().optional(),
  category: z.string().min(2),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  minOrderAmount: z.coerce.number().optional(),
  leadTimeHours: z.coerce.number().int().min(1).default(24),
  quotationResponseHours: z.coerce.number().int().min(1).default(48),
  orderingMode: z.enum(["QUOTATION_ONLY", "INSTANT_ONLY", "BOTH"])
});

export async function updateBusinessSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canEdit = await hasPermission(user.id, PERMISSIONS.BUSINESS_SETTINGS_EDIT, parsed.data.businessId);
  if (!canEdit) return { ok: false, error: "Not authorized." };

  await prisma.business.update({
    where: { id: parsed.data.businessId },
    data: {
      description: parsed.data.description,
      category: parsed.data.category,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email || undefined,
      minOrderAmount: parsed.data.minOrderAmount,
      leadTimeHours: parsed.data.leadTimeHours,
      quotationResponseHours: parsed.data.quotationResponseHours,
      orderingMode: parsed.data.orderingMode
    }
  });

  revalidatePath("/dashboard/vendor/settings");
  return { ok: true };
}

const branchSchema = z.object({
  businessId: z.string(),
  name: z.string().min(2),
  addressLine: z.string().min(3),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY", "EITHER"]),
  deliveryRadiusKm: z.coerce.number().optional(),
  acceptsInstantOrders: z.coerce.boolean().optional()
});

export async function createBranchAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = branchSchema.safeParse({
    ...Object.fromEntries(formData),
    acceptsInstantOrders: formData.get("acceptsInstantOrders") === "on"
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canEdit = await hasPermission(user.id, PERMISSIONS.BRANCH_EDIT, parsed.data.businessId);
  if (!canEdit) return { ok: false, error: "Not authorized." };

  const business = await prisma.business.findUnique({ where: { id: parsed.data.businessId } });

  const branch = await prisma.branch.create({
    data: {
      businessId: parsed.data.businessId,
      name: parsed.data.name,
      addressLine: parsed.data.addressLine,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      fulfillmentType: parsed.data.fulfillmentType,
      deliveryRadiusKm: parsed.data.deliveryRadiusKm,
      acceptsInstantOrders: parsed.data.acceptsInstantOrders ?? false,
      isActive: business?.status === "APPROVED"
    }
  });

  for (let day = 0; day < 7; day++) {
    await prisma.operatingHour.create({
      data: { branchId: branch.id, dayOfWeek: day, openTime: "08:00", closeTime: "17:00", isClosed: day === 0 }
    });
  }

  revalidatePath("/dashboard/vendor/branches");
  return { ok: true };
}

const branchUpdateSchema = z.object({
  branchId: z.string(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY", "EITHER"]),
  deliveryRadiusKm: z.coerce.number().optional(),
  acceptsInstantOrders: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional()
});

export async function updateBranchSettingsAction(input: unknown) {
  const parsed = branchUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid branch settings." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const branch = await prisma.branch.findUnique({ where: { id: parsed.data.branchId } });
  if (!branch) return { ok: false as const, error: "Branch not found." };

  const canEdit = await hasPermission(user.id, PERMISSIONS.BRANCH_EDIT, branch.businessId);
  if (!canEdit) return { ok: false as const, error: "Not authorized." };

  await prisma.branch.update({
    where: { id: parsed.data.branchId },
    data: {
      fulfillmentType: parsed.data.fulfillmentType,
      deliveryRadiusKm: parsed.data.deliveryRadiusKm,
      acceptsInstantOrders: parsed.data.acceptsInstantOrders,
      isActive: parsed.data.isActive
    }
  });

  revalidatePath("/dashboard/vendor/branches");
  return { ok: true as const };
}

const hoursSchema = z.object({
  branchId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string(),
  closeTime: z.string(),
  isClosed: z.boolean()
});

export async function updateOperatingHourAction(input: unknown) {
  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid hours." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const branch = await prisma.branch.findUnique({ where: { id: parsed.data.branchId } });
  if (!branch) return { ok: false as const, error: "Branch not found." };
  const canEdit = await hasPermission(user.id, PERMISSIONS.BRANCH_EDIT, branch.businessId);
  if (!canEdit) return { ok: false as const, error: "Not authorized." };

  await prisma.operatingHour.upsert({
    where: { branchId_dayOfWeek: { branchId: parsed.data.branchId, dayOfWeek: parsed.data.dayOfWeek } },
    update: { openTime: parsed.data.openTime, closeTime: parsed.data.closeTime, isClosed: parsed.data.isClosed },
    create: {
      branchId: parsed.data.branchId,
      dayOfWeek: parsed.data.dayOfWeek,
      openTime: parsed.data.openTime,
      closeTime: parsed.data.closeTime,
      isClosed: parsed.data.isClosed
    }
  });

  revalidatePath("/dashboard/vendor/branches");
  return { ok: true as const };
}
