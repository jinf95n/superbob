import { prisma } from "@/lib/prisma";
import { NotificationListItem, NotificationPayload } from "./types";

export async function getNotificationsForUser(
  userId: string,
): Promise<NotificationListItem[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: (row.payload as NotificationPayload | null) ?? null,
    readAt: row.readAt,
    createdAt: row.createdAt,
  }));
}
