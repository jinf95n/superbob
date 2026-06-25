"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationReadAction } from "@/modules/notifications/actions";
import { NotificationListItem } from "@/modules/notifications/types";

type NotificationItemProps = {
  notification: NotificationListItem;
};

function getNotificationMessage(notification: NotificationListItem): string {
  switch (notification.type) {
    case "review_received":
      return "Un cliente dejó una reseña sobre tu trabajo. Calificalo para que se publique.";
    case "work_confirmed":
      return notification.payload?.message ?? "Nuevo trabajo registrado. ¿Querés dejar una reseña?";
    case "review_published":
      return "Una reseña tuya se publicó en el perfil del profesional.";
    case "work_record_created":
      return notification.payload?.message ?? "Un profesional registró un trabajo con vos.";
    default:
      return notification.payload?.message ?? "";
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const isUnread = !notification.readAt;
  const message = getNotificationMessage(notification);
  const actionUrl = notification.payload?.actionUrl;

  function handleClick() {
    startTransition(async () => {
      await markNotificationReadAction({ notificationId: notification.id });
    });
    if (actionUrl) {
      router.push(actionUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-2xl p-4 text-left text-[15px] ${
        isUnread
          ? "bg-sb-card-blue font-medium text-sb-text"
          : "bg-white text-sb-muted"
      }`}
    >
      <p>{message}</p>
      <p className="mt-1 text-sm text-sb-muted">
        {notification.createdAt.toLocaleDateString("es-AR")}
      </p>
    </button>
  );
}
