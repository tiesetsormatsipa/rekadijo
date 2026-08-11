"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { saveFile } from "@/lib/storage";
import type { ActionResult } from "@/server/actions/auth";

async function requireMenuEditAccess(businessId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const allowed = await hasPermission(user.id, PERMISSIONS.MENU_EDIT, businessId);
  return allowed ? user : null;
}

const categorySchema = z.object({
  businessId: z.string(),
  name: z.string().min(1)
});

export async function createCategoryAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Please provide a category name." };

  const user = await requireMenuEditAccess(parsed.data.businessId);
  if (!user) return { ok: false, error: "Not authorized." };

  const count = await prisma.menuCategory.count({ where: { businessId: parsed.data.businessId } });
  await prisma.menuCategory.create({
    data: { businessId: parsed.data.businessId, name: parsed.data.name, sortOrder: count }
  });

  revalidatePath("/dashboard/vendor/menu");
  return { ok: true };
}

export async function deleteCategoryAction(categoryId: string) {
  const category = await prisma.menuCategory.findUnique({ where: { id: categoryId } });
  if (!category) return { ok: false as const, error: "Category not found." };
  const user = await requireMenuEditAccess(category.businessId);
  if (!user) return { ok: false as const, error: "Not authorized." };

  await prisma.menuCategory.delete({ where: { id: categoryId } });
  revalidatePath("/dashboard/vendor/menu");
  return { ok: true as const };
}

const itemSchema = z.object({
  businessId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  unitLabel: z.string().optional(),
  minQuantity: z.coerce.number().int().min(1).default(1),
  maxQuantity: z.coerce.number().int().optional(),
  allowInstantOrder: z.coerce.boolean().optional(),
  allowQuotation: z.coerce.boolean().optional(),
  showStockToBuyer: z.coerce.boolean().optional(),
  dietaryTags: z.array(z.enum(["VEGETARIAN", "VEGAN", "HALAL", "KOSHER", "CONTAINS_NUTS", "SPICY", "GLUTEN_FREE"])).optional()
});

export async function createMenuItemAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = itemSchema.safeParse({
    ...raw,
    allowInstantOrder: formData.get("allowInstantOrder") === "on",
    allowQuotation: formData.get("allowQuotation") === "on",
    showStockToBuyer: formData.get("showStockToBuyer") === "on",
    dietaryTags: formData.getAll("dietaryTags")
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const user = await requireMenuEditAccess(parsed.data.businessId);
  if (!user) return { ok: false, error: "Not authorized." };

  const count = await prisma.menuItem.count({ where: { categoryId: parsed.data.categoryId } });
  await prisma.menuItem.create({
    data: {
      businessId: parsed.data.businessId,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description,
      basePrice: parsed.data.basePrice,
      unitLabel: parsed.data.unitLabel,
      minQuantity: parsed.data.minQuantity,
      maxQuantity: parsed.data.maxQuantity,
      allowInstantOrder: parsed.data.allowInstantOrder ?? false,
      allowQuotation: parsed.data.allowQuotation ?? true,
      showStockToBuyer: parsed.data.showStockToBuyer ?? false,
      dietaryTags: parsed.data.dietaryTags ?? [],
      sortOrder: count
    }
  });

  revalidatePath("/dashboard/vendor/menu");
  return { ok: true };
}

export async function toggleMenuItemActiveAction(menuItemId: string) {
  const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!item) return { ok: false as const, error: "Item not found." };
  const user = await requireMenuEditAccess(item.businessId);
  if (!user) return { ok: false as const, error: "Not authorized." };

  await prisma.menuItem.update({ where: { id: menuItemId }, data: { isActive: !item.isActive } });
  revalidatePath("/dashboard/vendor/menu");
  return { ok: true as const };
}

export async function deleteMenuItemAction(menuItemId: string) {
  const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!item) return { ok: false as const, error: "Item not found." };
  const user = await requireMenuEditAccess(item.businessId);
  if (!user) return { ok: false as const, error: "Not authorized." };

  // Soft delete to preserve historical quotation/order line-item snapshots.
  await prisma.menuItem.update({ where: { id: menuItemId }, data: { deletedAt: new Date(), isActive: false } });
  revalidatePath("/dashboard/vendor/menu");
  return { ok: true as const };
}

export async function uploadMenuItemMediaAction(menuItemId: string, formData: FormData) {
  const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!item) return { ok: false as const, error: "Item not found." };
  const user = await requireMenuEditAccess(item.businessId);
  if (!user) return { ok: false as const, error: "Not authorized." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false as const, error: "Please choose a file." };

  try {
    const { url } = await saveFile(file);
    const type = file.type.startsWith("video") ? "VIDEO" : file.type === "image/gif" ? "GIF" : "IMAGE";
    await prisma.media.create({
      data: { type, url, ownerType: "MENU_ITEM", menuItemId, businessId: item.businessId }
    });
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Upload failed." };
  }

  revalidatePath("/dashboard/vendor/menu");
  return { ok: true as const };
}

export async function deleteMediaAction(mediaId: string) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || !media.businessId) return { ok: false as const, error: "Not found." };
  const user = await requireMenuEditAccess(media.businessId);
  if (!user) return { ok: false as const, error: "Not authorized." };

  await prisma.media.delete({ where: { id: mediaId } });
  revalidatePath("/dashboard/vendor/menu");
  return { ok: true as const };
}
