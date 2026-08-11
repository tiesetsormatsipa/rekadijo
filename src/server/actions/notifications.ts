"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function markNotificationReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== user.id) return { ok: false as const, error: "Not found." };

  await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  revalidatePath("/dashboard/notifications");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/dashboard/notifications");
  return { ok: true as const };
}
