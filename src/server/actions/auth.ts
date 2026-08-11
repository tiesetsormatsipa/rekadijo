"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { GlobalRole } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) return { ok: false, error: "Please enter a valid email and password." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return { ok: false, error: "No account found with that email." };

  if (user.status !== "ACTIVE") {
    return { ok: false, error: "This account is not active. Contact support if you believe this is an error." };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: "Incorrect password." };

  await createSession({ userId: user.id, email: user.email, globalRole: user.globalRole });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  redirect(dashboardPathFor(user.globalRole));
}

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["BUYER", "VENDOR_OWNER", "DRIVER"])
});

export async function registerAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    role: formData.get("role")
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      globalRole: parsed.data.role as GlobalRole,
      status: "ACTIVE"
    }
  });

  if (user.globalRole === "DRIVER") {
    await prisma.driverProfile.create({ data: { userId: user.id } });
  }

  await createSession({ userId: user.id, email: user.email, globalRole: user.globalRole });

  if (user.globalRole === "VENDOR_OWNER") {
    redirect("/vendors/join");
  }
  redirect(dashboardPathFor(user.globalRole));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

function dashboardPathFor(role: GlobalRole) {
  switch (role) {
    case "SUPERADMIN":
    case "ADMIN":
      return "/dashboard/admin";
    case "VENDOR_OWNER":
    case "VENDOR_STAFF":
      return "/dashboard/vendor";
    case "DRIVER":
      return "/dashboard/driver";
    default:
      return "/dashboard/buyer";
  }
}
