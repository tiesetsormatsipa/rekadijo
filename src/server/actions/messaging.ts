"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** Gets or creates the 1:1 conversation tied to a quotation, adding both buyer and vendor owner as members. */
export async function getOrCreateQuotationConversation(quotationId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { business: true, conversation: true }
  });
  if (!quotation) return { ok: false as const, error: "Quotation not found." };

  const isBuyer = quotation.buyerId === user.id;
  const isVendorSide =
    quotation.business.ownerId === user.id ||
    Boolean(await prisma.businessStaff.findFirst({ where: { businessId: quotation.businessId, userId: user.id } }));
  if (!isBuyer && !isVendorSide) return { ok: false as const, error: "Not authorized." };

  if (quotation.conversation) {
    return { ok: true as const, conversationId: quotation.conversation.id };
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "BUYER_VENDOR",
      quotationId: quotation.id,
      members: {
        create: [{ userId: quotation.buyerId }, { userId: quotation.business.ownerId }]
      }
    }
  });

  return { ok: true as const, conversationId: conversation.id };
}

const sendMessageSchema = z.object({
  conversationId: z.string(),
  body: z.string().min(1).max(2000)
});

export async function sendMessageAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Message can't be empty." };

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: parsed.data.conversationId, userId: user.id } }
  });
  if (!membership) return { ok: false as const, error: "You're not part of this conversation." };

  const message = await prisma.message.create({
    data: { conversationId: parsed.data.conversationId, senderId: user.id, body: parsed.data.body }
  });

  const otherMembers = await prisma.conversationMember.findMany({
    where: { conversationId: parsed.data.conversationId, userId: { not: user.id } }
  });
  for (const member of otherMembers) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        type: "MESSAGE_RECEIVED",
        title: `New message from ${user.firstName}`,
        body: parsed.data.body.slice(0, 120),
        linkUrl: `/dashboard/messages/${parsed.data.conversationId}`
      }
    });
  }

  revalidatePath(`/dashboard/messages/${parsed.data.conversationId}`);
  return { ok: true as const, messageId: message.id };
}

export async function markConversationReadAction(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Please log in." };

  await prisma.conversationMember.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() }
  });
  return { ok: true as const };
}
