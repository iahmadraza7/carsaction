"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/");
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return { ok: false as const };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/");
  return { ok: true as const };
}
