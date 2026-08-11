"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import type { ActionResult } from "@/server/actions/auth";
import type { Prisma } from "@prisma/client";

/**
 * Simple key-value platform settings (e.g. default delivery fee model,
 * support contact overrides, feature flags). Stored as JSON in
 * PlatformSetting so new settings can be added without a migration.
 */
export async function getPlatformSetting(key: string) {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

const settingSchema = z.object({ key: z.string().min(1), value: z.string() });

export async function updatePlatformSettingAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = settingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid setting." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const canEdit = await hasPermission(user.id, PERMISSIONS.PLATFORM_SETTINGS_EDIT);
  if (!canEdit) return { ok: false, error: "Not authorized." };

  let value: unknown = parsed.data.value;
  try {
    value = JSON.parse(parsed.data.value);
  } catch {
    // keep as raw string if not valid JSON
  }

  await prisma.platformSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: value as Prisma.InputJsonValue },
    create: { key: parsed.data.key, value: value as Prisma.InputJsonValue }
  });

  revalidatePath("/dashboard/admin/settings");
  return { ok: true };
}
