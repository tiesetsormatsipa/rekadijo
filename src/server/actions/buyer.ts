"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/server/actions/auth";

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
});

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined
  });
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone }
  });

  revalidatePath("/dashboard/buyer/profile");
  return { ok: true };
}

const addressSchema = z.object({
  label: z.string().min(1),
  addressLine: z.string().min(3),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional()
});

export async function addAddressAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Please check the address fields." };

  const existingCount = await prisma.buyerAddress.count({ where: { userId: user.id } });

  await prisma.buyerAddress.create({
    data: {
      userId: user.id,
      label: parsed.data.label,
      addressLine: parsed.data.addressLine,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      isDefault: existingCount === 0
    }
  });

  revalidatePath("/dashboard/buyer/profile");
  return { ok: true };
}

export async function deleteAddressAction(addressId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const address = await prisma.buyerAddress.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== user.id) return { ok: false as const, error: "Not found." };

  await prisma.buyerAddress.delete({ where: { id: addressId } });
  revalidatePath("/dashboard/buyer/profile");
  return { ok: true as const };
}

export async function toggleFavoriteMenuItemAction(menuItemId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in to save favorites." };

  const existing = await prisma.favoriteMenuItem.findUnique({
    where: { userId_menuItemId: { userId: user.id, menuItemId } }
  });

  if (existing) {
    await prisma.favoriteMenuItem.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/buyer/favorites");
    return { ok: true as const, favorited: false };
  }

  await prisma.favoriteMenuItem.create({ data: { userId: user.id, menuItemId } });
  revalidatePath("/dashboard/buyer/favorites");
  return { ok: true as const, favorited: true };
}

export async function toggleSavedVendorAction(businessId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in to save vendors." };

  const existing = await prisma.savedVendor.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } }
  });

  if (existing) {
    await prisma.savedVendor.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/buyer/saved");
    return { ok: true as const, saved: false };
  }

  await prisma.savedVendor.create({ data: { userId: user.id, businessId } });
  revalidatePath("/dashboard/buyer/saved");
  return { ok: true as const, saved: true };
}
