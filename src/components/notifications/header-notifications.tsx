import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationBell } from "@/components/notifications/notification-bell";

/** Bell for dealer / finance / admin shells (pages that skip SiteHeader). */
export async function HeaderNotifications() {
  const session = await auth();
  if (!session?.user) return null;
  if (
    session.user.role !== "DEALER" &&
    session.user.role !== "FINANCE_CO" &&
    session.user.role !== "ADMIN"
  ) {
    return null;
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationBell
      unreadCount={unreadCount}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
