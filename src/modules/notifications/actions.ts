"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MarkNotificationReadActionState,
  MarkNotificationReadInput,
  MarkNotificationReadSchema,
  NotificationPayload,
} from "./types";

/**
 * Helper interno, llamado desde Server Actions de otros módulos (reviews,
 * etc.) para registrar una notificación. No es una acción de usuario.
 */
export async function createNotification(
  userId: string,
  type: string,
  payload: NotificationPayload,
): Promise<void> {
  if (type === "work_confirmed") {
    const existing = await prisma.notification.findFirst({
      where: { userId, type, readAt: null },
      select: { id: true },
    });
    if (existing) return;
  }

  await prisma.notification.create({
    data: { userId, type, payload },
  });
}

export async function markNotificationReadAction(
  input: MarkNotificationReadInput,
): Promise<MarkNotificationReadActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = MarkNotificationReadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Solicitud inválida" };
  }

  const notification = await prisma.notification.findUnique({
    where: { id: parsed.data.notificationId },
    select: { userId: true },
  });

  if (!notification || notification.userId !== session.user.id) {
    return { error: "No encontramos esa notificación" };
  }

  await prisma.notification.update({
    where: { id: parsed.data.notificationId },
    data: { readAt: new Date() },
  });

  return {};
}
