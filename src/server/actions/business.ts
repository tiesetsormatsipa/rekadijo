"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/server/actions/auth";

const onboardSchema = z.object({
  businessName: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  addressLine: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY", "EITHER"]),
  deliveryRadiusKm: z.coerce.number().optional(),
  minOrderAmount: z.coerce.number().optional()
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function registerBusinessAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in first." };

  const parsed = onboardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const data = parsed.data;

  const baseSlug = slugify(data.businessName);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const business = await prisma.business.create({
    data: {
      slug,
      name: data.businessName,
      ownerId: user.id,
      category: data.category,
      description: data.description,
      whatsapp: data.whatsapp,
      email: data.email || undefined,
      minOrderAmount: data.minOrderAmount,
      status: "PENDING_VERIFICATION",
      orderingMode: "QUOTATION_ONLY",
      branches: {
        create: {
          name: `${data.businessName} — ${data.city}`,
          addressLine: data.addressLine,
          city: data.city,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          fulfillmentType: data.fulfillmentType,
          deliveryRadiusKm: data.deliveryRadiusKm,
          isActive: false // activated once verified
        }
      }
    }
  });

  if (user.globalRole !== "VENDOR_OWNER") {
    await prisma.user.update({ where: { id: user.id }, data: { globalRole: "VENDOR_OWNER" } });
  }
  await prisma.businessStaff.create({
    data: { businessId: business.id, userId: user.id, role: "OWNER", joinedAt: new Date() }
  });

  redirect("/dashboard/vendor?onboarded=1");
}
