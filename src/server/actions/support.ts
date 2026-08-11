"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/server/actions/auth";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  topic: z.string().min(1),
  message: z.string().min(5)
});

/**
 * Lightweight support intake: notifies every Admin/SuperAdmin in-app.
 * Once email/SMS providers are wired (see README), this is the natural
 * place to also fire an outbound email to the support inbox.
 */
export async function submitContactRequestAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Please fill in all fields with a valid email." };

  const user = await getCurrentUser();
  const admins = await prisma.user.findMany({ where: { globalRole: { in: ["ADMIN", "SUPERADMIN"] } } });

  await prisma.$transaction(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: "SYSTEM",
          title: `Support request: ${parsed.data.topic}`,
          body: `From ${parsed.data.name} (${parsed.data.email})${user ? ` [account: ${user.email}]` : ""}: ${parsed.data.message}`,
          linkUrl: "/dashboard/admin"
        }
      })
    )
  );

  return { ok: true };
}
