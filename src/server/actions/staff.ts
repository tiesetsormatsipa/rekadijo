"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/auth";
import type { StaffRole } from "@prisma/client";

/**
 * Invites an existing RekaDijo user (by email) as staff at this business
 * with a base StaffRole (kept for quick filtering/display) and seeds their
 * fine-grained UserRole from DEFAULT_STAFF_ROLE_PERMISSIONS so
 * hasPermission() works immediately without extra setup.
 */
const inviteSchema = z.object({
  businessId: z.string(),
  email: z.string().email(),
  role: z.enum(["MANAGER", "KITCHEN", "FRONT_OF_HOUSE", "DRIVER_COORDINATOR"])
});

export async function inviteStaffAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Please provide a valid email and role." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canManage = await hasPermission(user.id, PERMISSIONS.STAFF_MANAGE, parsed.data.businessId);
  if (!canManage) return { ok: false, error: "Not authorized." };

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!invitee) {
    return { ok: false, error: "No RekaDijo account found with that email yet — ask them to sign up first." };
  }

  const existing = await prisma.businessStaff.findUnique({
    where: { businessId_userId: { businessId: parsed.data.businessId, userId: invitee.id } }
  });
  if (existing) return { ok: false, error: "This person is already staff at this business." };

  await prisma.$transaction(async (tx) => {
    await tx.businessStaff.create({
      data: {
        businessId: parsed.data.businessId,
        userId: invitee.id,
        role: parsed.data.role as StaffRole,
        joinedAt: new Date()
      }
    });

    if (invitee.globalRole === "BUYER") {
      await tx.user.update({ where: { id: invitee.id }, data: { globalRole: "VENDOR_STAFF" } });
    }

    const roleKey = `vendor_${parsed.data.role.toLowerCase()}`;
    const systemRole = await tx.role.findUnique({ where: { key: roleKey } });
    if (systemRole) {
      await tx.userRole.upsert({
        where: { userId_roleId_businessId: { userId: invitee.id, roleId: systemRole.id, businessId: parsed.data.businessId } },
        update: {},
        create: { userId: invitee.id, roleId: systemRole.id, businessId: parsed.data.businessId }
      });
    }
  });

  revalidatePath("/dashboard/vendor/staff");
  return { ok: true };
}

export async function removeStaffAction(businessStaffId: string) {
  const staff = await prisma.businessStaff.findUnique({ where: { id: businessStaffId } });
  if (!staff) return { ok: false as const, error: "Not found." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };
  const canManage = await hasPermission(user.id, PERMISSIONS.STAFF_MANAGE, staff.businessId);
  if (!canManage) return { ok: false as const, error: "Not authorized." };

  await prisma.$transaction([
    prisma.businessStaff.update({ where: { id: businessStaffId }, data: { isActive: false } }),
    prisma.userRole.deleteMany({ where: { userId: staff.userId, businessId: staff.businessId } })
  ]);

  revalidatePath("/dashboard/vendor/staff");
  return { ok: true as const };
}

const customRoleSchema = z.object({
  businessId: z.string(),
  name: z.string().min(2),
  permissions: z.array(z.string())
});

export async function createCustomRoleAction(input: unknown) {
  const parsed = customRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Please name the role and pick at least one permission." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };
  const canManage = await hasPermission(user.id, PERMISSIONS.STAFF_MANAGE, parsed.data.businessId);
  if (!canManage) return { ok: false as const, error: "Not authorized." };

  const key = `custom_${parsed.data.businessId}_${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const permissions = await prisma.permission.findMany({ where: { key: { in: parsed.data.permissions } } });

  const role = await prisma.role.create({
    data: {
      key,
      name: parsed.data.name,
      isSystem: false,
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) }
    }
  });

  revalidatePath("/dashboard/vendor/staff");
  return { ok: true as const, roleId: role.id };
}

export async function assignRoleToStaffAction(userId: string, businessId: string, roleId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };
  const canManage = await hasPermission(user.id, PERMISSIONS.STAFF_MANAGE, businessId);
  if (!canManage) return { ok: false as const, error: "Not authorized." };

  await prisma.userRole.upsert({
    where: { userId_roleId_businessId: { userId, roleId, businessId } },
    update: {},
    create: { userId, roleId, businessId }
  });

  revalidatePath("/dashboard/vendor/staff");
  return { ok: true as const };
}
