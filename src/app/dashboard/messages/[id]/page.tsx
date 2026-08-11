import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "./message-thread";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: params.id, userId: user.id } }
  });
  if (!membership) notFound();

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      quotation: { include: { business: true, buyer: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } }
    }
  });
  if (!conversation) notFound();

  const isBuyer = conversation.quotation?.buyerId === user.id;
  const title = isBuyer ? conversation.quotation?.business.name : `${conversation.quotation?.buyer.firstName} ${conversation.quotation?.buyer.lastName}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-semibold text-charcoal-900">{title}</h1>
      {conversation.quotation && (
        <p className="mt-1 text-sm text-charcoal-500">Re: quotation {conversation.quotation.reference}</p>
      )}

      <MessageThread
        conversationId={conversation.id}
        currentUserId={user.id}
        messages={conversation.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          senderName: m.sender.firstName,
          createdAt: m.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
