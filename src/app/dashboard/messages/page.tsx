import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Messages" };

export default async function MessagesListPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          quotation: { include: { business: true, buyer: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      }
    },
    orderBy: { conversation: { updatedAt: "desc" } }
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Messages</h1>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {memberships.length === 0 && (
          <p className="p-6 text-sm text-charcoal-500">
            No conversations yet. Open any quotation and tap &quot;Message&quot; to start one.
          </p>
        )}
        {memberships.map((m) => {
          const isBuyer = m.conversation.quotation?.buyerId === user.id;
          const counterpart = isBuyer ? m.conversation.quotation?.business.name : m.conversation.quotation?.buyer.firstName;
          const lastMessage = m.conversation.messages[0];
          const isUnread = lastMessage && (!m.lastReadAt || lastMessage.createdAt > m.lastReadAt);
          return (
            <Link
              key={m.id}
              href={`/dashboard/messages/${m.conversation.id}`}
              className={`flex items-center justify-between gap-3 p-4 hover:bg-charcoal-50 ${isUnread ? "bg-amber-50/50" : ""}`}
            >
              <div>
                <p className="text-sm font-semibold text-charcoal-900">{counterpart ?? "Conversation"}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-charcoal-500">{lastMessage?.body ?? "No messages yet."}</p>
              </div>
              {lastMessage && (
                <span className="whitespace-nowrap text-xs text-charcoal-400">
                  {new Date(lastMessage.createdAt).toLocaleDateString("en-ZA")}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
