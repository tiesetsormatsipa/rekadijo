"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import type { DriverAssignmentStatus } from "@prisma/client";
import type { ActionResult } from "@/server/actions/auth";

const driverProfileSchema = z.object({
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional()
});

export async function updateDriverProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const parsed = driverProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Please check the form." };

  await prisma.driverProfile.update({
    where: { userId: user.id },
    data: { vehicleType: parsed.data.vehicleType, licensePlate: parsed.data.licensePlate }
  });

  revalidatePath("/dashboard/driver/profile");
  return { ok: true };
}

const assignSchema = z.object({ orderId: z.string(), driverId: z.string() });

export async function assignDriverToOrderAction(input: unknown) {
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid assignment." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return { ok: false as const, error: "Order not found." };

  const canManage = await hasPermission(user.id, PERMISSIONS.ORDER_MANAGE, order.businessId);
  if (!canManage) return { ok: false as const, error: "Not authorized." };

  const existing = await prisma.driverAssignment.findUnique({ where: { orderId: order.id } });
  if (existing) {
    await prisma.driverAssignment.update({
      where: { orderId: order.id },
      data: { driverId: parsed.data.driverId, status: "ASSIGNED", assignedAt: new Date() }
    });
  } else {
    await prisma.driverAssignment.create({
      data: { orderId: order.id, driverId: parsed.data.driverId, branchId: order.branchId, status: "ASSIGNED" }
    });
  }

  const driver = await prisma.driverProfile.findUnique({ where: { id: parsed.data.driverId } });
  if (driver) {
    await prisma.notification.create({
      data: {
        userId: driver.userId,
        type: "DRIVER_ASSIGNED",
        title: "New delivery assignment",
        body: `You've been assigned to deliver order ${order.reference}.`,
        linkUrl: "/dashboard/driver"
      }
    });
  }

  revalidatePath(`/dashboard/vendor/orders/${order.id}`);
  revalidatePath("/dashboard/driver");
  return { ok: true as const };
}

const updateAssignmentSchema = z.object({
  assignmentId: z.string(),
  status: z.enum(["ACCEPTED", "DECLINED", "EN_ROUTE_PICKUP", "PICKED_UP", "EN_ROUTE_DROPOFF", "DELIVERED", "CANCELED"])
});

export async function updateDriverAssignmentStatusAction(input: unknown) {
  const parsed = updateAssignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid status." };

  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const assignment = await prisma.driverAssignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { driver: true, order: true }
  });
  if (!assignment) return { ok: false as const, error: "Assignment not found." };
  if (assignment.driver.userId !== user.id) return { ok: false as const, error: "Not authorized." };

  const status = parsed.data.status as DriverAssignmentStatus;
  await prisma.driverAssignment.update({
    where: { id: assignment.id },
    data: {
      status,
      pickedUpAt: status === "PICKED_UP" ? new Date() : undefined,
      deliveredAt: status === "DELIVERED" ? new Date() : undefined
    }
  });

  if (status === "PICKED_UP") {
    await prisma.order.update({ where: { id: assignment.orderId }, data: { status: "OUT_FOR_DELIVERY" } });
  }
  if (status === "DELIVERED") {
    await prisma.order.update({ where: { id: assignment.orderId }, data: { status: "DELIVERED" } });
  }

  revalidatePath("/dashboard/driver");
  revalidatePath(`/dashboard/buyer/orders/${assignment.orderId}`);
  return { ok: true as const };
}

export async function setDriverAvailabilityAction(isAvailable: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { ok: false as const, error: "No driver profile found." };

  await prisma.driverProfile.update({ where: { id: profile.id }, data: { isAvailable } });
  revalidatePath("/dashboard/driver");
  return { ok: true as const };
}
